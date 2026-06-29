"use client";

import { useState } from "react";
import type { FirstsCategory, GrowthEntry, OtisFirstWithCategory } from "@/types/otis";
import FamilyMap from "./FamilyMap";
import FavouriteThings from "./FavouriteThings";
import Guestbook from "./Guestbook";
import GrowthTracker from "./GrowthTracker";
import OtisFirsts from "./OtisFirsts";

type TabId = "growth" | "firsts" | "favourites" | "guestbook" | "family";

const TABS: { id: TabId; label: string }[] = [
  { id: "growth", label: "📏 Growing Up" },
  { id: "firsts", label: "🌟 Firsts" },
  { id: "favourites", label: "❤️ Favourite Things" },
  { id: "guestbook", label: "📖 Guestbook" },
  { id: "family", label: "🗺️ Family" },
];

interface OtisPageClientProps {
  growthEntries: GrowthEntry[];
  dob: string;
  firsts: OtisFirstWithCategory[];
  categories: FirstsCategory[];
}

export default function OtisPageClient({
  growthEntries,
  dob,
  firsts,
  categories,
}: OtisPageClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("growth");

  return (
    <div>
      <nav className="mb-8 flex flex-wrap justify-center gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-2 font-caveat text-lg transition-colors ${
              activeTab === tab.id
                ? "bg-coral text-cream shadow"
                : "bg-cream text-navy hover:bg-cream/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "growth" && (
        <GrowthTracker initialEntries={growthEntries} initialDob={dob} />
      )}

      {activeTab === "firsts" && (
        <OtisFirsts
          initialFirsts={firsts}
          initialCategories={categories}
          initialDob={dob}
        />
      )}

      {activeTab === "favourites" && <FavouriteThings />}

      {activeTab === "guestbook" && <Guestbook />}

      {activeTab === "family" && <FamilyMap />}
    </div>
  );
}
