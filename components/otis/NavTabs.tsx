"use client";

export type TabId = "places" | "map" | "diary" | "food" | "bucket";

const TABS: { id: TabId; label: string }[] = [
  { id: "places", label: "📍 Our Places" },
  { id: "map", label: "🗺️ Map" },
  { id: "diary", label: "📅 Daily Diary" },
  { id: "food", label: "🍽️ Food" },
  { id: "bucket", label: "✅ Bucket List" },
];

interface NavTabsProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export default function NavTabs({ active, onChange }: NavTabsProps) {
  return (
    <nav className="sticky top-0 z-30 border-b border-kraft/50 bg-cork/95 backdrop-blur-sm no-select">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`shrink-0 rounded px-4 py-2 font-caveat text-lg transition-colors ${
              active === tab.id
                ? "bg-cream text-navy shadow"
                : "text-cream/80 hover:text-cream"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
