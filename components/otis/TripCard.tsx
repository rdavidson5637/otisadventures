"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { getRotation } from "@/lib/otis-utils";
import { useOtis } from "@/lib/otis-context";
import type { Trip } from "@/types/otis";

interface TripCardProps {
  trip: Trip & {
    places_visited?: number;
    photo_count?: number;
    day_count?: number;
  };
}

export default function TripCard({ trip }: TripCardProps) {
  const { getAge } = useOtis();
  const rotation = getRotation(trip.id);

  const dateRange =
    trip.start_date && trip.end_date
      ? `${format(parseISO(trip.start_date), "d MMM yyyy")} – ${format(parseISO(trip.end_date), "d MMM yyyy")}`
      : "";

  const ageDuringTrip = trip.start_date ? getAge(trip.start_date) : "";

  return (
    <Link href={`/otis/${trip.slug}`} className="block">
      <article
        className="scrapbook-card relative mx-auto max-w-sm overflow-hidden p-6 transition-all duration-300 hover:z-10 hover:scale-[1.02] hover:rotate-0"
        style={{
          transform: `rotate(${rotation}deg)`,
          ...(trip.hero_photo_url
            ? {
                backgroundImage: `linear-gradient(rgba(30,45,74,0.65), rgba(30,45,74,0.65)), url(${trip.hero_photo_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {}),
        }}
      >
        {!trip.hero_photo_url && (
          <div
            className="washi-tape left-1/2 -translate-x-1/2"
            style={{ background: "rgba(74, 124, 89, 0.45)" }}
          />
        )}
        <div className={trip.hero_photo_url ? "text-cream" : ""}>
        <div className="mb-3 text-center text-6xl">{trip.cover_emoji ?? "🌍"}</div>
        <h2 className={`font-caveat text-3xl font-bold ${trip.hero_photo_url ? "text-cream" : "text-navy"}`}>
          {trip.name}
        </h2>
        {trip.location && (
          <p className={`mt-1 font-nunito text-sm ${trip.hero_photo_url ? "text-cream/80" : "text-navy/60"}`}>
            📍 {trip.location}
          </p>
        )}
        {dateRange && (
          <p className={`mt-1 font-caveat text-lg ${trip.hero_photo_url ? "text-cream/90" : "text-green"}`}>
            {dateRange}
          </p>
        )}
        {ageDuringTrip && (
          <p className={`mt-1 font-caveat text-sm ${trip.hero_photo_url ? "text-cream/70" : "text-navy/60"}`}>
            Otis was {ageDuringTrip} during this trip
          </p>
        )}
        <p className={`mt-3 font-caveat text-base ${trip.hero_photo_url ? "text-cream/80" : "text-navy/70"}`}>
          {trip.places_visited ?? 0} places visited · {trip.photo_count ?? 0} photos ·{" "}
          {trip.day_count ?? 0} days
        </p>
        <div className="mt-4 flex items-center justify-between">
          {trip.is_active ? (
            <span className="rounded bg-green/20 px-2 py-1 font-caveat text-sm text-green">
              Current Adventure ✈️
            </span>
          ) : (
            <span className="rounded bg-navy/10 px-2 py-1 font-caveat text-sm text-navy">
              Completed 🎉
            </span>
          )}
          <span className="font-caveat text-lg text-coral">Open Scrapbook →</span>
        </div>
        </div>
      </article>
    </Link>
  );
}
