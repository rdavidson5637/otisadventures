import bcrypt from "bcryptjs";
import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
} from "@/lib/family-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await parseBody<{ username?: string; password?: string }>(
      request
    );
    if (!body?.username || !body?.password) {
      return jsonError("Username and password required", 400);
    }

    const { data: admin, error } = await supabaseAdmin
      .from("admins")
      .select("name, password_hash")
      .eq("username", body.username.toLowerCase())
      .maybeSingle();

    if (error) return jsonError(error.message);
    if (!admin) {
      return jsonOk({ success: false, adminName: null });
    }

    const valid = await bcrypt.compare(body.password, admin.password_hash);
    if (!valid) {
      return jsonOk({ success: false, adminName: null });
    }

    const response = jsonOk({ success: true, adminName: admin.name });
    response.cookies.set(ADMIN_SESSION_COOKIE, admin.name, adminSessionCookieOptions);
    return response;
  } catch {
    return jsonError("Authentication failed");
  }
}
