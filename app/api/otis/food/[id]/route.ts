import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

const ALLOWED_FIELDS = ["lat", "lng", "restaurant_name", "location", "date", "meal_type", "what_otis_ate", "otis_rating", "photo_url", "note"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await parseBody<Record<string, unknown>>(request);
    if (!body) return jsonError("Invalid body", 400);

    const updates: Record<string, unknown> = {};
    for (const field of ALLOWED_FIELDS) {
      if (field in body) updates[field] = body[field];
    }

    const { data, error } = await supabaseAdmin
      .from("food_log")
      .update(Object.keys(updates).length ? updates : body)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return jsonError(error.message);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to update food log entry");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin.from("food_log").delete().eq("id", params.id);
    if (error) return jsonError(error.message);
    return jsonOk({ success: true });
  } catch {
    return jsonError("Failed to delete food log entry");
  }
}
