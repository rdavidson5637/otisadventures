"use client";

import { useEffect, useState } from "react";
import { getRotation } from "@/lib/otis-utils";

interface StatsRowProps {
  placesVisited: number;
  photosTaken: number;
  memoriesWritten: number;
  daysExplored: number;
}

function CountUp({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.max(1, Math.ceil(value / 30));
    const interval = setInterval(() => {
      start += step;
      if (start >= value) {
        setCount(value);
        clearInterval(interval);
      } else {
        setCount(start);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [value]);
  return <>{count}</>;
}

const STATS = [
  { key: "placesVisited", label: "Places Visited" },
  { key: "photosTaken", label: "Photos Taken" },
  { key: "memoriesWritten", label: "Memories Written" },
  { key: "daysExplored", label: "Days Explored" },
] as const;

export default function StatsRow(props: StatsRowProps) {
  return (
    <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 px-4 md:grid-cols-4">
      {STATS.map((stat, index) => (
        <div
          key={stat.key}
          className="scrapbook-card relative p-4 text-center"
          style={{ transform: `rotate(${getRotation(String(index))}deg)` }}
        >
          <div
            className="washi-tape left-1/2 -translate-x-1/2"
            style={{ background: "rgba(91, 141, 184, 0.45)" }}
          />
          <p className="font-caveat text-4xl font-bold text-navy">
            <CountUp value={props[stat.key]} />
          </p>
          <p className="font-caveat text-base text-navy/70">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

export function StatsRowSkeleton() {
  return (
    <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 px-4 md:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-24 rounded bg-kraft/50 skeleton-shimmer" />
      ))}
    </div>
  );
}
