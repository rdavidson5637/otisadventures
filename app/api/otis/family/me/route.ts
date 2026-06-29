import { jsonError, jsonOk } from "@/lib/api-utils";
import { getFamilySessionFromRequest } from "@/lib/family-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const session = await getFamilySessionFromRequest(request);
    if (!session) {
      return jsonOk({ loggedIn: false, member: null });
    }

    const { data: member, error } = await supabaseAdmin
      .from("family_members")
      .select("id, username, display_name, relationship, location, avatar_url")
      .eq("id", session.memberId)
      .maybeSingle();

    if (error) return jsonError(error.message);
    if (!member) {
      return jsonOk({ loggedIn: false, member: null });
    }

    return jsonOk({
      loggedIn: true,
      member: {
        id: member.id,
        username: member.username,
        displayName: member.display_name,
        relationship: member.relationship,
        location: member.location,
        avatarUrl: member.avatar_url,
      },
    });
  } catch {
    return jsonError("Failed to fetch session");
  }
}
