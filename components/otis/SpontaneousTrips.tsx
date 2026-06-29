"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { getRotation } from "@/lib/otis-utils";
import type { SpontaneousTrip } from "@/types/otis";
import PhotoGrid from "./PhotoGrid";
import { AdminOnly } from "./AdminGate";
import { showToast } from "./Toast";
import type { Photo } from "@/types/otis";

interface SpontaneousTripsProps {
  tripId: string;
  isAdmin: boolean;
  initialTrips?: SpontaneousTrip[];
  uploadPlaceId?: string;
}

export default function SpontaneousTrips({
  tripId,
  isAdmin,
  initialTrips,
  uploadPlaceId,
}: SpontaneousTripsProps) {
  const [trips, setTrips] = useState<SpontaneousTrip[]>(initialTrips ?? []);
  const [loading, setLoading] = useState(!initialTrips);
  const [showModal, setShowModal] = useState(false);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/otis/spontaneous?trip_id=${tripId}`);
      if (!res.ok) throw new Error("failed");
      setTrips(await res.json());
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (!initialTrips) fetchTrips();
  }, [initialTrips, fetchTrips]);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this adventure?")) return;
    try {
      const res = await fetch(`/api/otis/spontaneous/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      setTrips((prev) => prev.filter((t) => t.id !== id));
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    }
  }

  return (
    <section className="mt-12">
      <h3 className="mb-6 font-caveat text-2xl font-bold text-cream">
        🌟 Spontaneous Adventures
      </h3>

      <AdminOnly>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="mb-6 rounded bg-coral px-4 py-2 font-caveat text-lg text-cream"
        >
          Add spontaneous trip +
        </button>
      </AdminOnly>

      {loading ? (
        <div className="h-32 rounded bg-kraft/50 skeleton-shimmer" />
      ) : trips.length === 0 ? (
        <p className="font-caveat text-xl text-cream/80">
          No spontaneous adventures yet — what will you discover? 🗺️
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {trips.map((trip) => {
            const photos: Photo[] = (trip.photos ?? []).map((url, i) => ({
              id: `${trip.id}-photo-${i}`,
              place_id: trip.id,
              storage_url: url,
              memory_note: null,
              taken_by: null,
              taken_date: null,
              file_size_kb: null,
              created_at: trip.created_at,
            }));

            return (
              <article
                key={trip.id}
                className="scrapbook-card group relative p-4"
                style={{ transform: `rotate(${getRotation(trip.id)}deg)` }}
              >
                <div
                  className="washi-tape left-1/2 -translate-x-1/2"
                  style={{ background: "rgba(245, 200, 66, 0.45)" }}
                />
                <h4 className="font-caveat text-2xl font-bold text-navy">{trip.name}</h4>
                {trip.location && (
                  <p className="font-nunito text-sm text-navy/60">📍 {trip.location}</p>
                )}
                {trip.date && (
                  <p className="font-caveat text-base text-green">
                    {format(parseISO(trip.date), "d MMM yyyy")}
                  </p>
                )}
                {trip.note && (
                  <p className="mt-2 font-caveat text-base italic text-navy/70">{trip.note}</p>
                )}
                {photos.length > 0 && (
                  <div className="mt-3">
                    <PhotoGrid photos={photos} />
                  </div>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDelete(trip.id)}
                    className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    🗑️
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}

      {showModal && (
        <SpontaneousModal
          tripId={tripId}
          uploadPlaceId={uploadPlaceId}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            fetchTrips();
            showToast({ text: "🌟 Adventure added!" });
          }}
        />
      )}
    </section>
  );
}

function SpontaneousModal({
  tripId,
  uploadPlaceId,
  onClose,
  onSaved,
}: {
  tripId: string;
  uploadPlaceId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    location: "",
    date: new Date().toISOString().split("T")[0],
    note: "",
  });
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function handlePhotoUpload(files: FileList) {
    if (!uploadPlaceId) return;
    for (const file of Array.from(files)) {
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
          if (data.storage_url) {
            setPhotoUrls((prev) => [...prev, data.storage_url]);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/otis/spontaneous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trip_id: tripId,
          ...form,
          photos: photoUrls,
        }),
      });
      if (!res.ok) throw new Error("failed");
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
          style={{ background: "rgba(91, 141, 184, 0.45)" }}
        />
        <h2 className="mb-4 font-caveat text-3xl text-navy">
          Add a Spontaneous Adventure 🌟
        </h2>
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
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="mb-3 w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-nunito"
        />
        <textarea
          placeholder="Note"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          className="mb-3 w-full rounded border border-kraft bg-cream px-3 py-2 font-caveat text-lg"
        />
        {uploadPlaceId && (
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
            className="mb-4 w-full font-nunito text-sm"
          />
        )}
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded border py-3 font-caveat text-lg">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded bg-coral py-3 font-caveat text-lg text-cream"
          >
            {loading ? "Saving..." : "Add to the scrapbook →"}
          </button>
        </div>
      </form>
    </div>
  );
}
