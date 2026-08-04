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

interface ObjectStreamResult {
  body: ReadableStream<Uint8Array>;
  contentLength?: number;
  contentType?: string;
}

interface StorageService {
  upload(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult>;
  delete(fileName: string): Promise<void>;
  getSignedDownloadUrl(fileName: string, expiresInSeconds?: number): Promise<string>;
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
      downloadUrl: "", // Not used directly anymore — see getSignedDownloadUrl / getObjectStream
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

  // Used ONLY for preview (<img>/<video>/<iframe> src). Short-lived, never stored permanently.
  async getSignedDownloadUrl(fileName: string, expiresInSeconds = 3600): Promise<string> {
    const client = getS3Client();
    const bucketName = process.env.B2_BUCKET_NAME!;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });

    return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  }

  // Used for the secure download API route — streams the object through our own server,
  // so the browser never sees or connects to the B2/S3 bucket at all.
  async getObjectStream(fileName: string): Promise<ObjectStreamResult> {
    const client = getS3Client();
    const bucketName = process.env.B2_BUCKET_NAME!;

    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      })
    );

    if (!response.Body) {
      throw new Error("Empty object body returned from storage.");
    }

    const body = await response.Body.transformToWebStream();

    return {
      body: body as ReadableStream<Uint8Array>,
      contentLength: response.ContentLength,
      contentType: response.ContentType,
    };
  }
}

export const storageService: StorageService = new BackblazeS3StorageService();
export type { StorageService, UploadResult };
