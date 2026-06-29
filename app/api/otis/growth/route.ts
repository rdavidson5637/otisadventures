import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("growth_entries")
      .select("*")
      .order("measured_date", { ascending: true });

    if (error) return jsonError(error.message);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to fetch growth entries");
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody<{
      height_cm: number;
      measured_date: string;
      note?: string;
      photo_base64?: string;
      photo_filename?: string;
    }>(request);

    if (!body?.height_cm || !body?.measured_date) {
      return jsonError("height_cm and measured_date required", 400);
    }

    let photoUrl: string | null = null;
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
        photoUrl = urlData.publicUrl;
      }
    }

    const { data, error } = await supabaseAdmin
      .from("growth_entries")
      .insert({
        height_cm: body.height_cm,
        measured_date: body.measured_date,
        note: body.note ?? null,
        photo_url: photoUrl,
      })
      .select()
      .single();

    if (error) return jsonError(error.message);
    return jsonOk(data, 201);
  } catch {
    return jsonError("Failed to create growth entry");
  }
}
