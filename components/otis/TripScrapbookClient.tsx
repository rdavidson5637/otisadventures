"use client";

import { useState } from "react";
import Hero from "./Hero";
import StatsRow from "./StatsRow";
import NavTabs, { type TabId } from "./NavTabs";
import PlacesTab, { type PlaceWithData } from "./PlacesTab";
import MapView from "./MapView";
import DailyDiary from "./DailyDiary";
import FoodLogTab from "./FoodLog";
import BucketList from "./BucketList";
import { useIsAdmin } from "./AdminGate";
import type {
  DiaryEntry,
  FoodLog,
  Place,
  SpontaneousTrip,
  Trip,
} from "@/types/otis";

interface TripScrapbookClientProps {
  trip: Trip;
  places: PlaceWithData[];
  diaryEntries: DiaryEntry[];
  foodEntries: FoodLog[];
  spontaneousTrips: SpontaneousTrip[];
  stats: {
    placesVisited: number;
    photosTaken: number;
    memoriesWritten: number;
    daysExplored: number;
  };
}

export default function TripScrapbookClient({
  trip,
  places: initialPlaces,
  diaryEntries,
  foodEntries,
  spontaneousTrips,
  stats,
}: TripScrapbookClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("places");
  const [places, setPlaces] = useState(initialPlaces);
  const isAdmin = useIsAdmin();

  const uploadPlaceId = places[0]?.id;
  const startDate = trip.start_date ?? new Date().toISOString().split("T")[0];
  const endDate = trip.end_date ?? startDate;

  function handlePlaceUpdate(updated: Place) {
    setPlaces((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
    );
  }

  return (
    <>
      <Hero trip={trip} />

      <div className="py-8">
        <StatsRow
          placesVisited={stats.placesVisited}
          photosTaken={stats.photosTaken}
          memoriesWritten={stats.memoriesWritten}
          daysExplored={stats.daysExplored}
        />
      </div>

      <NavTabs active={activeTab} onChange={setActiveTab} />

      <div
        className="min-h-[50vh] transition-opacity duration-200"
        key={activeTab}
      >
        {activeTab === "places" && (
          <PlacesTab tripId={trip.id} initialPlaces={places} />
        )}
        {activeTab === "map" && (
          <MapView
            places={places}
            spontaneousTrips={spontaneousTrips}
            placesWithData={places}
          />
        )}
        {activeTab === "diary" && (
          <DailyDiary
            tripId={trip.id}
            startDate={startDate}
            endDate={endDate}
            isAdmin={isAdmin}
            initialEntries={diaryEntries}
            uploadPlaceId={uploadPlaceId}
          />
        )}
        {activeTab === "food" && (
          <FoodLogTab
            tripId={trip.id}
            isAdmin={isAdmin}
            initialEntries={foodEntries}
            uploadPlaceId={uploadPlaceId}
            centreLat={trip.centre_lat}
            centreLng={trip.centre_lng}
          />
        )}
        {activeTab === "bucket" && (
          <BucketList
            tripId={trip.id}
            places={places}
            isAdmin={isAdmin}
            onPlaceUpdate={handlePlaceUpdate}
          />
        )}
      </div>
    </>
  );
}
