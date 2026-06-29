import { differenceInMonths, parseISO } from "date-fns";
import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { isAdminSessionFromRequest } from "@/lib/family-auth";
import { haversineDistance } from "@/lib/haversine";
import { OTIS_DOB } from "@/lib/otis-constants";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: { year: string } }
) {
  try {
    const year = parseInt(params.year, 10);
    if (isNaN(year)) return jsonError("Invalid year", 400);

    const isAdmin = isAdminSessionFromRequest(request);
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    const { data: review, error: reviewError } = await supabase
      .from("year_reviews")
      .select("*")
      .eq("year", year)
      .maybeSingle();

    if (reviewError) return jsonError(reviewError.message);
    if (!review) return jsonError("Year review not found", 404);
    if (!review.published && !isAdmin) {
      return jsonError("Year review not published", 403);
    }

    const [
      tripsRes,
      placesRes,
      diaryRes,
      foodRes,
      firstsRes,
      favouritesRes,
      growthRes,
      guestbookRes,
      settingsRes,
    ] = await Promise.all([
      supabase
        .from("trips")
        .select("*")
        .gte("start_date", yearStart)
        .lte("start_date", yearEnd),
      supabase.from("places").select("*, trips!inner(start_date)").eq("visited", true),
      supabase
        .from("diary_entries")
        .select("*")
        .gte("entry_date", yearStart)
        .lte("entry_date", yearEnd),
      supabase
        .from("food_log")
        .select("*")
        .gte("date", yearStart)
        .lte("date", yearEnd),
      supabase
        .from("otis_firsts")
        .select("*, firsts_categories(*)")
        .gte("date", yearStart)
        .lte("date", yearEnd),
      supabase
        .from("favourite_things")
        .select("*")
        .eq("is_current", true)
        .lte("date_logged", yearEnd),
      supabase
        .from("growth_entries")
        .select("*")
        .order("measured_date", { ascending: true }),
      supabase
        .from("guestbook_entries")
        .select("*")
        .gte("created_at", yearStart)
        .lte("created_at", `${yearEnd}T23:59:59`),
      supabase.from("otis_settings").select("*"),
    ]);

    const trips = tripsRes.data ?? [];
    const placesInYear = (placesRes.data ?? []).filter((p) => {
      const sd = (p.trips as { start_date?: string })?.start_date;
      return sd && sd >= yearStart && sd <= yearEnd;
    });

    const diaryEntries = diaryRes.data ?? [];
    const foodEntries = foodRes.data ?? [];

    let photoCount = 0;
    if (placesInYear.length) {
      const placeIds = placesInYear.map((p) => p.id);
      const { count } = await supabase
        .from("photos")
        .select("*", { count: "exact", head: true })
        .in("place_id", placeIds);
      photoCount = count ?? 0;
    }

    const categoryCounts: Record<string, number> = {};
    for (const p of placesInYear) {
      if (p.category) {
        categoryCounts[p.category] = (categoryCounts[p.category] ?? 0) + 1;
      }
    }
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const bestMeal = [...foodEntries]
      .filter((f) => f.otis_rating != null)
      .sort((a, b) => (b.otis_rating ?? 0) - (a.otis_rating ?? 0))[0] ?? null;

    const sortedTrips = [...trips].sort((a, b) => {
      const da = a.start_date ? new Date(a.start_date).getTime() : 0;
      const db = b.start_date ? new Date(b.start_date).getTime() : 0;
      return da - db;
    });

    let totalMiles = 0;
    for (let i = 1; i < sortedTrips.length; i++) {
      const prev = sortedTrips[i - 1];
      const curr = sortedTrips[i];
      if (
        prev.centre_lat != null &&
        prev.centre_lng != null &&
        curr.centre_lat != null &&
        curr.centre_lng != null
      ) {
        totalMiles += haversineDistance(
          prev.centre_lat,
          prev.centre_lng,
          curr.centre_lat,
          curr.centre_lng
        );
      }
    }

    const settings: Record<string, string> = {};
    for (const row of settingsRes.data ?? []) {
      settings[row.key] = row.value;
    }
    const dob = OTIS_DOB;

    let ageAtStart = "";
    let ageAtEnd = "";
    ageAtStart = `${differenceInMonths(parseISO(yearStart), parseISO(dob))} months`;
    ageAtEnd = `${differenceInMonths(parseISO(yearEnd), parseISO(dob))} months`;

    const growthInYear = (growthRes.data ?? []).filter(
      (g) => g.measured_date >= yearStart && g.measured_date <= yearEnd
    );
    const growthDelta =
      growthInYear.length >= 2
        ? growthInYear[growthInYear.length - 1].height_cm - growthInYear[0].height_cm
        : null;

    const diaryIds = diaryEntries.map((d) => d.id);
    let favouriteMoment = null;
    let diaryReactions: { diary_entry_id: string; emoji: string; commenter_name: string }[] = [];

    if (diaryIds.length) {
      const { data: reactions } = await supabase
        .from("diary_reactions")
        .select("*")
        .in("diary_entry_id", diaryIds);
      diaryReactions = reactions ?? [];

      const reactionCounts: Record<string, number> = {};
      for (const r of diaryReactions) {
        reactionCounts[r.diary_entry_id] = (reactionCounts[r.diary_entry_id] ?? 0) + 1;
      }

      const topEntryId =
        review.favourite_moment_id ??
        Object.entries(reactionCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

      if (topEntryId) {
        favouriteMoment = diaryEntries.find((d) => d.id === topEntryId) ?? null;
      }
    }

    const placeIds = placesInYear.map((p) => p.id);
    let topPhotos: { id: string; storage_url: string; reaction_count: number }[] = [];
    if (placeIds.length) {
      const { data: photos } = await supabase
        .from("photos")
        .select("id, storage_url, place_id")
        .in("place_id", placeIds);

      if (photos?.length) {
        const { data: photoReactions } = await supabase
          .from("reactions")
          .select("place_id")
          .in("place_id", placeIds);

        const reactionByPlace: Record<string, number> = {};
        for (const r of photoReactions ?? []) {
          reactionByPlace[r.place_id] = (reactionByPlace[r.place_id] ?? 0) + 1;
        }

        topPhotos = photos
          .map((p) => ({
            id: p.id,
            storage_url: p.storage_url,
            reaction_count: reactionByPlace[p.place_id] ?? 0,
          }))
          .sort((a, b) => b.reaction_count - a.reaction_count)
          .slice(0, 3);
      }
    }

    return jsonOk({
      review,
      stats: {
        trips: trips.length,
        placesVisited: placesInYear.length,
        photos: photoCount,
        diaryEntries: diaryEntries.length,
        meals: foodEntries.length,
        milesTravelled: Math.round(totalMiles),
        firsts: (firstsRes.data ?? []).length,
        topCategory,
        ageAtStart,
        ageAtEnd,
        growthDelta,
      },
      trips: trips.map((t) => ({
        ...t,
        places_visited: placesInYear.filter((p) => p.trip_id === t.id).length,
      })),
      favouriteMoment,
      favouriteMomentReactions: diaryReactions.filter(
        (r) => r.diary_entry_id === favouriteMoment?.id
      ),
      bestMeal,
      topPhotos,
      firsts: firstsRes.data ?? [],
      favourites: favouritesRes.data ?? [],
      growth: growthInYear,
      guestbook: (guestbookRes.data ?? []).slice(0, 3),
      diaryEntries,
      diaryReactions,
    });
  } catch {
    return jsonError("Failed to fetch year review");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { year: string } }
) {
  try {
    if (!isAdminSessionFromRequest(request)) {
      return jsonError("Admin access required", 401);
    }

    const year = parseInt(params.year, 10);
    const body = await parseBody<{
      headline?: string;
      favourite_moment_id?: string;
      published?: boolean;
    }>(request);

    if (!body) return jsonError("Invalid body", 400);

    const { data, error } = await supabaseAdmin
      .from("year_reviews")
      .update(body)
      .eq("year", year)
      .select()
      .single();

    if (error) return jsonError(error.message);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to update year review");
  }
}
