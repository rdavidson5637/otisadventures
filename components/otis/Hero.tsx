"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { useOtis } from "@/lib/otis-context";
import type { Trip } from "@/types/otis";

export default function Hero({ trip }: { trip: Trip }) {
  const { getAge } = useOtis();
  const dateRange =
    trip.start_date && trip.end_date
      ? `${format(parseISO(trip.start_date), "d MMM yyyy")} – ${format(parseISO(trip.end_date), "d MMM yyyy")}`
      : "";

  return (
    <header className="relative overflow-hidden pb-8 pt-4 safe-top">
      <div className="flex h-2">
        {["#D4614E", "#F5C842", "#4A7C59", "#5B8DB8"].map((c) => (
          <div key={c} className="flex-1" style={{ background: c }} />
        ))}
      </div>

      <Link
        href="/otis"
        className="absolute left-4 top-6 font-caveat text-lg text-navy hover:text-coral"
      >
        ← All Adventures
      </Link>

      <div className="relative mx-auto mt-8 max-w-3xl px-4 text-center">
        <div
          className="washi-tape left-1/2 -translate-x-1/2"
          style={{ background: "rgba(245, 200, 66, 0.45)" }}
        />
        <div className="text-7xl md:text-8xl">{trip.cover_emoji ?? "🌍"}</div>
        <h1
          className="mt-4 font-caveat font-bold text-navy"
          style={{ fontSize: "clamp(38px, 8vw, 72px)" }}
        >
          {trip.name}
        </h1>
        {trip.description && (
          <p className="mt-2 font-caveat text-xl text-green md:text-2xl">{trip.description}</p>
        )}
        {dateRange && (
          <span className="mt-4 inline-block rounded-full bg-kraft/60 px-4 py-1 font-caveat text-lg">
            {dateRange}
          </span>
        )}
        {trip.start_date && (
          <p className="mt-3 font-caveat text-base text-green">
            Otis was {getAge(trip.start_date)} during this adventure 👶
          </p>
        )}
        <p className="mt-6 font-caveat text-lg italic text-navy/60 md:text-xl">
          A little scrapbook of all the amazing places we explored together — to keep forever and
          share with everyone who loves him 💛
        </p>
      </div>

      <div
        className="absolute bottom-2 right-4 hidden rounded-full border-2 border-coral px-3 py-1 font-caveat text-xs text-coral md:block"
        style={{ transform: "rotate(12deg)" }}
      >
        MADE WITH LOVE
      </div>
    </header>
  );
}
