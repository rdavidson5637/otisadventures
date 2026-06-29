import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase.from("otis_settings").select("*");

    if (error) return jsonError(error.message);

    const settings: Record<string, string> = {};
    for (const row of data ?? []) {
      settings[row.key] = row.value;
    }

    return jsonOk(settings);
  } catch {
    return jsonError("Failed to fetch settings");
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await parseBody<{ key: string; value: string }>(request);

    if (!body?.key || body.value === undefined) {
      return jsonError("key and value required", 400);
    }

    const { data, error } = await supabaseAdmin
      .from("otis_settings")
      .upsert({ key: body.key, value: body.value }, { onConflict: "key" })
      .select()
      .single();

    if (error) return jsonError(error.message);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to update setting");
  }
}
