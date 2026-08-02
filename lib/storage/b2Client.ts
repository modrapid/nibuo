interface B2AuthResponse {
  authorizationToken: string;
  apiUrl: string;
  downloadUrl: string;
  allowed: {
    bucketId: string;
  };
}

interface B2UploadUrlResponse {
  uploadUrl: string;
  authorizationToken: string;
}

let cachedAuth: { data: B2AuthResponse; expiresAt: number } | null = null;

async function authorizeB2(): Promise<B2AuthResponse> {
  if (cachedAuth && cachedAuth.expiresAt > Date.now()) {
    return cachedAuth.data;
  }

  const keyId = process.env.B2_KEY_ID!;
  const appKey = process.env.B2_APPLICATION_KEY!;
  const credentials = Buffer.from(`${keyId}:${appKey}`).toString("base64");

  const res = await fetch("https://api.backblazeb2.com/b2api/v3/b2_authorize_account", {
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (!res.ok) throw new Error("Failed to authorize with Backblaze B2.");

  const data = await res.json();
  const authData: B2AuthResponse = {
    authorizationToken: data.authorizationToken,
    apiUrl: data.apiInfo.storageApi.apiUrl,
    downloadUrl: data.apiInfo.storageApi.downloadUrl,
    allowed: { bucketId: data.apiInfo.storageApi.bucketId ?? process.env.B2_BUCKET_ID! },
  };

  // Cache for 23 hours (tokens last 24h)
  cachedAuth = { data: authData, expiresAt: Date.now() + 23 * 60 * 60 * 1000 };
  return authData;
}

async function getUploadUrl(auth: B2AuthResponse): Promise<B2UploadUrlResponse> {
  const res = await fetch(`${auth.apiUrl}/b2api/v3/b2_get_upload_url`, {
    method: "POST",
    headers: {
      Authorization: auth.authorizationToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ bucketId: auth.allowed.bucketId }),
  });

  if (!res.ok) throw new Error("Failed to get B2 upload URL.");
  return res.json();
}

export { authorizeB2, getUploadUrl };
export type { B2AuthResponse, B2UploadUrlResponse };
