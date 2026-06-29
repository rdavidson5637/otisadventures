import bcrypt from "bcryptjs";
import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import {
  FAMILY_SESSION_COOKIE,
  createFamilyToken,
  familySessionCookieOptions,
} from "@/lib/family-auth";
import { supabaseAdmin } from "@/lib/supabase";

async function findMemberByLogin(login: string) {
  const trimmed = login.trim();
  const username = trimmed.toLowerCase();

  const { data: byUsername } = await supabaseAdmin
    .from("family_members")
    .select("id, username, display_name, password_hash")
    .eq("username", username)
    .maybeSingle();

  if (byUsername) return byUsername;

  const { data: byDisplayName } = await supabaseAdmin
    .from("family_members")
    .select("id, username, display_name, password_hash")
    .ilike("display_name", trimmed)
    .limit(2);

  if (byDisplayName?.length === 1) return byDisplayName[0];
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await parseBody<{ username?: string; password?: string }>(
      request
    );
    if (!body?.username?.trim() || !body?.password) {
      return jsonError("Username and password required", 400);
    }

    const member = await findMemberByLogin(body.username);
    if (!member) {
      return jsonOk({
        success: false,
        message: "No account found — check your username with Dad or Mum",
      });
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
  } catch (e) {
    const message = e instanceof Error ? e.message : "Authentication failed";
    if (message.includes("JWT_SECRET")) {
      return jsonError("Server misconfigured — contact Dad", 500);
    }
    return jsonError("Authentication failed", 500);
  }
}
