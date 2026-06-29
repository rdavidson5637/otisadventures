import { supabase } from "@/lib/supabase";
import OtisHomeClient from "@/components/otis/OtisHomeClient";
import type { Trip } from "@/types/otis";

async function getTripsWithStats() {
  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .order("start_date", { ascending: false });

  if (!trips?.length) return [];

  return Promise.all(
    trips.map(async (trip: Trip) => {
      const [{ count: placesVisited }, { data: places }] = await Promise.all([
        supabase
          .from("places")
          .select("*", { count: "exact", head: true })
          .eq("trip_id", trip.id)
          .eq("visited", true),
        supabase.from("places").select("id").eq("trip_id", trip.id),
      ]);

      const placeIds = places?.map((p) => p.id) ?? [];
      let photoCount = 0;
      if (placeIds.length) {
        const { count } = await supabase
          .from("photos")
          .select("*", { count: "exact", head: true })
          .in("place_id", placeIds);
        photoCount = count ?? 0;
      }

      const { data: diaryDates } = await supabase
        .from("diary_entries")
        .select("entry_date")
        .eq("trip_id", trip.id);

      const dayCount = new Set(diaryDates?.map((d) => d.entry_date)).size;

      return {
        ...trip,
        places_visited: placesVisited ?? 0,
        photo_count: photoCount,
        day_count: dayCount,
      };
    })
  );
}

export default async function OtisHomePage() {
  const trips = await getTripsWithStats();
  return <OtisHomeClient trips={trips} />;
}
