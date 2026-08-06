import {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REGION = "us-east-005";

// Below this size we do a single presigned PUT instead of multipart.
const MULTIPART_THRESHOLD = 8 * 1024 * 1024; // 8MB

// Backblaze B2's S3-compatible API (same as AWS S3) requires every part
// except the last to be at least 5MB, and allows at most 10,000 parts per
// upload. To reliably support files up to 200GB+ we can't use a fixed part
// size — a fixed 8MB part size caps a multipart upload at ~80GB
// (10,000 * 8MB). Instead we pick the smallest part size (rounded up to a
// whole MB, minimum 8MB) that keeps the part count under the B2/S3 limit.
const MIN_PART_SIZE = 5 * 1024 * 1024; // B2/S3 hard minimum (except last part)
const DEFAULT_PART_SIZE = 8 * 1024 * 1024; // used for files that don't need bigger parts
const MAX_PARTS = 10_000; // B2/S3 hard limit

interface DownloadUrlOptions {
  expiresInSeconds?: number;
  forceDownloadFilename?: string;
  contentType?: string;
}

export interface PartPlan {
  usesMultipart: boolean;
  partSize: number;
  partCount: number;
}

export interface MultipartPart {
  PartNumber: number;
  ETag: string;
}

const client = new S3Client({
  endpoint: process.env.B2_ENDPOINT!,
  region: REGION,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
  forcePathStyle: false,
});

class StorageService {
  /**
   * Decides whether a file should be uploaded as a single PUT or as a
   * multipart upload, and — for multipart — the part size to use so the
   * part count always stays under B2/S3's 10,000-part ceiling, no matter
   * how large the file is.
   */
  getPartPlan(size: number): PartPlan {
    if (size <= MULTIPART_THRESHOLD) {
      return {
        usesMultipart: false,
        partSize: size,
        partCount: 1,
      };
    }

    let partSize = DEFAULT_PART_SIZE;
    let partCount = Math.ceil(size / partSize);

    if (partCount > MAX_PARTS) {
      // Grow the part size just enough to fit within MAX_PARTS, rounded up
      // to a whole MB for tidiness, and never below B2's minimum part size.
      const requiredPartSize = Math.ceil(size / MAX_PARTS);
      const roundedUp = Math.ceil(requiredPartSize / (1024 * 1024)) * 1024 * 1024;
      partSize = Math.max(roundedUp, MIN_PART_SIZE);
      partCount = Math.ceil(size / partSize);
    }

    return {
      usesMultipart: true,
      partSize,
      partCount,
    };
  }

  async getSignedUploadUrl(key: string, mimeType: string, expires = 900): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME!,
      Key: key,
      ContentType: mimeType,
    });

    return await getSignedUrl(client, command, {
      expiresIn: expires,
    });
  }

  async initMultipartUpload(
    key: string,
    mimeType: string,
    size: number
  ): Promise<{ uploadId: string; partSize: number; partCount: number }> {
    const plan = this.getPartPlan(size);

    const result = await client.send(
      new CreateMultipartUploadCommand({
        Bucket: process.env.B2_BUCKET_NAME!,
        Key: key,
        ContentType: mimeType,
      })
    );

    if (!result.UploadId) {
      throw new Error("Failed to create multipart upload.");
    }

    return {
      uploadId: result.UploadId,
      partSize: plan.partSize,
      partCount: plan.partCount,
    };
  }

  async getSignedPartUrl(key: string, uploadId: string, partNumber: number, expires = 900): Promise<string> {
    return await getSignedUrl(
      client,
      new UploadPartCommand({
        Bucket: process.env.B2_BUCKET_NAME!,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
      }),
      {
        expiresIn: expires,
      }
    );
  }

  async completeMultipartUpload(key: string, uploadId: string, parts: MultipartPart[]): Promise<void> {
    // B2's S3-compatible API requires parts to be listed in ascending
    // PartNumber order — the browser can finish parts out of order when
    // uploading in parallel, so we sort defensively before completing.
    const sortedParts = [...parts].sort((a, b) => a.PartNumber - b.PartNumber);

    await client.send(
      new CompleteMultipartUploadCommand({
        Bucket: process.env.B2_BUCKET_NAME!,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: sortedParts,
        },
      })
    );
  }

  async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    await client.send(
      new AbortMultipartUploadCommand({
        Bucket: process.env.B2_BUCKET_NAME!,
        Key: key,
        UploadId: uploadId,
      })
    );
  }

  async objectExists(key: string): Promise<{ exists: boolean; size?: number }> {
    try {
      const result = await client.send(
        new HeadObjectCommand({
          Bucket: process.env.B2_BUCKET_NAME!,
          Key: key,
        })
      );

      return {
        exists: true,
        size: result.ContentLength,
      };
    } catch {
      return {
        exists: false,
      };
    }
  }

  async getSignedDownloadUrl(key: string, options: DownloadUrlOptions = {}): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME!,
      Key: key,

      ...(options.forceDownloadFilename && {
        ResponseContentDisposition: `attachment; filename="${options.forceDownloadFilename.replace(
          /["\\]/g,
          ""
        )}"`,
      }),

      ...(options.contentType && {
        ResponseContentType: options.contentType,
      }),
    });

    return await getSignedUrl(client, command, {
      expiresIn: options.expiresInSeconds ?? 300,
    });
  }

  async delete(key: string): Promise<void> {
    await client.send(
      new DeleteObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME!,
        Key: key,
      })
    );
  }
}

export const storageService = new StorageService();
