import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const placeId = new URL(request.url).searchParams.get("place_id");
    if (!placeId) return jsonError("place_id required", 400);

    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("place_id", placeId)
      .order("created_at", { ascending: true });

    if (error) return jsonError(error.message);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to fetch comments");
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody<{
      place_id: string;
      commenter_name: string;
      message: string;
    }>(request);

    if (!body?.place_id || !body?.commenter_name || !body?.message) {
      return jsonError("place_id, commenter_name, and message required", 400);
    }

    const { data, error } = await supabaseAdmin
      .from("comments")
      .insert({
        place_id: body.place_id,
        commenter_name: body.commenter_name,
        message: body.message,
      })
      .select()
      .single();

    if (error) return jsonError(error.message);
    return jsonOk(data, 201);
  } catch {
    return jsonError("Failed to create comment");
  }
}
