import { jsonError, jsonOk } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: video, error: fetchError } = await supabaseAdmin
      .from("videos")
      .select("storage_url, thumbnail_url")
      .eq("id", params.id)
      .single();

    if (fetchError) return jsonError(fetchError.message);

    const paths: string[] = [];
    const storagePath = extractStoragePath(video.storage_url);
    if (storagePath) paths.push(storagePath);
    const thumbPath = video.thumbnail_url ? extractStoragePath(video.thumbnail_url) : null;
    if (thumbPath) paths.push(thumbPath);

    if (paths.length) {
      await supabaseAdmin.storage.from("otis-photos").remove(paths);
    }

    const { error } = await supabaseAdmin.from("videos").delete().eq("id", params.id);
    if (error) return jsonError(error.message);

    return jsonOk({ success: true });
  } catch {
    return jsonError("Failed to delete video");
  }
}

function extractStoragePath(url: string): string | null {
  const match = url.match(/otis-photos\/(.+)$/);
  return match ? match[1] : null;
}
