"use client";

import { useCallback, useEffect, useState } from "react";
import type { Comment, Photo, Place, PlaceCategory, Reaction } from "@/types/otis";
import { CATEGORY_LABELS } from "@/lib/otis-utils";
import { AdminOnly } from "./AdminGate";
import PlaceCard, { PlaceCardSkeleton } from "./PlaceCard";
import { showToast } from "./Toast";

interface PlacesTabProps {
  tripId: string;
  initialPlaces?: PlaceWithData[];
}

export interface PlaceWithData extends Place {
  photos: Photo[];
  comments: Comment[];
  reactions: Reaction[];
}

const FILTERS: { id: PlaceCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "farm", label: "🐄 Farms" },
  { id: "nature", label: "🌿 Nature" },
  { id: "beach", label: "🏖️ Beaches" },
  { id: "indoor", label: "🏛️ Indoors" },
  { id: "castle", label: "🏰 Castles" },
];

export default function PlacesTab({ tripId, initialPlaces }: PlacesTabProps) {
  const [places, setPlaces] = useState<PlaceWithData[]>(initialPlaces ?? []);
  const [filter, setFilter] = useState<PlaceCategory | "all">("all");
  const [loading, setLoading] = useState(!initialPlaces);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/otis/places?trip_id=${tripId}`);
      if (!res.ok) throw new Error("failed");
      const data: Place[] = await res.json();

      const withData = await Promise.all(
        data.map(async (place) => {
          const [photosRes, commentsRes, reactionsRes] = await Promise.all([
            fetch(`/api/otis/photos?place_id=${place.id}`),
            fetch(`/api/otis/comments?place_id=${place.id}`),
            fetch(`/api/otis/reactions?place_id=${place.id}`),
          ]);
          const [photos, comments, reactions] = await Promise.all([
            photosRes.json(),
            commentsRes.json(),
            reactionsRes.json(),
          ]);
          return { ...place, photos, comments, reactions };
        })
      );
      setPlaces(withData);
    } catch {
      showToast({ text: "Couldn't connect. Check your internet and try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (!initialPlaces) fetchPlaces();
  }, [initialPlaces, fetchPlaces]);

  const filtered =
    filter === "all" ? places : places.filter((p) => p.category === filter);

  return (
    <div className="px-4 py-6">
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded px-3 py-1 font-caveat text-lg transition-colors ${
              filter === f.id ? "bg-coral text-cream" : "bg-cream/80 text-navy hover:bg-cream"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <AdminOnly>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="mb-6 rounded bg-coral px-4 py-2 font-caveat text-lg text-cream"
        >
          Add place +
        </button>
      </AdminOnly>

      {loading ? (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <PlaceCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((place, index) => (
            <div
              key={place.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <PlaceCard
                place={place}
                photos={place.photos}
                comments={place.comments}
                reactions={place.reactions}
                onUpdate={(updated) =>
                  setPlaces((prev) =>
                    prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
                  )
                }
                onPhotosChange={fetchPlaces}
              />
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddPlaceModal
          tripId={tripId}
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            setShowAddModal(false);
            fetchPlaces();
          }}
        />
      )}
    </div>
  );
}

function AddPlaceModal({
  tripId,
  onClose,
  onAdded,
}: {
  tripId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    location: "",
    category: "nature" as PlaceCategory,
    long_description: "",
    lat: "",
    lng: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/otis/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trip_id: tripId,
          name: form.name,
          location: form.location || undefined,
          category: form.category,
          long_description: form.long_description || undefined,
          lat: form.lat ? parseFloat(form.lat) : undefined,
          lng: form.lng ? parseFloat(form.lng) : undefined,
        }),
      });
      if (res.ok) onAdded();
      else showToast({ text: "Something went wrong. Try again?", type: "error" });
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
          style={{ background: "rgba(74, 124, 89, 0.45)" }}
        />
        <h2 className="mb-4 font-caveat text-3xl text-navy">Add a New Place 📍</h2>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="mb-3 w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-nunito"
          required
        />
        <input
          placeholder="Location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="mb-3 w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-nunito"
        />
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value as PlaceCategory })}
          className="mb-3 w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-nunito"
        >
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <textarea
          placeholder="Long description"
          value={form.long_description}
          onChange={(e) => setForm({ ...form, long_description: e.target.value })}
          className="mb-3 w-full rounded border border-kraft bg-cream px-3 py-2 font-nunito"
        />
        <div className="mb-3 flex gap-2">
          <input
            placeholder="Lat"
            value={form.lat}
            onChange={(e) => setForm({ ...form, lat: e.target.value })}
            className="w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-nunito"
          />
          <input
            placeholder="Lng"
            value={form.lng}
            onChange={(e) => setForm({ ...form, lng: e.target.value })}
            className="w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-nunito"
          />
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded border py-3 font-caveat text-lg">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded bg-coral py-3 font-caveat text-lg text-cream"
          >
            {loading ? "Saving..." : "Add →"}
          </button>
        </div>
      </form>
    </div>
  );
}
