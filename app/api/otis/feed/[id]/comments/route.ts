import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { getFamilySessionFromRequest } from "@/lib/family-auth";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from("feed_comments")
      .select("*")
      .eq("feed_post_id", params.id)
      .order("created_at", { ascending: true });

    if (error) return jsonError(error.message);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to fetch comments");
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getFamilySessionFromRequest(request);
    if (!session) return jsonError("Login required", 401);

    const body = await parseBody<{ message?: string }>(request);
    if (!body?.message?.trim()) return jsonError("Message required", 400);

    const { data, error } = await supabaseAdmin
      .from("feed_comments")
      .insert({
        feed_post_id: params.id,
        author_username: session.username,
        author_display_name: session.displayName,
        message: body.message.trim(),
      })
      .select()
      .single();

    if (error) return jsonError(error.message);
    return jsonOk(data, 201);
  } catch {
    return jsonError("Failed to post comment");
  }
}
