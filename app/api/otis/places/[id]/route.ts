import { logAdminActivity } from "@/lib/activity-log";
import { getAgeAtVisitMonths } from "@/lib/otis-age";
import { OTIS_DOB } from "@/lib/otis-constants";
import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

const ALLOWED_FIELDS = [
  "visited",
  "visited_date",
  "otis_rating",
  "long_description",
  "otis_thoughts",
  "name",
  "location",
  "category",
  "lat",
  "lng",
  "hero_photo_id",
  "age_at_visit_months",
] as const;

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await parseBody<Record<string, unknown> & { admin_name?: string }>(
      request
    );
    if (!body) return jsonError("Invalid body", 400);

    const adminName = body.admin_name as string | undefined;
    const updates: Record<string, unknown> = {};
    for (const field of ALLOWED_FIELDS) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (body.visited === true && body.visited_date) {
      updates.age_at_visit_months = getAgeAtVisitMonths(
        OTIS_DOB,
        body.visited_date as string
      );
    }

    if (Object.keys(updates).length === 0) {
      return jsonError("No valid fields to update", 400);
    }

    const { data, error } = await supabaseAdmin
      .from("places")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return jsonError(error.message);

    if (adminName && "visited" in body && body.visited === true) {
      const placeName = (data.name as string) ?? "a place";
      await logAdminActivity(
        adminName,
        `marked ${placeName} as visited`,
        "place",
        params.id,
        placeName
      );
    }

    return jsonOk(data);
  } catch {
    return jsonError("Failed to update place");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin.from("places").delete().eq("id", params.id);
    if (error) return jsonError(error.message);
    return jsonOk({ success: true });
  } catch {
    return jsonError("Failed to delete place");
  }
}
