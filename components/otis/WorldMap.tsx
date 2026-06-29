"use client";

import dynamic from "next/dynamic";
import type { TripWithStats } from "@/types/otis";

const WorldMapInner = dynamic(() => import("./WorldMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[280px] items-center justify-center bg-cream font-caveat text-2xl text-navy md:h-[400px]">
      Loading map... 🌍
    </div>
  ),
});

interface WorldMapProps {
  trips: TripWithStats[];
}

export default function WorldMap({ trips }: WorldMapProps) {
  const mappable = trips.filter((t) => t.centre_lat != null && t.centre_lng != null);

  if (!mappable.length) {
    return (
      <div className="flex h-[280px] items-center justify-center border-y border-kraft bg-cream/50 font-caveat text-xl text-navy/60 md:h-[400px]">
        Add trip coordinates to see them on the map 🌍
      </div>
    );
  }

  return <WorldMapInner trips={mappable} />;
}
