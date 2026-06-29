import { jsonError, jsonOk } from "@/lib/api-utils";
import { isAdminSessionFromRequest } from "@/lib/family-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    if (!isAdminSessionFromRequest(request)) {
      return jsonError("Admin access required", 401);
    }

    const url = new URL(request.url);
    const limit = Math.min(
      Math.max(parseInt(url.searchParams.get("limit") ?? "20", 10) || 20, 1),
      100
    );
    const offset = Math.max(
      parseInt(url.searchParams.get("offset") ?? "0", 10) || 0,
      0
    );
    const adminName = url.searchParams.get("admin_name");
    const entityType = url.searchParams.get("entity_type");

    let query = supabaseAdmin
      .from("admin_activity")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (adminName) {
      query = query.eq("admin_name", adminName);
    }
    if (entityType) {
      query = query.eq("entity_type", entityType);
    }

    const { data, error, count } = await query;

    if (error) return jsonError(error.message);

    return jsonOk({
      items: data ?? [],
      total: count ?? 0,
      limit,
      offset,
    });
  } catch {
    return jsonError("Failed to fetch activity log");
  }
}
