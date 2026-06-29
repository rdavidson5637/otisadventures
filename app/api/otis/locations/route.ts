import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { isAdminSessionFromRequest } from "@/lib/family-auth";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("family_locations")
      .select("*")
      .order("display_name");

    if (error) return jsonError(error.message);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to fetch locations");
  }
}

export async function PATCH(request: Request) {
  try {
    if (!isAdminSessionFromRequest(request)) {
      return jsonError("Admin access required", 401);
    }

    const body = await parseBody<
      | {
          member_username: string;
          display_name: string;
          current_location: string;
          location_detail?: string;
          timezone: string;
          lat?: number;
          lng?: number;
          relationship?: string;
          avatar_url?: string;
        }
      | {
          locations: {
            member_username: string;
            display_name: string;
            current_location: string;
            location_detail?: string;
            timezone: string;
            lat?: number;
            lng?: number;
            relationship?: string;
            avatar_url?: string;
          }[];
        }
    >(request);

    if (!body) return jsonError("No location data", 400);

    const rows =
      "locations" in body && Array.isArray(body.locations)
        ? body.locations
        : "member_username" in body
          ? [body]
          : [];

    if (!rows.length) return jsonError("No location data", 400);

    for (const row of rows) {
      const { error } = await supabaseAdmin.from("family_locations").upsert(
        {
          member_username: row.member_username,
          display_name: row.display_name,
          current_location: row.current_location,
          location_detail: row.location_detail ?? null,
          timezone: row.timezone,
          lat: row.lat ?? null,
          lng: row.lng ?? null,
          relationship: row.relationship ?? null,
          avatar_url: row.avatar_url ?? null,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "member_username" }
      );

      if (error) return jsonError(error.message);
    }

    const { data } = await supabaseAdmin
      .from("family_locations")
      .select("*")
      .order("display_name");

    return jsonOk(data);
  } catch {
    return jsonError("Failed to update locations");
  }
}
