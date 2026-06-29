import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await parseBody<{ name?: string; emoji?: string }>(request);
    if (!body) return jsonError("Invalid body", 400);

    const { data, error } = await supabaseAdmin
      .from("firsts_categories")
      .update(body)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return jsonError(error.message);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to update category");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from("firsts_categories")
      .delete()
      .eq("id", params.id);

    if (error) return jsonError(error.message);
    return jsonOk({ success: true });
  } catch {
    return jsonError("Failed to delete category");
  }
}
