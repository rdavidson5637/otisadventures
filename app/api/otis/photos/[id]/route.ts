import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

const ALLOWED_FIELDS = [
  "caption",
  "memory_note",
  "is_hero_shot",
  "is_trip_highlight",
  "taken_by",
  "taken_date",
] as const;

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

    if (Object.keys(updates).length === 0) {
      return jsonError("No valid fields to update", 400);
    }

    const { data: photo, error: fetchError } = await supabaseAdmin
      .from("photos")
      .select("place_id")
      .eq("id", params.id)
      .single();

    if (fetchError) return jsonError(fetchError.message);

    if (body.is_hero_shot === true && photo?.place_id) {
      await supabaseAdmin
        .from("photos")
        .update({ is_hero_shot: false })
        .eq("place_id", photo.place_id);

      await supabaseAdmin
        .from("places")
        .update({ hero_photo_id: params.id })
        .eq("id", photo.place_id);
    }

    if (body.is_trip_highlight === true && photo?.place_id) {
      const { data: place } = await supabaseAdmin
        .from("places")
        .select("trip_id")
        .eq("id", photo.place_id)
        .single();

      if (place?.trip_id) {
        await supabaseAdmin
          .from("photos")
          .update({ is_trip_highlight: false })
          .eq("place_id", photo.place_id);

        const { data: updatedPhoto } = await supabaseAdmin
          .from("photos")
          .select("storage_url")
          .eq("id", params.id)
          .single();

        if (updatedPhoto?.storage_url) {
          await supabaseAdmin
            .from("trips")
            .update({ hero_photo_url: updatedPhoto.storage_url })
            .eq("id", place.trip_id);
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from("photos")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return jsonError(error.message);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to update photo");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: photo, error: fetchError } = await supabaseAdmin
      .from("photos")
      .select("storage_url")
      .eq("id", params.id)
      .single();

    if (fetchError) return jsonError(fetchError.message);

    if (photo?.storage_url) {
      const url = new URL(photo.storage_url);
      const pathParts = url.pathname.split("/otis-photos/");
      if (pathParts[1]) {
        await supabaseAdmin.storage.from("otis-photos").remove([pathParts[1]]);
      }
    }

    const { error } = await supabaseAdmin.from("photos").delete().eq("id", params.id);
    if (error) return jsonError(error.message);
    return jsonOk({ success: true });
  } catch {
    return jsonError("Failed to delete photo");
  }
}
