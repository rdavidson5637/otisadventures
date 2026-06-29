import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { isAdminSessionFromRequest } from "@/lib/family-auth";
import { supabaseAdmin } from "@/lib/supabase";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = isAdminSessionFromRequest(request);

    const { data: capsule, error } = await supabaseAdmin
      .from("time_capsules")
      .select("*, capsule_letters(*)")
      .eq("id", params.id)
      .single();

    if (error) return jsonError(error.message);
    if (!isAdmin && capsule.unlock_date > todayStr()) {
      return jsonError("Capsule is still locked", 403);
    }

    if (capsule.unlock_date <= todayStr() && !capsule.is_unlocked) {
      await supabaseAdmin
        .from("time_capsules")
        .update({ is_unlocked: true })
        .eq("id", params.id);
      capsule.is_unlocked = true;
    }

    return jsonOk(capsule);
  } catch {
    return jsonError("Failed to fetch capsule");
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

    const body = await parseBody<{ title?: string; unlock_date?: string }>(request);
    if (!body) return jsonError("Invalid body", 400);

    const updates: Record<string, unknown> = { ...body };
    if (body.unlock_date && body.unlock_date <= todayStr()) {
      updates.is_unlocked = true;
    }

    const { data, error } = await supabaseAdmin
      .from("time_capsules")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return jsonError(error.message);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to update capsule");
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
      .from("time_capsules")
      .delete()
      .eq("id", params.id);

    if (error) return jsonError(error.message);
    return jsonOk({ success: true });
  } catch {
    return jsonError("Failed to delete capsule");
  }
}
