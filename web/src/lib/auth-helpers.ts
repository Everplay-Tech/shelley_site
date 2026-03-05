import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "shelley_session";
export const AUTH_COOKIE = "shelley_auth";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.error("[auth] CRITICAL: JWT_SECRET is not set in production!");
}

export const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "shelley-dev-secret-change-in-prod"
);

export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function createAuthToken(
  accountId: number,
  email: string
): Promise<string> {
  return new SignJWT({ accountId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as unknown as { accountId: number; email: string };
}
