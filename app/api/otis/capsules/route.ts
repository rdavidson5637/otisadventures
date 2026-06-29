import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { getFamilySessionFromRequest, isAdminSessionFromRequest } from "@/lib/family-auth";
import { supabaseAdmin } from "@/lib/supabase";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

async function unlockExpiredCapsules() {
  const today = todayStr();
  await supabaseAdmin
    .from("time_capsules")
    .update({ is_unlocked: true })
    .lte("unlock_date", today)
    .eq("is_unlocked", false);
}

export async function GET(request: Request) {
  try {
    await unlockExpiredCapsules();

    const isAdmin = isAdminSessionFromRequest(request);
    const today = todayStr();

    let query = supabaseAdmin
      .from("time_capsules")
      .select("*, capsule_letters(*)")
      .order("unlock_date", { ascending: true });

    if (!isAdmin) {
      query = query.lte("unlock_date", today);
    }

    const { data, error } = await query;
    if (error) return jsonError(error.message);
    return jsonOk(data ?? []);
  } catch {
    return jsonError("Failed to fetch capsules");
  }
}

export async function POST(request: Request) {
  try {
    if (!isAdminSessionFromRequest(request)) {
      return jsonError("Admin access required", 401);
    }

    const body = await parseBody<{
      title: string;
      unlock_date: string;
      created_by?: string;
    }>(request);

    if (!body?.title || !body?.unlock_date) {
      return jsonError("title and unlock_date required", 400);
    }

    const { data, error } = await supabaseAdmin
      .from("time_capsules")
      .insert({
        title: body.title,
        unlock_date: body.unlock_date,
        created_by: body.created_by ?? "Both",
        is_unlocked: body.unlock_date <= todayStr(),
      })
      .select()
      .single();

    if (error) return jsonError(error.message);
    return jsonOk(data, 201);
  } catch {
    return jsonError("Failed to create capsule");
  }
}
