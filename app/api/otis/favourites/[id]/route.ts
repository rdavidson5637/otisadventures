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

    const body = await parseBody<Record<string, unknown>>(request);
    if (!body) return jsonError("Invalid body", 400);

    if (body.is_current === true && body.category) {
      await supabaseAdmin
        .from("favourite_things")
        .update({ is_current: false })
        .eq("category", body.category as string)
        .eq("is_current", true);
    }

    const { data, error } = await supabaseAdmin
      .from("favourite_things")
      .update(body)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return jsonError(error.message);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to update favourite");
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
      .from("favourite_things")
      .delete()
      .eq("id", params.id);

    if (error) return jsonError(error.message);
    return jsonOk({ success: true });
  } catch {
    return jsonError("Failed to delete favourite");
  }
}
