import { logAdminActivity } from "@/lib/activity-log";
import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tripId = url.searchParams.get("trip_id");
    const entryDate = url.searchParams.get("entry_date");
    if (!tripId) return jsonError("trip_id required", 400);

    let query = supabase
      .from("diary_entries")
      .select("*")
      .eq("trip_id", tripId)
      .order("entry_date", { ascending: true });

    if (entryDate) {
      query = query.eq("entry_date", entryDate);
    }

    const { data, error } = await query;
    if (error) return jsonError(error.message);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to fetch diary entries");
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody<{
      trip_id: string;
      entry_date: string;
      time_of_day?: string;
      title?: string;
      note?: string;
      photo_url?: string;
      weather?: string;
      admin_name?: string;
    }>(request);

    if (!body?.trip_id || !body?.entry_date) {
      return jsonError("trip_id and entry_date required", 400);
    }

    const { data, error } = await supabaseAdmin
      .from("diary_entries")
      .insert({
        trip_id: body.trip_id,
        entry_date: body.entry_date,
        time_of_day: body.time_of_day ?? null,
        title: body.title ?? null,
        note: body.note ?? null,
        photo_url: body.photo_url ?? null,
        weather: body.weather ?? null,
      })
      .select()
      .single();

    if (error) return jsonError(error.message);

    if (body.admin_name) {
      await logAdminActivity(
        body.admin_name,
        `added a diary entry for ${body.entry_date}`,
        "diary",
        data.id,
        body.entry_date
      );
    }

    return jsonOk(data, 201);
  } catch {
    return jsonError("Failed to create diary entry");
  }
}
