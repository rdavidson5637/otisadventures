"use client";

import dynamic from "next/dynamic";
import type { FoodLog } from "@/types/otis";

const FoodMapInner = dynamic(() => import("./FoodMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] items-center justify-center bg-cream font-caveat text-2xl text-navy">
      Loading food map... 🍴
    </div>
  ),
});

interface FoodMapProps {
  entries: FoodLog[];
  centreLat?: number | null;
  centreLng?: number | null;
}

export default function FoodMap({ entries, centreLat, centreLng }: FoodMapProps) {
  return (
    <FoodMapInner
      entries={entries}
      centreLat={centreLat}
      centreLng={centreLng}
    />
  );
}
