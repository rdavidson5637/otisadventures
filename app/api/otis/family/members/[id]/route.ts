import bcrypt from "bcryptjs";
import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { isAdminSessionFromRequest } from "@/lib/family-auth";
import { supabaseAdmin } from "@/lib/supabase";

const MEMBER_FIELDS =
  "id, username, display_name, relationship, location, avatar_url, lat, lng, created_at";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAdminSessionFromRequest(request)) {
      return jsonError("Admin access required", 401);
    }

    const body = await parseBody<{
      display_name?: string;
      relationship?: string;
      location?: string;
      avatar_url?: string;
      lat?: number;
      lng?: number;
      password?: string;
    }>(request);

    if (!body) return jsonError("Invalid body", 400);

    const updates: Record<string, unknown> = {};
    if (body.display_name !== undefined) updates.display_name = body.display_name;
    if (body.relationship !== undefined) updates.relationship = body.relationship;
    if (body.location !== undefined) updates.location = body.location;
    if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;
    if (body.lat !== undefined) updates.lat = body.lat;
    if (body.lng !== undefined) updates.lng = body.lng;
    if (body.password) {
      updates.password_hash = await bcrypt.hash(body.password, 10);
    }

    if (Object.keys(updates).length === 0) {
      return jsonError("No valid fields to update", 400);
    }

    const { data, error } = await supabaseAdmin
      .from("family_members")
      .update(updates)
      .eq("id", params.id)
      .select(MEMBER_FIELDS)
      .single();

    if (error) return jsonError(error.message);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to update family member");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAdminSessionFromRequest(request)) {
      return jsonError("Admin access required", 401);
    }

    const { error } = await supabaseAdmin
      .from("family_members")
      .delete()
      .eq("id", params.id);

    if (error) return jsonError(error.message);
    return jsonOk({ success: true });
  } catch {
    return jsonError("Failed to delete family member");
  }
}
