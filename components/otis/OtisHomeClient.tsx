"use client";

import { FamilyFeedTeaser } from "@/components/otis/FamilyFeed";
import TripCard from "@/components/otis/TripCard";
import WorldMap from "@/components/otis/WorldMap";
import { CreateTripButton } from "@/components/otis/CreateTripButton";
import { useOtis } from "@/lib/otis-context";
import type { Trip } from "@/types/otis";

interface OtisHomeClientProps {
  trips: (Trip & {
    places_visited?: number;
    photo_count?: number;
    day_count?: number;
  })[];
}

export default function OtisHomeClient({ trips }: OtisHomeClientProps) {
  const { getAge, dob } = useOtis();
  const currentAge = dob ? getAge(new Date().toISOString().split("T")[0]) : "";

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <CreateTripButton />
      <header className="mb-12 text-center">
        <h1 className="font-caveat text-5xl font-bold text-navy md:text-6xl">
          Otis&apos; Adventures 🌍
        </h1>
        <p className="mt-4 font-caveat text-xl text-navy/80 md:text-2xl">
          A little collection of all the amazing places the best little man in the world has
          explored 💛
        </p>
        {currentAge && (
          <p className="mt-3 font-caveat text-lg text-green">
            Otis is currently {currentAge} 👶
          </p>
        )}
      </header>

      {trips.length > 0 && (
        <div className="mb-12">
          <WorldMap trips={trips} />
        </div>
      )}

      <FamilyFeedTeaser />

      {trips.length === 0 ? (
        <p className="text-center font-caveat text-2xl text-navy/70">
          No adventures yet — the best ones are coming! 🍀
        </p>
      ) : (
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}

      <footer className="mt-16 text-center font-caveat text-lg text-navy/60">
        Made with love for Otis 💛
      </footer>
    </main>
  );
}
