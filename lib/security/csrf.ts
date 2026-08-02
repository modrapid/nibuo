import { randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const CSRF_COOKIE = "csrf_token";

export async function generateCsrfToken(): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const cookieStore = await cookies();

  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60,
  });

  return token;
}

export async function verifyCsrfToken(submittedToken: string): Promise<boolean> {
  const cookieStore = await cookies();
  const storedToken = cookieStore.get(CSRF_COOKIE)?.value;

  if (!storedToken || !submittedToken) return false;
  if (storedToken.length !== submittedToken.length) return false;

  return timingSafeEqual(Buffer.from(storedToken), Buffer.from(submittedToken));
}
