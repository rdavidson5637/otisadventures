"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { getRotation, MEAL_TYPE_COLORS } from "@/lib/otis-utils";
import type { FoodLog, MealType } from "@/types/otis";
import FoodCard from "./FoodCard";
import FoodMap from "./FoodMap";
import { showToast } from "./Toast";

interface FoodLogTabProps {
  tripId: string;
  isAdmin: boolean;
  initialEntries?: FoodLog[];
  uploadPlaceId?: string;
  centreLat?: number | null;
  centreLng?: number | null;
}

const MEAL_OPTIONS: { id: MealType; label: string }[] = [
  { id: "breakfast", label: "🌅 Breakfast" },
  { id: "lunch", label: "☀️ Lunch" },
  { id: "dinner", label: "🌙 Dinner" },
  { id: "snack", label: "🍪 Snack" },
];

export default function FoodLogTab({
  tripId,
  isAdmin,
  initialEntries,
  uploadPlaceId,
  centreLat,
  centreLng,
}: FoodLogTabProps) {
  const [entries, setEntries] = useState<FoodLog[]>(initialEntries ?? []);
  const [loading, setLoading] = useState(!initialEntries);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FoodLog | null>(null);
  const [view, setView] = useState<"list" | "map">("list");

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/otis/food?trip_id=${tripId}`);
      if (!res.ok) throw new Error("failed");
      setEntries(await res.json());
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (!initialEntries) fetchEntries();
  }, [initialEntries, fetchEntries]);

  const hallOfFame = useMemo(
    () => entries.filter((e) => e.otis_rating === 5),
    [entries]
  );

  const stats = useMemo(() => {
    const restaurants = new Set(
      entries.map((e) => e.restaurant_name).filter(Boolean)
    );
    const ateCounts: Record<string, number> = {};
    for (const e of entries) {
      if (e.what_otis_ate) {
        ateCounts[e.what_otis_ate] = (ateCounts[e.what_otis_ate] ?? 0) + 1;
      }
    }
    const favourite = Object.entries(ateCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    const bestRated = [...entries]
      .filter((e) => e.otis_rating != null)
      .sort((a, b) => (b.otis_rating ?? 0) - (a.otis_rating ?? 0))[0];

    return {
      mealsLogged: entries.length,
      restaurantsTried: restaurants.size,
      favourite,
      bestRated: bestRated?.restaurant_name ?? "—",
    };
  }, [entries]);

  const grouped = useMemo(() => {
    const groups: Record<string, FoodLog[]> = {};
    for (const entry of entries) {
      const key = entry.date ?? "unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [entries]);

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/otis/food/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      setEntries((prev) => prev.filter((e) => e.id !== id));
      showToast({ text: "🍽️ Meal logged!" });
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    }
  }

  const STAT_LABELS = [
    { label: "Meals logged", value: stats.mealsLogged },
    { label: "Restaurants tried", value: stats.restaurantsTried },
    { label: "Otis' favourite", value: stats.favourite },
    { label: "Best rated", value: stats.bestRated },
  ];

  return (
    <div className="px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-caveat text-3xl font-bold text-cream">
          Food & Restaurants 🍽️
        </h2>
        <div className="flex gap-2 no-select">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded-full px-4 py-2 font-caveat text-lg ${
              view === "list" ? "bg-coral text-cream" : "bg-cream/80 text-navy"
            }`}
          >
            📋 List
          </button>
          <button
            type="button"
            onClick={() => setView("map")}
            className={`rounded-full px-4 py-2 font-caveat text-lg ${
              view === "map" ? "bg-coral text-cream" : "bg-cream/80 text-navy"
            }`}
          >
            🗺️ Food Map
          </button>
        </div>
      </div>

      {view === "map" ? (
        <FoodMap entries={entries} centreLat={centreLat} centreLng={centreLng} />
      ) : (
        <>
      <section className="mb-8">
        <h3 className="font-caveat text-2xl text-coral">Otis Approved ⭐</h3>
        <p className="mb-4 font-caveat text-lg text-cream/70">
          The best things Otis has ever eaten — rated 5 out of 5 🍴
        </p>
        {hallOfFame.length === 0 ? (
          <p className="font-caveat text-lg text-cream/80">
            Nothing yet — Otis has high standards! Keep exploring 🍽️
          </p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {hallOfFame.map((entry, i) => (
              <div
                key={entry.id}
                className="scrapbook-card relative min-w-[220px] shrink-0 p-4"
                style={{ transform: `rotate(${getRotation(entry.id + String(i))}deg)` }}
              >
                <div
                  className="washi-tape left-1/2 -translate-x-1/2"
                  style={{ background: "rgba(245, 200, 66, 0.7)" }}
                />
                <span className="absolute right-2 top-2 text-lg">⭐</span>
                <p className="font-caveat text-xl font-bold text-navy">
                  {entry.restaurant_name}
                </p>
                <p className="font-caveat text-lg italic text-coral">
                  {entry.what_otis_ate}
                </p>
                <p className="mt-1 font-nunito text-xs text-navy/50">
                  {entry.location}
                  {entry.date && ` · ${entry.date}`}
                </p>
                <p className="mt-1">{"🍴".repeat(5)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {STAT_LABELS.map((stat, i) => (
          <div
            key={stat.label}
            className="scrapbook-card relative p-4 text-center"
            style={{ transform: `rotate(${getRotation(String(i))}deg)` }}
          >
            <div
              className="washi-tape left-1/2 -translate-x-1/2"
              style={{ background: "rgba(212, 97, 78, 0.45)" }}
            />
            <p className="font-caveat text-2xl font-bold text-navy">{stat.value}</p>
            <p className="font-caveat text-sm text-navy/70">{stat.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 rounded bg-kraft/50 skeleton-shimmer" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="font-caveat text-xl text-cream/80">
          Otis hasn&apos;t tried any restaurants yet — time to eat! 🍽️
        </p>
      ) : (
        <div className="space-y-8">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <h3 className="mb-4 font-caveat text-2xl text-cream">
                {date !== "unknown"
                  ? format(parseISO(date), "EEEE do MMMM")
                  : "Unknown date"}
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                {items.map((entry) => (
                  <FoodCard
                    key={entry.id}
                    entry={entry}
                    isAdmin={isAdmin}
                    onEdit={(e) => {
                      setEditingEntry(e);
                      setShowModal(true);
                    }}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

        </>
      )}

      {isAdmin && view === "list" && (
        <>
          <button
            type="button"
            onClick={() => {
              setEditingEntry(null);
              setShowModal(true);
            }}
            className="fixed bottom-20 right-4 z-40 rounded-full bg-coral px-5 py-3 font-caveat text-lg text-cream shadow-lg safe-bottom"
          >
            Log a meal 🍽️
          </button>

          {showModal && (
            <FoodModal
              tripId={tripId}
              uploadPlaceId={uploadPlaceId}
              entry={editingEntry}
              onClose={() => {
                setShowModal(false);
                setEditingEntry(null);
              }}
              onSaved={() => {
                setShowModal(false);
                setEditingEntry(null);
                fetchEntries();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

function FoodModal({
  tripId,
  uploadPlaceId,
  entry,
  onClose,
  onSaved,
}: {
  tripId: string;
  uploadPlaceId?: string;
  entry: FoodLog | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    restaurant_name: entry?.restaurant_name ?? "",
    location: entry?.location ?? "",
    date: entry?.date ?? new Date().toISOString().split("T")[0],
    meal_type: (entry?.meal_type ?? "lunch") as MealType,
    what_otis_ate: entry?.what_otis_ate ?? "",
    otis_rating: entry?.otis_rating ?? 3,
    photo_url: entry?.photo_url ?? "",
    note: entry?.note ?? "",
  });
  const [loading, setLoading] = useState(false);

  async function handlePhotoUpload(file: File) {
    if (!uploadPlaceId) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const res = await fetch("/api/otis/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64: reader.result,
          filename: file.name,
          place_id: uploadPlaceId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setForm((f) => ({ ...f, photo_url: data.storage_url }));
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body = { trip_id: tripId, ...form };
      const res = entry
        ? await fetch(`/api/otis/food/${entry.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/otis/food", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      if (!res.ok) throw new Error("failed");
      showToast({ text: "🍽️ Meal logged!" });
      onSaved();
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={handleSubmit} className="scrapbook-card relative max-h-[90vh] w-full max-w-md overflow-y-auto p-6">
        <div
          className="washi-tape left-1/2 -translate-x-1/2"
          style={{ background: "rgba(74, 124, 89, 0.45)" }}
        />
        <h2 className="mb-4 font-caveat text-3xl text-navy">Log a Meal 🍽️</h2>
        <input
          placeholder="Restaurant name"
          value={form.restaurant_name}
          onChange={(e) => setForm({ ...form, restaurant_name: e.target.value })}
          className="mb-3 w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-nunito"
          required
        />
        <input
          placeholder="Location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="mb-3 w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-nunito"
        />
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="mb-3 w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-nunito"
        />
        <div className="mb-3 flex flex-wrap gap-2">
          {MEAL_OPTIONS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setForm({ ...form, meal_type: m.id })}
              className={`rounded px-3 py-2 font-caveat text-sm ${
                form.meal_type === m.id ? "text-cream" : "border border-kraft"
              }`}
              style={
                form.meal_type === m.id
                  ? { background: MEAL_TYPE_COLORS[m.id] }
                  : undefined
              }
            >
              {m.label}
            </button>
          ))}
        </div>
        <textarea
          placeholder="What Otis ate"
          value={form.what_otis_ate}
          onChange={(e) => setForm({ ...form, what_otis_ate: e.target.value })}
          className="mb-3 w-full rounded border border-kraft bg-cream px-3 py-2 font-caveat text-lg"
        />
        <div className="mb-3">
          <p className="font-caveat text-sm text-navy/70">Otis&apos; verdict:</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setForm({ ...form, otis_rating: n })}
                className="text-2xl"
              >
                {n <= form.otis_rating ? "🍴" : "○"}
              </button>
            ))}
          </div>
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
          className="mb-3 w-full font-nunito text-sm"
        />
        <textarea
          placeholder="Note"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          className="mb-4 w-full rounded border border-kraft bg-cream px-3 py-2 font-caveat"
        />
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded border py-3 font-caveat text-lg">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded bg-coral py-3 font-caveat text-lg text-cream"
          >
            {loading ? "Saving..." : "Save meal →"}
          </button>
        </div>
      </form>
    </div>
  );
}
