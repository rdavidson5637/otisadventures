"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { TIME_OF_DAY_LABELS } from "@/lib/otis-utils";
import type { DiaryEntry, OtisFirstWithCategory } from "@/types/otis";

type YearData = {
  review: { year: number; headline: string | null };
  stats: {
    trips: number;
    placesVisited: number;
    photos: number;
    diaryEntries: number;
    meals: number;
    milesTravelled: number;
    firsts: number;
    growthDelta: number | null;
    ageAtStart: string;
    ageAtEnd: string;
  };
  trips: {
    id: string;
    name: string;
    cover_emoji: string | null;
    start_date: string | null;
    end_date: string | null;
    places_visited: number;
    hero_photo_url: string | null;
  }[];
  favouriteMoment: DiaryEntry | null;
  favouriteMomentReactions: { emoji: string; commenter_name: string }[];
  bestMeal: {
    restaurant_name: string | null;
    what_otis_ate: string | null;
    otis_rating: number | null;
    photo_url: string | null;
  } | null;
  topPhotos: { id: string; storage_url: string; reaction_count: number }[];
  firsts: OtisFirstWithCategory[];
  growth: { height_cm: number; measured_date: string }[];
  guestbook: { author_name: string; message: string }[];
};

export default function YearReviewClient({ year }: { year: number }) {
  const [data, setData] = useState<YearData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/otis/year-review/${year}`)
      .then((r) => {
        if (!r.ok) throw new Error("failed");
        return r.json();
      })
      .then(setData)
      .catch(() => setError(true));
  }, [year]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-navy px-4">
        <p className="font-caveat text-2xl text-cream">
          Year review not available yet — check back soon! 📅
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-navy">
        <div className="mx-auto max-w-4xl px-4 py-24">
          <div className="h-64 skeleton-shimmer rounded bg-cream/10" />
        </div>
      </main>
    );
  }

  const reactionCounts: Record<string, number> = {};
  for (const r of data.favouriteMomentReactions) {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] ?? 0) + 1;
  }

  const statCards = [
    { label: "Trips taken", value: data.stats.trips },
    { label: "Places visited", value: data.stats.placesVisited },
    { label: "Photos taken", value: data.stats.photos },
    { label: "Meals eaten", value: data.stats.meals },
    { label: "Miles travelled", value: data.stats.milesTravelled },
    { label: "Firsts logged", value: data.stats.firsts },
  ];

  return (
    <main className="min-h-screen bg-navy text-cream">
      <section className="relative overflow-hidden px-4 py-20 text-center">
        <p
          className="pointer-events-none absolute inset-0 flex items-center justify-center font-caveat font-bold text-navy/10"
          style={{ fontSize: "180px" }}
          aria-hidden
        >
          {year}
        </p>
        <h1 className="relative font-caveat text-5xl font-bold md:text-7xl">
          Otis&apos; {year} 🍀
        </h1>
        {data.review.headline && (
          <p className="relative mt-4 font-caveat text-2xl italic text-cream/70">
            {data.review.headline}
          </p>
        )}
        {data.stats.ageAtEnd && (
          <p className="relative mt-4 font-caveat text-xl text-green">
            Otis turned {data.stats.ageAtEnd} this year
          </p>
        )}
      </section>

      <section className="overflow-x-auto px-4 pb-12 scrollbar-none">
        <div className="mx-auto flex max-w-5xl gap-4">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="min-w-[140px] shrink-0 rounded bg-cream/10 p-4 text-center"
            >
              <p className="font-caveat text-3xl font-bold">{s.value}</p>
              <p className="font-caveat text-sm text-cream/70">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {data.trips.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="mb-6 font-caveat text-4xl">Adventures ✈️</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {data.trips.map((trip) => (
              <div key={trip.id} className="rounded bg-cream/10 p-6">
                <p className="text-4xl">{trip.cover_emoji}</p>
                <h3 className="mt-2 font-caveat text-2xl font-bold">{trip.name}</h3>
                {trip.start_date && trip.end_date && (
                  <p className="font-caveat text-sm text-cream/70">
                    {format(parseISO(trip.start_date), "d MMM")} –{" "}
                    {format(parseISO(trip.end_date), "d MMM yyyy")}
                  </p>
                )}
                <p className="mt-1 font-caveat text-cream/70">
                  {trip.places_visited} places visited
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.favouriteMoment && (
        <section className="mx-auto max-w-3xl px-4 py-12">
          <h2 className="mb-6 font-caveat text-4xl">Your favourite moment of {year} 💛</h2>
          <div className="rounded bg-cream/10 p-8">
            {data.favouriteMoment.time_of_day && (
              <p className="font-caveat text-cream/70">
                {TIME_OF_DAY_LABELS[data.favouriteMoment.time_of_day]}
              </p>
            )}
            {data.favouriteMoment.title && (
              <h3 className="font-caveat text-3xl font-bold">{data.favouriteMoment.title}</h3>
            )}
            {data.favouriteMoment.note && (
              <p className="mt-2 font-caveat text-xl text-cream/80">
                {data.favouriteMoment.note}
              </p>
            )}
            <p className="mt-4 font-caveat text-cream/60">
              {Object.entries(reactionCounts)
                .map(([emoji, count]) => `${emoji} ${count}`)
                .join(" · ") || "❤️ Be the first to react!"}
            </p>
            <p className="mt-1 font-caveat text-sm text-cream/50">Voted by your family</p>
          </div>
        </section>
      )}

      {data.bestMeal && (
        <section className="mx-auto max-w-3xl px-4 py-12">
          <h2 className="mb-6 font-caveat text-4xl">Otis&apos; meal of the year 🍴</h2>
          <div className="rounded bg-cream/10 p-8">
            <p className="font-caveat text-2xl font-bold">{data.bestMeal.restaurant_name}</p>
            <p className="font-caveat text-xl italic text-coral">{data.bestMeal.what_otis_ate}</p>
            <p className="mt-2">{"🍴".repeat(data.bestMeal.otis_rating ?? 0)}</p>
          </div>
        </section>
      )}

      {data.topPhotos.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="mb-6 font-caveat text-4xl">Top Photos 📸</h2>
          <div className="flex flex-wrap justify-center gap-6">
            {data.topPhotos.map((photo, i) => (
              <div
                key={photo.id}
                className="relative h-48 w-48 bg-cream p-2 shadow-lg"
                style={{ transform: `rotate(${i % 2 === 0 ? -3 : 3}deg)` }}
              >
                <Image src={photo.storage_url} alt="" fill className="object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}

      {data.stats.growthDelta != null && (
        <section className="mx-auto max-w-3xl px-4 py-12 text-center">
          <p className="font-caveat text-3xl">
            Otis grew {data.stats.growthDelta}cm this year! 📏
          </p>
        </section>
      )}

      <footer className="px-4 py-12 text-center">
        <Link href="/otis" className="font-caveat text-xl text-coral hover:underline">
          ← Back to adventures
        </Link>
      </footer>
    </main>
  );
}
