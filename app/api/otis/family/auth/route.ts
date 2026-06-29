import bcrypt from "bcryptjs";
import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import {
  FAMILY_SESSION_COOKIE,
  createFamilyToken,
  familySessionCookieOptions,
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

    const { data: member, error } = await supabaseAdmin
      .from("family_members")
      .select("id, username, display_name, password_hash")
      .eq("username", body.username.toLowerCase())
      .maybeSingle();

    if (error) return jsonError(error.message);
    if (!member) {
      return jsonOk({ success: false, message: "Wrong password!" });
    }

    const valid = await bcrypt.compare(body.password, member.password_hash);
    if (!valid) {
      return jsonOk({ success: false, message: "Wrong password!" });
    }

    const token = await createFamilyToken({
      memberId: member.id,
      displayName: member.display_name,
      username: member.username,
    });

    const response = jsonOk({
      success: true,
      member: {
        id: member.id,
        username: member.username,
        displayName: member.display_name,
      },
    });
    response.cookies.set(FAMILY_SESSION_COOKIE, token, familySessionCookieOptions);
    return response;
  } catch {
    return jsonError("Authentication failed");
  }
}
