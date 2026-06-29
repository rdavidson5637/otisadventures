import { logAdminActivity } from "@/lib/activity-log";
import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { supabase, supabaseAdmin } from "@/lib/supabase";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export async function GET(request: Request) {
  try {
    const placeId = new URL(request.url).searchParams.get("place_id");
    if (!placeId) return jsonError("place_id required", 400);

    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("place_id", placeId)
      .order("created_at", { ascending: false });

    if (error) return jsonError(error.message);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to fetch photos");
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody<{
      base64: string;
      filename: string;
      place_id: string;
      memory_note?: string;
      caption?: string;
      taken_by?: string;
      taken_date?: string;
      admin_name?: string;
      file_size_kb?: number;
    }>(request);

    if (!body?.base64 || !body?.filename || !body?.place_id) {
      return jsonError("base64, filename, and place_id required", 400);
    }

    const base64Data = body.base64.replace(/^data:image\/\w+;base64,/, "");
    const sizeKb =
      body.file_size_kb ??
      Math.round(((base64Data.length * 3) / 4 / 1024) * 10) / 10;
    const sizeBytes = Math.round((base64Data.length * 3) / 4);

    if (sizeBytes > MAX_FILE_SIZE_BYTES) {
      return jsonError("File too large (max 10MB)", 400);
    }

    const buffer = Buffer.from(base64Data, "base64");
    const path = `${body.place_id}/${Date.now()}-${body.filename}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("otis-photos")
      .upload(path, buffer, { contentType: "image/jpeg", upsert: false });

    if (uploadError) return jsonError(uploadError.message);

    const { data: urlData } = supabaseAdmin.storage
      .from("otis-photos")
      .getPublicUrl(path);

    const takenBy = body.admin_name ?? body.taken_by ?? null;

    const { data, error } = await supabaseAdmin
      .from("photos")
      .insert({
        place_id: body.place_id,
        storage_url: urlData.publicUrl,
        memory_note: body.memory_note ?? null,
        caption: body.caption ?? null,
        taken_by: takenBy,
        taken_date: body.taken_date ?? null,
        file_size_kb: Math.round(sizeKb),
      })
      .select()
      .single();

    if (error) return jsonError(error.message);

    if (body.admin_name) {
      const { data: place } = await supabaseAdmin
        .from("places")
        .select("name")
        .eq("id", body.place_id)
        .maybeSingle();

      const placeName = place?.name ?? "a place";
      await logAdminActivity(
        body.admin_name,
        `added 1 photo to ${placeName}`,
        "photo",
        data.id,
        placeName
      );
    }

    return jsonOk(data, 201);
  } catch {
    return jsonError("Failed to upload photo");
  }
}
