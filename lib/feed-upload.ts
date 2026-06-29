import { supabaseAdmin } from "@/lib/supabase";

export async function uploadFeedPhotos(
  photos: { base64: string; filename: string }[]
): Promise<string[]> {
  const urls: string[] = [];

  for (const photo of photos) {
    const base64Data = photo.base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const path = `feed/${Date.now()}-${Math.random().toString(36).slice(2)}-${photo.filename}`;

    const { error } = await supabaseAdmin.storage
      .from("otis-photos")
      .upload(path, buffer, { contentType: "image/jpeg", upsert: false });

    if (error) throw new Error(error.message);

    const { data } = supabaseAdmin.storage.from("otis-photos").getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return urls;
}
