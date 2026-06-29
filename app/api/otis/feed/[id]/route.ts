import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { isAdminSessionFromRequest } from "@/lib/family-auth";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from("family_feed")
      .select("*, feed_event_types(*)")
      .eq("id", params.id)
      .eq("is_removed", false)
      .single();

    if (error) return jsonError(error.message, 404);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to fetch post");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAdminSessionFromRequest(request)) {
      return jsonError("Admin access required", 401);
    }

    const body = await parseBody<{
      is_removed?: boolean;
      remove_reason?: string;
    }>(request);

    const { data, error } = await supabaseAdmin
      .from("family_feed")
      .update({
        is_removed: body?.is_removed ?? true,
        remove_reason: body?.remove_reason ?? null,
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) return jsonError(error.message);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to update post");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  return PATCH(
    new Request(request.url, {
      method: "PATCH",
      headers: request.headers,
      body: JSON.stringify({ is_removed: true }),
    }),
    { params }
  );
}
