import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");

  // One-time protection so a stranger can't hit this route and rewrite your CORS rules.
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const client = new S3Client({
    endpoint: process.env.B2_ENDPOINT!,
    region: "us-east-005",
    credentials: {
      accessKeyId: process.env.B2_KEY_ID!,
      secretAccessKey: process.env.B2_APPLICATION_KEY!,
    },
  });

  try {
    await client.send(
      new PutBucketCorsCommand({
        Bucket: process.env.B2_BUCKET_NAME!,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: ["https://nibuo.com", "https://www.nibuo.com"],
              AllowedMethods: ["GET", "PUT", "POST", "HEAD", "DELETE"],
              AllowedHeaders: ["*"],
              ExposeHeaders: ["ETag"],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      })
    );

    const check = await client.send(
      new GetBucketCorsCommand({ Bucket: process.env.B2_BUCKET_NAME! })
    );

    return NextResponse.json({
      success: true,
      appliedRules: check.CORSRules,
    });
  } catch (err) {
    console.error("CORS fix error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update CORS rules." },
      { status: 500 }
    );
  }
}
