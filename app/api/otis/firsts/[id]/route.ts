import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await parseBody<{
      category_id?: string;
      title?: string;
      description?: string;
      date?: string;
      location?: string;
      tags?: string[];
      photo_base64?: string;
      photo_filename?: string;
    }>(request);

    if (!body) return jsonError("Invalid body", 400);

    const updates: Record<string, unknown> = {};
    if (body.category_id !== undefined) updates.category_id = body.category_id;
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.date !== undefined) updates.date = body.date;
    if (body.location !== undefined) updates.location = body.location;
    if (body.tags !== undefined) updates.tags = body.tags;

    if (body.photo_base64 && body.photo_filename) {
      const base64Data = body.photo_base64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const path = `firsts/${Date.now()}-${body.photo_filename}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("otis-photos")
        .upload(path, buffer, { contentType: "image/jpeg", upsert: false });

      if (!uploadError) {
        const { data: urlData } = supabaseAdmin.storage
          .from("otis-photos")
          .getPublicUrl(path);
        updates.photo_url = urlData.publicUrl;
      }
    }

    const { data, error } = await supabaseAdmin
      .from("otis_firsts")
      .update(updates)
      .eq("id", params.id)
      .select("*, firsts_categories(*)")
      .single();

    if (error) return jsonError(error.message);

    return jsonOk({
      ...data,
      category: data.firsts_categories ?? null,
      firsts_categories: undefined,
    });
  } catch {
    return jsonError("Failed to update first");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from("otis_firsts")
      .delete()
      .eq("id", params.id);

    if (error) return jsonError(error.message);
    return jsonOk({ success: true });
  } catch {
    return jsonError("Failed to delete first");
  }
}
