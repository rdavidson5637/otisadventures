import { jsonError, jsonOk } from "@/lib/api-utils";
import { supabase } from "@/lib/supabase";

const FIELDS =
  "id, username, display_name, relationship, location, avatar_url, lat, lng, created_at";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("family_members")
      .select(FIELDS)
      .order("display_name", { ascending: true });

    if (error) return jsonError(error.message);
    return jsonOk(data ?? []);
  } catch {
    return jsonError("Failed to fetch family map data");
  }
}
