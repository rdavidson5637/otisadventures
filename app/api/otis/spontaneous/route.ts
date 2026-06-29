import { logAdminActivity } from "@/lib/activity-log";
import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const tripId = new URL(request.url).searchParams.get("trip_id");
    if (!tripId) return jsonError("trip_id required", 400);

    const { data, error } = await supabase
      .from("spontaneous_trips")
      .select("*")
      .eq("trip_id", tripId)
      .order("date", { ascending: false });

    if (error) return jsonError(error.message);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to fetch spontaneous trips");
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody<{
      trip_id: string;
      name: string;
      location?: string;
      date?: string;
      note?: string;
      photos?: string[];
      admin_name?: string;
    }>(request);

    if (!body?.trip_id || !body?.name) {
      return jsonError("trip_id and name required", 400);
    }

    const { data, error } = await supabaseAdmin
      .from("spontaneous_trips")
      .insert({
        trip_id: body.trip_id,
        name: body.name,
        location: body.location ?? null,
        date: body.date ?? null,
        note: body.note ?? null,
        photos: body.photos ?? [],
      })
      .select()
      .single();

    if (error) return jsonError(error.message);

    if (body.admin_name) {
      await logAdminActivity(
        body.admin_name,
        `added a spontaneous trip: ${body.name}`,
        "trip",
        data.id,
        body.name
      );
    }

    return jsonOk(data, 201);
  } catch {
    return jsonError("Failed to create spontaneous trip");
  }
}
