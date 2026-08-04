import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

interface UploadResult {
  fileId: string;
  fileName: string;
  downloadUrl: string;
  size: number;
}

interface StorageService {
  upload(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult>;
  delete(fileName: string): Promise<void>;
  getDownloadUrl(fileName: string): string;
  getSignedDownloadUrl(fileName: string, expiresInSeconds?: number): Promise<string>;
}

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

class BackblazeS3StorageService implements StorageService {
  async upload(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult> {
    const client = getS3Client();
    const bucketName = process.env.B2_BUCKET_NAME!;

    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: mimeType,
      })
    );

    return {
      fileId: fileName,
      fileName,
      downloadUrl: this.getDownloadUrl(fileName),
      size: buffer.length,
    };
  }

  async delete(fileName: string): Promise<void> {
    const client = getS3Client();
    const bucketName = process.env.B2_BUCKET_NAME!;

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      })
    );
  }

  // Stored in the DB for reference only — not directly browsable since the bucket is private.
  getDownloadUrl(fileName: string): string {
    const bucketName = process.env.B2_BUCKET_NAME!;
    const endpoint = process.env.B2_ENDPOINT!.replace("https://", "");
    return `https://${bucketName}.${endpoint}/${encodeURIComponent(fileName)}`;
  }

  // Generates a temporary, signed URL that works even on a private bucket.
  async getSignedDownloadUrl(fileName: string, expiresInSeconds = 3600): Promise<string> {
    const client = getS3Client();
    const bucketName = process.env.B2_BUCKET_NAME!;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });

    return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  }
}

export const storageService: StorageService = new BackblazeS3StorageService();
export type { StorageService, UploadResult };
