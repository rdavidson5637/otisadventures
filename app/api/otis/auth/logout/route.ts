import { jsonOk } from "@/lib/api-utils";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
} from "@/lib/family-auth";

export async function POST() {
  const response = jsonOk({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    ...adminSessionCookieOptions,
    maxAge: 0,
  });
  return response;
}
