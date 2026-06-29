"use client";

import dynamic from "next/dynamic";

const FamilyMapInner = dynamic(() => import("./FamilyMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] items-center justify-center bg-cream font-caveat text-2xl text-navy">
      Loading family map... 🌍
    </div>
  ),
});

export default function FamilyMap() {
  return (
    <section className="mt-12">
      <h2 className="mb-4 font-caveat text-3xl text-navy">
        Otis&apos; Family Around the World 🌍
      </h2>
      <FamilyMapInner />
    </section>
  );
}
