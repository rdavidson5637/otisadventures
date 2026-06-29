import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await parseBody<{
      height_cm?: number;
      measured_date?: string;
      note?: string;
      photo_base64?: string;
      photo_filename?: string;
    }>(request);

    if (!body) return jsonError("Invalid body", 400);

    const updates: Record<string, unknown> = {};
    if (body.height_cm !== undefined) updates.height_cm = body.height_cm;
    if (body.measured_date !== undefined) updates.measured_date = body.measured_date;
    if (body.note !== undefined) updates.note = body.note;

    if (body.photo_base64 && body.photo_filename) {
      const base64Data = body.photo_base64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const path = `growth/${Date.now()}-${body.photo_filename}`;

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
      .from("growth_entries")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return jsonError(error.message);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to update growth entry");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from("growth_entries")
      .delete()
      .eq("id", params.id);

    if (error) return jsonError(error.message);
    return jsonOk({ success: true });
  } catch {
    return jsonError("Failed to delete growth entry");
  }
}
