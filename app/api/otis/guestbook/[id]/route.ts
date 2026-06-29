import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { isAdminSessionFromRequest } from "@/lib/family-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAdminSessionFromRequest(request)) {
      return jsonError("Admin access required", 401);
    }

    const body = await parseBody<{ is_pinned?: boolean }>(request);
    if (!body) return jsonError("Invalid body", 400);

    const { data, error } = await supabaseAdmin
      .from("guestbook_entries")
      .update(body)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return jsonError(error.message);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to update guestbook entry");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAdminSessionFromRequest(request)) {
      return jsonError("Admin access required", 401);
    }

    const { error } = await supabaseAdmin
      .from("guestbook_entries")
      .delete()
      .eq("id", params.id);

    if (error) return jsonError(error.message);
    return jsonOk({ success: true });
  } catch {
    return jsonError("Failed to delete guestbook entry");
  }
}
