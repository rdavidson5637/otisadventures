import { jsonOk } from "@/lib/api-utils";
import {
  FAMILY_SESSION_COOKIE,
  familySessionCookieOptions,
} from "@/lib/family-auth";

export async function POST() {
  const response = jsonOk({ success: true });
  response.cookies.set(FAMILY_SESSION_COOKIE, "", {
    ...familySessionCookieOptions,
    maxAge: 0,
  });
  return response;
}
