import { jsonError, jsonOk } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from("spontaneous_trips")
      .delete()
      .eq("id", params.id);
    if (error) return jsonError(error.message);
    return jsonOk({ success: true });
  } catch {
    return jsonError("Failed to delete spontaneous trip");
  }
}
