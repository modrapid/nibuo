import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface B2AuthResponse {
  apiInfo: {
    storageApi: {
      apiUrl: string;
    };
  };
  accountId: string;
  authorizationToken: string;
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const keyId = process.env.B2_KEY_ID!;
  const appKey = process.env.B2_APPLICATION_KEY!;
  const bucketName = process.env.B2_BUCKET_NAME!;
  const credentials = Buffer.from(`${keyId}:${appKey}`).toString("base64");

  try {
    // Step 1: authorize with the B2 Native API
    const authRes = await fetch("https://api.backblazeb2.com/b2api/v3/b2_authorize_account", {
      headers: { Authorization: `Basic ${credentials}` },
    });
    if (!authRes.ok) {
      const text = await authRes.text();
      throw new Error(`b2_authorize_account failed: ${text}`);
    }
    const auth: B2AuthResponse = await authRes.json();
    const apiUrl = auth.apiInfo.storageApi.apiUrl;

    // Step 2: find the bucket (need bucketId + bucketType for the update call)
    const listRes = await fetch(`${apiUrl}/b2api/v3/b2_list_buckets`, {
      method: "POST",
      headers: {
        Authorization: auth.authorizationToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accountId: auth.accountId, bucketName }),
    });
    if (!listRes.ok) {
      const text = await listRes.text();
      throw new Error(`b2_list_buckets failed: ${text}`);
    }
    const listData = await listRes.json();
    const bucket = listData.buckets?.[0];
    if (!bucket) throw new Error(`Bucket "${bucketName}" not found.`);

    // Step 3: update the bucket's CORS rules via the Native API,
    // explicitly including upload operations (s3_put, s3_post, b2_upload_file, b2_upload_part).
    const updateRes = await fetch(`${apiUrl}/b2api/v3/b2_update_bucket`, {
      method: "POST",
      headers: {
        Authorization: auth.authorizationToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accountId: auth.accountId,
        bucketId: bucket.bucketId,
        bucketType: bucket.bucketType,
        corsRules: [
          {
            corsRuleName: "nibuoWebUploadAndDownload",
            allowedOrigins: ["https://nibuo.com", "https://www.nibuo.com"],
            allowedOperations: [
              "s3_head",
              "s3_get",
              "s3_put",
              "s3_post",
              "s3_delete",
              "b2_download_file_by_name",
              "b2_download_file_by_id",
              "b2_upload_file",
              "b2_upload_part",
            ],
            allowedHeaders: ["*"],
            exposeHeaders: ["etag"],
            maxAgeSeconds: 3600,
          },
        ],
      }),
    });

    if (!updateRes.ok) {
      const text = await updateRes.text();
      throw new Error(`b2_update_bucket failed: ${text}`);
    }

    const updated = await updateRes.json();
    return NextResponse.json({ success: true, corsRules: updated.corsRules });
  } catch (err) {
    console.error("CORS fix error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update CORS rules." },
      { status: 500 }
    );
  }
}
