import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { supabase, supabaseAdmin } from "@/lib/supabase";

const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const placeId = url.searchParams.get("place_id");
    const tripId = url.searchParams.get("trip_id");
    const all = url.searchParams.get("all");

    if (all === "true") {
      const { data, error } = await supabase
        .from("videos")
        .select("*, places(name), trips(name, slug)")
        .order("created_at", { ascending: false });

      if (error) return jsonError(error.message);

      const mapped = (data ?? []).map((v) => ({
        ...v,
        place_name: v.places?.name ?? null,
        trip_name: v.trips?.name ?? null,
        trip_slug: v.trips?.slug ?? null,
        places: undefined,
        trips: undefined,
      }));

      return jsonOk(mapped);
    }

    if (placeId) {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("place_id", placeId)
        .maybeSingle();

      if (error) return jsonError(error.message);
      return jsonOk(data);
    }

    if (tripId) {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false });

      if (error) return jsonError(error.message);
      return jsonOk(data);
    }

    return jsonError("place_id, trip_id, or all=true required", 400);
  } catch {
    return jsonError("Failed to fetch videos");
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody<{
      base64: string;
      filename: string;
      mime_type?: string;
      place_id?: string;
      trip_id?: string;
      caption?: string;
      taken_by?: string;
      taken_date?: string;
      duration_seconds?: number;
      thumbnail_base64?: string;
    }>(request);

    if (!body?.base64 || !body?.filename) {
      return jsonError("base64 and filename required", 400);
    }

    if (!body.place_id && !body.trip_id) {
      return jsonError("place_id or trip_id required", 400);
    }

    const mimeType = body.mime_type ?? "video/mp4";
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return jsonError("Only mp4, mov, and webm videos are allowed", 400);
    }

    const base64Data = body.base64.replace(/^data:video\/\w+;base64,/, "");
    const sizeKb = Math.round((base64Data.length * 3) / 4 / 1024);

    if (sizeKb > 100 * 1024) {
      return jsonError("Video too large (max 100MB)", 400);
    }

    if (body.place_id) {
      const { data: existing } = await supabaseAdmin
        .from("videos")
        .select("id, storage_url")
        .eq("place_id", body.place_id)
        .maybeSingle();

      if (existing) {
        await supabaseAdmin.from("videos").delete().eq("id", existing.id);
        const oldPath = extractStoragePath(existing.storage_url);
        if (oldPath) {
          await supabaseAdmin.storage.from("otis-photos").remove([oldPath]);
        }
      }
    }

    const buffer = Buffer.from(base64Data, "base64");
    const path = `videos/${body.place_id ?? body.trip_id}/${Date.now()}-${body.filename}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("otis-photos")
      .upload(path, buffer, { contentType: mimeType, upsert: false });

    if (uploadError) return jsonError(uploadError.message);

    const { data: urlData } = supabaseAdmin.storage
      .from("otis-photos")
      .getPublicUrl(path);

    let thumbnailUrl: string | null = null;
    if (body.thumbnail_base64) {
      const thumbData = body.thumbnail_base64.replace(/^data:image\/\w+;base64,/, "");
      const thumbPath = `videos/thumbnails/${Date.now()}-thumb.jpg`;
      const thumbBuffer = Buffer.from(thumbData, "base64");
      const { error: thumbError } = await supabaseAdmin.storage
        .from("otis-photos")
        .upload(thumbPath, thumbBuffer, { contentType: "image/jpeg", upsert: false });

      if (!thumbError) {
        const { data: thumbUrl } = supabaseAdmin.storage
          .from("otis-photos")
          .getPublicUrl(thumbPath);
        thumbnailUrl = thumbUrl.publicUrl;
      }
    }

    const { data, error } = await supabaseAdmin
      .from("videos")
      .insert({
        place_id: body.place_id ?? null,
        trip_id: body.trip_id ?? null,
        storage_url: urlData.publicUrl,
        thumbnail_url: thumbnailUrl,
        caption: body.caption ?? null,
        taken_by: body.taken_by ?? null,
        taken_date: body.taken_date ?? null,
        duration_seconds: body.duration_seconds ?? null,
        file_size_kb: sizeKb,
      })
      .select()
      .single();

    if (error) return jsonError(error.message);
    return jsonOk(data, 201);
  } catch {
    return jsonError("Failed to upload video");
  }
}

function extractStoragePath(url: string): string | null {
  const match = url.match(/otis-photos\/(.+)$/);
  return match ? match[1] : null;
}
