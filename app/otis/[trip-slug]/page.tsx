import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TripScrapbookClient from "@/components/otis/TripScrapbookClient";
import type {
  Comment,
  DiaryEntry,
  FoodLog,
  Photo,
  Place,
  Reaction,
  SpontaneousTrip,
  Trip,
} from "@/types/otis";
import type { PlaceWithData } from "@/components/otis/PlacesTab";

async function getTripBySlug(slug: string): Promise<Trip | null> {
  const { data } = await supabase.from("trips").select("*").eq("slug", slug).single();
  return data;
}

async function getPlacesWithRelations(tripId: string): Promise<PlaceWithData[]> {
  const { data: places } = await supabase
    .from("places")
    .select("*")
    .eq("trip_id", tripId)
    .order("name");

  if (!places?.length) return [];

  return Promise.all(
    places.map(async (place: Place) => {
      const [{ data: photos }, { data: comments }, { data: reactions }] =
        await Promise.all([
          supabase.from("photos").select("*").eq("place_id", place.id),
          supabase.from("comments").select("*").eq("place_id", place.id).order("created_at"),
          supabase.from("reactions").select("*").eq("place_id", place.id),
        ]);

      return {
        ...place,
        photos: (photos ?? []) as Photo[],
        comments: (comments ?? []) as Comment[],
        reactions: (reactions ?? []) as Reaction[],
      };
    })
  );
}

async function getTripStats(tripId: string, places: PlaceWithData[]) {
  const placesVisited = places.filter((p) => p.visited).length;
  const photosTaken = places.reduce((sum, p) => sum + (p.photos?.length ?? 0), 0);
  const memoriesWritten = places.filter((p) => p.otis_thoughts).length;

  const { data: diaryDates } = await supabase
    .from("diary_entries")
    .select("entry_date")
    .eq("trip_id", tripId);

  const daysExplored = new Set(diaryDates?.map((d) => d.entry_date)).size;

  return { placesVisited, photosTaken, memoriesWritten, daysExplored };
}

export default async function TripScrapbookPage({
  params,
}: {
  params: { "trip-slug": string };
}) {
  const trip = await getTripBySlug(params["trip-slug"]);
  if (!trip) notFound();

  const [places, diaryResult, foodResult, spontaneousResult] = await Promise.all([
    getPlacesWithRelations(trip.id),
    supabase
      .from("diary_entries")
      .select("*")
      .eq("trip_id", trip.id)
      .order("entry_date"),
    supabase.from("food_log").select("*").eq("trip_id", trip.id).order("date", { ascending: false }),
    supabase
      .from("spontaneous_trips")
      .select("*")
      .eq("trip_id", trip.id)
      .order("date", { ascending: false }),
  ]);

  const stats = await getTripStats(trip.id, places);

  return (
    <TripScrapbookClient
      trip={trip}
      places={places}
      diaryEntries={(diaryResult.data ?? []) as DiaryEntry[]}
      foodEntries={(foodResult.data ?? []) as FoodLog[]}
      spontaneousTrips={(spontaneousResult.data ?? []) as SpontaneousTrip[]}
      stats={stats}
    />
  );
}
