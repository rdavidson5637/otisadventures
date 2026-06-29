import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { getFamilySessionFromRequest } from "@/lib/family-auth";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from("diary_reactions")
      .select("*")
      .eq("diary_entry_id", params.id);

    if (error) return jsonError(error.message);
    return jsonOk(data ?? []);
  } catch {
    return jsonError("Failed to fetch diary reactions");
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getFamilySessionFromRequest(request);
    if (!session) {
      return jsonError("Family login required", 401);
    }

    const body = await parseBody<{ emoji: string }>(request);
    if (!body?.emoji) return jsonError("emoji required", 400);

    const { data, error } = await supabaseAdmin
      .from("diary_reactions")
      .insert({
        diary_entry_id: params.id,
        commenter_name: session.displayName,
        emoji: body.emoji,
      })
      .select()
      .single();

    if (error) return jsonError(error.message);
    return jsonOk(data, 201);
  } catch {
    return jsonError("Failed to add reaction");
  }
}
