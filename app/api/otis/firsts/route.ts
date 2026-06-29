import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("otis_firsts")
      .select("*, firsts_categories(*)")
      .order("date", { ascending: false });

    if (error) return jsonError(error.message);

    const mapped = (data ?? []).map((f) => ({
      ...f,
      category: f.firsts_categories ?? null,
      firsts_categories: undefined,
    }));

    return jsonOk(mapped);
  } catch {
    return jsonError("Failed to fetch firsts");
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody<{
      category_id?: string;
      title: string;
      description?: string;
      date: string;
      location?: string;
      tags?: string[];
      photo_base64?: string;
      photo_filename?: string;
    }>(request);

    if (!body?.title || !body?.date) {
      return jsonError("title and date required", 400);
    }

    let photoUrl: string | null = null;
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
        photoUrl = urlData.publicUrl;
      }
    }

    const { data, error } = await supabaseAdmin
      .from("otis_firsts")
      .insert({
        category_id: body.category_id ?? null,
        title: body.title,
        description: body.description ?? null,
        date: body.date,
        location: body.location ?? null,
        tags: body.tags ?? null,
        photo_url: photoUrl,
      })
      .select("*, firsts_categories(*)")
      .single();

    if (error) return jsonError(error.message);

    return jsonOk(
      { ...data, category: data.firsts_categories ?? null, firsts_categories: undefined },
      201
    );
  } catch {
    return jsonError("Failed to create first");
  }
}
