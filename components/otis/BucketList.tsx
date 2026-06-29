"use client";

import { useRef, useState } from "react";
import confetti from "canvas-confetti";
import { CATEGORY_COLORS } from "@/lib/otis-utils";
import type { Place, PlaceCategory } from "@/types/otis";
import { showToast } from "./Toast";
import SpontaneousTrips from "./SpontaneousTrips";

interface BucketListProps {
  tripId: string;
  places: Place[];
  isAdmin: boolean;
  onPlaceUpdate?: (place: Place) => void;
}

const CATEGORY_GROUPS: { category: PlaceCategory; label: string }[] = [
  { category: "farm", label: "🐄 Farms" },
  { category: "nature", label: "🌿 Nature & Outdoors" },
  { category: "beach", label: "🏖️ Beaches" },
  { category: "indoor", label: "🏛️ Indoors" },
  { category: "castle", label: "🏰 Castles & History" },
];

export default function BucketList({
  tripId,
  places: initialPlaces,
  isAdmin,
  onPlaceUpdate,
}: BucketListProps) {
  const [places, setPlaces] = useState(initialPlaces);
  const prevVisitedCount = useRef(places.filter((p) => p.visited).length);

  const visitedCount = places.filter((p) => p.visited).length;
  const totalCount = places.length;
  const progress = totalCount > 0 ? (visitedCount / totalCount) * 100 : 0;

  async function togglePlace(place: Place) {
    if (!isAdmin) return;

    const newVisited = !place.visited;
    const visited_date = newVisited
      ? new Date().toISOString().split("T")[0]
      : null;

    try {
      const res = await fetch(`/api/otis/places/${place.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visited: newVisited, visited_date }),
      });
      if (!res.ok) throw new Error("failed");
      const updated = await res.json();
      setPlaces((prev) => prev.map((p) => (p.id === place.id ? updated : p)));
      onPlaceUpdate?.(updated);

      if (newVisited && visitedCount >= prevVisitedCount.current) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#D4614E", "#F5C842", "#4A7C59", "#5B8DB8"],
        });
        showToast({ text: "🎉 Adventure logged!" });
      } else if (!newVisited) {
        showToast({ text: "Removed from visited" });
      }
      prevVisitedCount.current = newVisited
        ? visitedCount + 1
        : visitedCount - 1;
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    }
  }

  return (
    <div className="px-4 py-6">
      <h2 className="mb-6 font-caveat text-3xl font-bold text-cream">
        Otis&apos; Bucket List ✅
      </h2>

      <div className="mb-8">
        <p className="font-caveat text-2xl text-cream">
          {visitedCount} of {totalCount} adventures completed
        </p>
        <div className="mt-3 h-4 overflow-hidden rounded bg-kraft">
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #4A7C59, #5B8DB8)",
            }}
          />
        </div>
        {visitedCount === totalCount && totalCount > 0 && (
          <p className="mt-3 font-caveat text-xl text-cream">
            All adventures completed! What a trip! 🎉
          </p>
        )}
      </div>

      {CATEGORY_GROUPS.map(({ category, label }) => {
        const groupPlaces = places.filter((p) => p.category === category);
        if (!groupPlaces.length) return null;
        const color = CATEGORY_COLORS[category];

        return (
          <div key={category} className="mb-8">
            <h3 className="mb-4 font-caveat text-2xl text-cream">{label}</h3>
            <ul className="space-y-3">
              {groupPlaces.map((place) => (
                <li key={place.id} className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => togglePlace(place)}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition-all duration-300 ${
                      isAdmin ? "cursor-pointer" : "cursor-default"
                    }`}
                    style={{
                      borderColor: color,
                      background: place.visited ? color : "#FDF6E3",
                      color: place.visited ? "#FDF6E3" : "transparent",
                    }}
                  >
                    {place.visited && "✓"}
                  </button>
                  <span
                    className={`font-caveat text-xl text-cream ${
                      place.visited ? "line-through opacity-60" : ""
                    }`}
                  >
                    {place.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <SpontaneousTrips tripId={tripId} isAdmin={isAdmin} />
    </div>
  );
}
