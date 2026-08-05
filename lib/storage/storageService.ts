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
const MULTIPART_THRESHOLD = 8 * 1024 * 1024;
const PART_SIZE = 8 * 1024 * 1024;

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
  getPartPlan(size: number) {
    if (size < MULTIPART_THRESHOLD) {
      return {
        usesMultipart: false,
        partSize: size,
        partCount: 1,
      };
    }

    return {
      usesMultipart: true,
      partSize: PART_SIZE,
      partCount: Math.ceil(size / PART_SIZE),
    };
  }

  async getSignedUploadUrl(
    key: string,
    mimeType: string,
    expires = 900
  ) {
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
  ) {
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

  async getSignedPartUrl(
    key: string,
    uploadId: string,
    partNumber: number
  ) {
    return await getSignedUrl(
      client,
      new UploadPartCommand({
        Bucket: process.env.B2_BUCKET_NAME!,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
      }),
      {
        expiresIn: 900,
      }
    );
  }

  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: {
      PartNumber: number;
      ETag: string;
    }[]
  ) {
    await client.send(
      new CompleteMultipartUploadCommand({
        Bucket: process.env.B2_BUCKET_NAME!,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts,
        },
      })
    );
  }

  async abortMultipartUpload(
    key: string,
    uploadId: string
  ) {
    await client.send(
      new AbortMultipartUploadCommand({
        Bucket: process.env.B2_BUCKET_NAME!,
        Key: key,
        UploadId: uploadId,
      })
    );
  }

  async objectExists(key: string) {
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

  async getSignedDownloadUrl(
    key: string,
    expires = 300
  ) {
    return await getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME!,
        Key: key,
      }),
      {
        expiresIn: expires,
      }
    );
  }

  async delete(key: string) {
    await client.send(
      new DeleteObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME!,
        Key: key,
      })
    );
  }
}

export const storageService = new StorageService();
