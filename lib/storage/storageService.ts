import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

interface ObjectStreamResult {
  body: ReadableStream<Uint8Array>;
  contentLength?: number;
  contentType?: string;
}

interface StorageService {
  upload(buffer: Buffer, fileName: string, mimeType: string): Promise<{ downloadUrl: string }>;
  delete(fileName: string): Promise<void>;
  getSignedDownloadUrl(fileName: string, expiresInSeconds?: number): Promise<string>;
  getSignedUploadUrl(fileName: string, mimeType: string, expiresInSeconds?: number): Promise<string>;
  objectExists(fileName: string): Promise<{ exists: boolean; size?: number }>;
  getObjectStream(fileName: string): Promise<ObjectStreamResult>;
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
  // Server-side upload: used by the /api/upload route which receives the file
  // as a buffer and writes it directly to the bucket.
  async upload(buffer: Buffer, fileName: string, mimeType: string): Promise<{ downloadUrl: string }> {
    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME!,
        Key: fileName,
        Body: buffer,
        ContentType: mimeType,
      })
    );
    const downloadUrl = await this.getSignedDownloadUrl(fileName);
    return { downloadUrl };
  }

  async delete(fileName: string): Promise<void> {
    const client = getS3Client();
    await client.send(
      new DeleteObjectCommand({ Bucket: process.env.B2_BUCKET_NAME!, Key: fileName })
    );
  }

  async getSignedDownloadUrl(fileName: string, expiresInSeconds = 3600): Promise<string> {
    const client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME!,
      Key: fileName,
    });
    return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  }

  // Client uploads directly to this URL — bypasses our server entirely, no size limit.
  async getSignedUploadUrl(fileName: string, mimeType: string, expiresInSeconds = 600): Promise<string> {
    const client = getS3Client();
    const command = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME!,
      Key: fileName,
      ContentType: mimeType,
    });
    return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  }

  // Confirms the object actually landed in the bucket before we trust the client's "done" signal.
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

  async getObjectStream(fileName: string): Promise<ObjectStreamResult> {
    const client = getS3Client();
    const response = await client.send(
      new GetObjectCommand({ Bucket: process.env.B2_BUCKET_NAME!, Key: fileName })
    );
    if (!response.Body) throw new Error("Empty object body returned from storage.");
    const body = await response.Body.transformToWebStream();
    return {
      body: body as ReadableStream<Uint8Array>,
      contentLength: response.ContentLength,
      contentType: response.ContentType,
    };
  }
}

export const storageService: StorageService = new BackblazeS3StorageService();
export type { StorageService };
