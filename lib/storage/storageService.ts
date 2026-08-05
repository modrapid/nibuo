import {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const MULTIPART_THRESHOLD = 8 * 1024 * 1024; // files >= 8MB use multipart
const PART_SIZE = 8 * 1024 * 1024; // 8MB per part (B2 minimum part size is 5MB)

function getS3Client(): S3Client {
  return new S3Client({
    endpoint: process.env.B2_ENDPOINT!,
    region: "us-east-005",
    credentials: {
      accessKeyId: process.env.B2_KEY_ID!,
      secretAccessKey: process.env.B2_APPLICATION_KEY!,
    },
    forcePathStyle: false,
  });
}

interface MultipartInitResult {
  uploadId: string;
  partSize: number;
  partCount: number;
}

interface DownloadUrlOptions {
  expiresInSeconds?: number;
  forceDownloadFilename?: string;
  contentType?: string;
}

class StorageService {
  getPartPlan(fileSize: number): { usesMultipart: boolean; partSize: number; partCount: number } {
    if (fileSize < MULTIPART_THRESHOLD) {
      return { usesMultipart: false, partSize: fileSize, partCount: 1 };
    }
    const partCount = Math.ceil(fileSize / PART_SIZE);
    return { usesMultipart: true, partSize: PART_SIZE, partCount };
  }

  // --- Single-shot upload (small files) ---
  async getSignedUploadUrl(fileName: string, mimeType: string, expiresInSeconds = 600): Promise<string> {
    const client = getS3Client();
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const command = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME!,
      Key: fileName,
      ContentType: mimeType,
    });
    return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  }

  // --- Multipart upload (large files) ---
  async initMultipartUpload(fileName: string, mimeType: string, fileSize: number): Promise<MultipartInitResult> {
    const client = getS3Client();
    const { usesMultipart, partSize, partCount } = this.getPartPlan(fileSize);

    if (!usesMultipart) {
      throw new Error("File is below the multipart threshold; use single-shot upload instead.");
    }

    const result = await client.send(
      new CreateMultipartUploadCommand({
        Bucket: process.env.B2_BUCKET_NAME!,
        Key: fileName,
        ContentType: mimeType,
      })
    );

    if (!result.UploadId) throw new Error("Failed to initiate multipart upload.");

    return { uploadId: result.UploadId, partSize, partCount };
  }

  async getSignedPartUrl(
    fileName: string,
    uploadId: string,
    partNumber: number,
    expiresInSeconds = 900
  ): Promise<string> {
    const client = getS3Client();
    const command = new UploadPartCommand({
      Bucket: process.env.B2_BUCKET_NAME!,
      Key: fileName,
      UploadId: uploadId,
      PartNumber: partNumber,
    });
    return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  }

  async completeMultipartUpload(
    fileName: string,
    uploadId: string,
    parts: { PartNumber: number; ETag: string }[]
  ): Promise<void> {
    const client = getS3Client();
    await client.send(
      new CompleteMultipartUploadCommand({
        Bucket: process.env.B2_BUCKET_NAME!,
        Key: fileName,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      })
    );
  }

  async abortMultipartUpload(fileName: string, uploadId: string): Promise<void> {
    const client = getS3Client();
    await client.send(
      new AbortMultipartUploadCommand({
        Bucket: process.env.B2_BUCKET_NAME!,
        Key: fileName,
        UploadId: uploadId,
      })
    );
  }

  // --- Post-upload verification ---
  async objectExists(fileName: string): Promise<{ exists: boolean; size?: number }> {
    const client = getS3Client();
    try {
      const res = await client.send(
        new HeadObjectCommand({ Bucket: process.env.B2_BUCKET_NAME!, Key: fileName })
      );
      return { exists: true, size: res.ContentLength };
    } catch {
      return { exists: false };
    }
  }

  // --- Download / preview ---
  async getSignedDownloadUrl(fileName: string, options: DownloadUrlOptions = {}): Promise<string> {
    const client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME!,
      Key: fileName,
      ...(options.forceDownloadFilename && {
        ResponseContentDisposition: `attachment; filename="${options.forceDownloadFilename.replace(
          /["\\]/g,
          ""
        )}"`,
      }),
      ...(options.contentType && { ResponseContentType: options.contentType }),
    });
    return getSignedUrl(client, command, { expiresIn: options.expiresInSeconds ?? 300 });
  }

  async delete(fileName: string): Promise<void> {
    const client = getS3Client();
    await client.send(
      new DeleteObjectCommand({ Bucket: process.env.B2_BUCKET_NAME!, Key: fileName })
    );
  }
}

export const storageService = new StorageService();
