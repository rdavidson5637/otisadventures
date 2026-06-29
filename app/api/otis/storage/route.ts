import { jsonError, jsonOk } from "@/lib/api-utils";
import { isAdminSessionFromRequest } from "@/lib/family-auth";
import { supabaseAdmin } from "@/lib/supabase";

const FREE_TIER_MB = 1000;

export async function GET(request: Request) {
  try {
    if (!isAdminSessionFromRequest(request)) {
      return jsonError("Admin access required", 401);
    }

    const [{ data: photos }, { data: videos }] = await Promise.all([
      supabaseAdmin.from("photos").select("file_size_kb"),
      supabaseAdmin.from("videos").select("file_size_kb"),
    ]);

    const photoKb = (photos ?? []).reduce((sum, p) => sum + (p.file_size_kb ?? 0), 0);
    const videoKb = (videos ?? []).reduce((sum, v) => sum + (v.file_size_kb ?? 0), 0);
    const totalMb = Math.round(((photoKb + videoKb) / 1024) * 10) / 10;

    return jsonOk({
      photoMb: Math.round((photoKb / 1024) * 10) / 10,
      videoMb: Math.round((videoKb / 1024) * 10) / 10,
      totalMb,
      limitMb: FREE_TIER_MB,
      percentUsed: Math.round((totalMb / FREE_TIER_MB) * 100),
    });
  } catch {
    return jsonError("Failed to fetch storage stats");
  }
}
