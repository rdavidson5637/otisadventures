import bcrypt from "bcryptjs";
import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { isAdminSessionFromRequest } from "@/lib/family-auth";
import { supabaseAdmin } from "@/lib/supabase";

const MEMBER_FIELDS =
  "id, username, display_name, relationship, location, avatar_url, lat, lng, created_at";

export async function GET(request: Request) {
  try {
    if (!isAdminSessionFromRequest(request)) {
      return jsonError("Admin access required", 401);
    }

    const { data, error } = await supabaseAdmin
      .from("family_members")
      .select(MEMBER_FIELDS)
      .order("display_name", { ascending: true });

    if (error) return jsonError(error.message);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to fetch family members");
  }
}

export async function POST(request: Request) {
  try {
    if (!isAdminSessionFromRequest(request)) {
      return jsonError("Admin access required", 401);
    }

    const body = await parseBody<{
      username?: string;
      display_name?: string;
      relationship?: string;
      location?: string;
      lat?: number;
      lng?: number;
      password?: string;
    }>(request);

    if (!body?.username || !body?.display_name || !body?.password) {
      return jsonError("username, display_name, and password required", 400);
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const { data, error } = await supabaseAdmin
      .from("family_members")
      .insert({
        username: body.username.toLowerCase(),
        display_name: body.display_name,
        relationship: body.relationship ?? null,
        location: body.location ?? null,
        lat: body.lat ?? null,
        lng: body.lng ?? null,
        password_hash: passwordHash,
      })
      .select(MEMBER_FIELDS)
      .single();

    if (error) return jsonError(error.message);

    await supabaseAdmin.from("family_locations").upsert(
      {
        member_username: data.username,
        display_name: data.display_name,
        current_location: "Northern Ireland",
        timezone: "Europe/London",
        avatar_url: data.avatar_url ?? null,
        relationship: data.relationship ?? null,
        last_updated: new Date().toISOString(),
      },
      { onConflict: "member_username" }
    );

    return jsonOk(data, 201);
  } catch {
    return jsonError("Failed to create family member");
  }
}
