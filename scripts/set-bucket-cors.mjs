import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

const client = new S3Client({
  endpoint: process.env.B2_ENDPOINT,
  region: "us-east-005",
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
});

// Browser uploads (single PUT + multipart part PUTs) go straight to B2, so
// every origin the upload page can be served from needs to be allowed here
// — including local dev, or presigned PUT requests will fail CORS before
// they ever reach the network tab as anything but a status-0 error.
const allowedOrigins = [
  "https://nibuo.com",
  "https://www.nibuo.com",
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.NEXT_PUBLIC_DEV_URL,
  "http://localhost:3000",
].filter(Boolean);

const command = new PutBucketCorsCommand({
  Bucket: process.env.B2_BUCKET_NAME,
  CORSConfiguration: {
    CORSRules: [
      {
        AllowedOrigins: [...new Set(allowedOrigins)],
        AllowedMethods: ["GET", "PUT", "HEAD"],
        AllowedHeaders: ["*"],
        ExposeHeaders: ["ETag"],
        MaxAgeSeconds: 3600,
      },
    ],
  },
});

await client.send(command);
console.log("CORS rules applied successfully for origins:", [...new Set(allowedOrigins)]);
