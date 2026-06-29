import { logAdminActivity } from "@/lib/activity-log";
import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const tripId = new URL(request.url).searchParams.get("trip_id");
    if (!tripId) return jsonError("trip_id required", 400);

    const { data, error } = await supabase
      .from("food_log")
      .select("*")
      .eq("trip_id", tripId)
      .order("date", { ascending: false });

    if (error) return jsonError(error.message);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to fetch food log");
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody<{
      trip_id: string;
      restaurant_name?: string;
      location?: string;
      date?: string;
      meal_type?: string;
      what_otis_ate?: string;
      otis_rating?: number;
      photo_url?: string;
      note?: string;
      admin_name?: string;
    }>(request);

    if (!body?.trip_id) return jsonError("trip_id required", 400);

    const { data, error } = await supabaseAdmin
      .from("food_log")
      .insert({
        trip_id: body.trip_id,
        restaurant_name: body.restaurant_name ?? null,
        location: body.location ?? null,
        date: body.date ?? null,
        meal_type: body.meal_type ?? null,
        what_otis_ate: body.what_otis_ate ?? null,
        otis_rating: body.otis_rating ?? null,
        photo_url: body.photo_url ?? null,
        note: body.note ?? null,
      })
      .select()
      .single();

    if (error) return jsonError(error.message);

    if (body.admin_name) {
      const restaurantName = body.restaurant_name ?? "a restaurant";
      await logAdminActivity(
        body.admin_name,
        `logged a meal at ${restaurantName}`,
        "food",
        data.id,
        restaurantName
      );
    }

    return jsonOk(data, 201);
  } catch {
    return jsonError("Failed to create food log entry");
  }
}
