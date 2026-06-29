"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import Image from "next/image";
import { getRotation } from "@/lib/otis-utils";
import type { FavouriteCategory, FavouriteThing } from "@/types/otis";
import { AdminOnly, useIsAdmin } from "./AdminGate";
import { showToast } from "./Toast";

const CATEGORIES: { id: FavouriteCategory; emoji: string; label: string }[] = [
  { id: "food", emoji: "🍕", label: "Favourite Food" },
  { id: "animal", emoji: "🐾", label: "Favourite Animal" },
  { id: "place", emoji: "📍", label: "Favourite Place" },
  { id: "word", emoji: "💬", label: "Favourite Word" },
  { id: "book", emoji: "📚", label: "Favourite Book" },
  { id: "toy", emoji: "🧸", label: "Favourite Toy" },
  { id: "song", emoji: "🎵", label: "Favourite Song" },
  { id: "person", emoji: "👤", label: "Favourite Person" },
];

export default function FavouriteThings() {
  const isAdmin = useIsAdmin();
  const [favourites, setFavourites] = useState<FavouriteThing[]>([]);
  const [view, setView] = useState<"current" | "history">("current");
  const [modalCategory, setModalCategory] = useState<FavouriteCategory | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFavourites = useCallback(async () => {
    try {
      const res = await fetch("/api/otis/favourites");
      if (res.ok) setFavourites(await res.json());
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavourites();
  }, [fetchFavourites]);

  const currentByCategory = useMemo(() => {
    const map: Partial<Record<FavouriteCategory, FavouriteThing>> = {};
    for (const f of favourites) {
      if (f.is_current) map[f.category] = f;
    }
    return map;
  }, [favourites]);

  const historyByCategory = useMemo(() => {
    const map: Partial<Record<FavouriteCategory, FavouriteThing[]>> = {};
    for (const f of favourites) {
      if (!map[f.category]) map[f.category] = [];
      map[f.category]!.push(f);
    }
    for (const cat of Object.keys(map) as FavouriteCategory[]) {
      map[cat]!.sort((a, b) => b.date_logged.localeCompare(a.date_logged));
    }
    return map;
  }, [favourites]);

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/otis/favourites/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      fetchFavourites();
      showToast({ text: "Removed from history" });
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded bg-kraft/50 skeleton-shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setView("current")}
          className={`rounded-full px-4 py-2 font-caveat text-lg ${
            view === "current" ? "bg-coral text-cream" : "bg-cream text-navy"
          }`}
        >
          Current ⭐
        </button>
        <button
          type="button"
          onClick={() => setView("history")}
          className={`rounded-full px-4 py-2 font-caveat text-lg ${
            view === "history" ? "bg-coral text-cream" : "bg-cream text-navy"
          }`}
        >
          History 📜
        </button>
      </div>

      {view === "current" ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const current = currentByCategory[cat.id];
            return (
              <div
                key={cat.id}
                className={`scrapbook-card relative p-5 text-center ${
                  !current ? "border-2 border-dashed border-kraft/60 opacity-70" : ""
                }`}
                style={{ transform: `rotate(${getRotation(cat.id)}deg)` }}
              >
                <div
                  className="washi-tape left-1/2 -translate-x-1/2"
                  style={{ background: "rgba(212, 97, 78, 0.45)" }}
                />
                <p className="text-4xl">{cat.emoji}</p>
                <p className="mt-1 font-caveat text-sm text-navy/60">{cat.label}</p>
                {current ? (
                  <>
                    <p className="mt-2 font-caveat text-2xl font-bold text-navy">
                      {current.value}
                    </p>
                    {current.note && (
                      <p className="mt-1 font-caveat text-sm italic text-navy/60">
                        {current.note}
                      </p>
                    )}
                    <p className="mt-2 font-nunito text-xs text-navy/40">
                      as of {format(parseISO(current.date_logged), "MMMM yyyy")}
                    </p>
                    {current.photo_url && (
                      <div className="relative mx-auto mt-3 h-24 w-24 overflow-hidden bg-cream p-1 shadow">
                        <Image src={current.photo_url} alt="" fill className="object-cover" />
                      </div>
                    )}
                    <AdminOnly>
                      <button
                        type="button"
                        onClick={() => setModalCategory(cat.id)}
                        className="mt-3 font-caveat text-base text-coral hover:underline"
                      >
                        Update favourite →
                      </button>
                    </AdminOnly>
                  </>
                ) : (
                  <>
                    <p className="mt-4 font-caveat text-lg text-navy/50">
                      {cat.emoji} Not logged yet
                    </p>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setModalCategory(cat.id)}
                        className="mt-3 font-caveat text-base text-coral hover:underline"
                      >
                        Add first favourite →
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          {CATEGORIES.map((cat) => {
            const items = historyByCategory[cat.id] ?? [];
            if (!items.length) return null;
            return (
              <details key={cat.id} className="scrapbook-card p-4" open>
                <summary className="cursor-pointer font-caveat text-2xl font-bold text-navy">
                  {cat.emoji} {cat.label}
                </summary>
                <div className="mt-4 space-y-3 border-l-2 border-dashed border-kraft pl-4">
                  {items.map((item, i) => (
                    <div key={item.id} className="relative pl-4">
                      <div className="absolute left-0 top-2 h-2 w-2 rounded-full bg-coral" />
                      <p className="font-caveat text-xl font-bold text-navy">{item.value}</p>
                      {item.is_current && (
                        <span className="rounded bg-green/20 px-2 py-0.5 font-caveat text-sm text-green">
                          Currently: {item.value}
                        </span>
                      )}
                      {item.note && (
                        <p className="font-caveat text-sm italic text-navy/60">{item.note}</p>
                      )}
                      <p className="font-nunito text-xs text-navy/40">
                        {format(parseISO(item.date_logged), "d MMM yyyy")}
                      </p>
                      {isAdmin && !item.is_current && (
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="mt-1 font-caveat text-sm text-coral"
                        >
                          Delete 🗑️
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      )}

      {modalCategory && (
        <FavouriteModal
          category={modalCategory}
          onClose={() => setModalCategory(null)}
          onSaved={() => {
            setModalCategory(null);
            fetchFavourites();
          }}
        />
      )}
    </div>
  );
}

function FavouriteModal({
  category,
  onClose,
  onSaved,
}: {
  category: FavouriteCategory;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    value: "",
    note: "",
    date_logged: new Date().toISOString().split("T")[0],
    photo_url: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/otis/favourites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, ...form, is_current: true }),
      });
      if (!res.ok) throw new Error("failed");
      showToast({ text: "❤️ Favourite updated!" });
      onSaved();
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={handleSubmit} className="scrapbook-card relative w-full max-w-md p-6">
        <div
          className="washi-tape left-1/2 -translate-x-1/2"
          style={{ background: "rgba(212, 97, 78, 0.45)" }}
        />
        <h2 className="mb-4 font-caveat text-3xl text-navy">Update Favourite ❤️</h2>
        <input
          placeholder="What's Otis' new favourite?"
          value={form.value}
          onChange={(e) => setForm({ ...form, value: e.target.value })}
          className="mb-3 w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-caveat text-lg"
          required
        />
        <input
          placeholder="Note (optional)"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          className="mb-3 w-full rounded border border-kraft bg-cream px-3 font-caveat"
        />
        <input
          type="date"
          value={form.date_logged}
          onChange={(e) => setForm({ ...form, date_logged: e.target.value })}
          className="mb-4 w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-nunito"
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
            {loading ? "Saving..." : "Save →"}
          </button>
        </div>
      </form>
    </div>
  );
}
