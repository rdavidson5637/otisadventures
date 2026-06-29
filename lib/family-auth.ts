import { SignJWT, jwtVerify } from "jose";
import {
  ADMIN_SESSION_COOKIE,
  FAMILY_SESSION_COOKIE,
} from "@/lib/session-cookies";

export {
  FAMILY_SESSION_COOKIE,
  ADMIN_SESSION_COOKIE,
  familySessionCookieOptions,
  adminSessionCookieOptions,
} from "@/lib/session-cookies";

export type FamilySessionPayload = {
  memberId: string;
  displayName: string;
  username: string;
};

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET in environment variables");
  }
  return new TextEncoder().encode(secret);
}

export async function createFamilyToken(
  payload: FamilySessionPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyFamilyToken(
  token: string
): Promise<FamilySessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const memberId = payload.memberId as string | undefined;
    const displayName = payload.displayName as string | undefined;
    const username = payload.username as string | undefined;

    if (!memberId || !displayName || !username) return null;

    return { memberId, displayName, username };
  } catch {
    return null;
  }
}

function getCookieValue(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return undefined;

  for (const part of cookieHeader.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return undefined;
}

export async function getFamilySessionFromRequest(
  request: Request
): Promise<FamilySessionPayload | null> {
  const token = getCookieValue(request, FAMILY_SESSION_COOKIE);
  if (!token) return null;
  return verifyFamilyToken(token);
}

export function isAdminSessionFromRequest(request: Request): boolean {
  return getCookieValue(request, ADMIN_SESSION_COOKIE) === "true";
}
