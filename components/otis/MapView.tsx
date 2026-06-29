"use client";

import dynamic from "next/dynamic";
import type { Place, SpontaneousTrip } from "@/types/otis";
import type { PlaceWithData } from "./PlacesTab";

const MapViewInner = dynamic(() => import("./MapViewInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] items-center justify-center bg-cream font-caveat text-2xl text-navy">
      Loading map... 🗺️
    </div>
  ),
});

interface MapViewProps {
  places: Place[];
  spontaneousTrips: SpontaneousTrip[];
  placesWithData?: PlaceWithData[];
  center?: [number, number];
  zoom?: number;
}

export default function MapView({
  places,
  spontaneousTrips,
  placesWithData = [],
  center = [54.7, -6.6],
  zoom = 8,
}: MapViewProps) {
  if (!places.length && !spontaneousTrips.length) {
    return (
      <div className="flex h-[60vh] items-center justify-center font-caveat text-2xl text-cream">
        No places to show yet 📍
      </div>
    );
  }

  return (
    <MapViewInner
      places={places}
      spontaneousTrips={spontaneousTrips}
      placesWithData={placesWithData}
      center={center}
      zoom={zoom}
    />
  );
}
