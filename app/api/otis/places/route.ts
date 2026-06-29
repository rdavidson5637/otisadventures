import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const tripId = new URL(request.url).searchParams.get("trip_id");
    if (!tripId) return jsonError("trip_id required", 400);

    const { data, error } = await supabase
      .from("places")
      .select("*")
      .eq("trip_id", tripId)
      .order("name");

    if (error) return jsonError(error.message);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to fetch places");
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody<{
      trip_id: string;
      name: string;
      location?: string;
      category?: string;
      long_description?: string;
      lat?: number;
      lng?: number;
    }>(request);

    if (!body?.trip_id || !body?.name) {
      return jsonError("trip_id and name required", 400);
    }

    const { data, error } = await supabaseAdmin
      .from("places")
      .insert({
        trip_id: body.trip_id,
        name: body.name,
        location: body.location ?? null,
        category: body.category ?? null,
        long_description: body.long_description ?? null,
        lat: body.lat ?? null,
        lng: body.lng ?? null,
        visited: false,
      })
      .select()
      .single();

    if (error) return jsonError(error.message);
    return jsonOk(data, 201);
  } catch {
    return jsonError("Failed to create place");
  }
}
