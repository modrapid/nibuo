import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

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

  getDownloadUrl(fileName: string): string {
    const bucketName = process.env.B2_BUCKET_NAME!;
    const endpoint = process.env.B2_ENDPOINT!.replace("https://", "");
    return `https://${bucketName}.${endpoint}/${encodeURIComponent(fileName)}`;
  }
}

export const storageService: StorageService = new BackblazeS3StorageService();
export type { StorageService, UploadResult };
