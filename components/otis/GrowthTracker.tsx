"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import Image from "next/image";
import { calculateAge } from "@/lib/age-utils";
import { OTIS_DOB } from "@/lib/otis-constants";
import type { GrowthEntry } from "@/types/otis";
import { AdminOnly, useIsAdmin } from "./AdminGate";
import { showToast } from "./Toast";

const RULER_MIN = 40;
const RULER_MAX = 140;
const RULER_STEP = 5;

interface GrowthTrackerProps {
  initialEntries?: GrowthEntry[];
  initialDob?: string;
}

export default function GrowthTracker({
  initialEntries = [],
  initialDob,
}: GrowthTrackerProps) {
  const isAdmin = useIsAdmin();
  const [entries, setEntries] = useState<GrowthEntry[]>(initialEntries);
  const [dob] = useState(initialDob ?? OTIS_DOB);
  const [showModal, setShowModal] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/otis/growth");
      if (res.ok) setEntries(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.measured_date.localeCompare(b.measured_date)),
    [entries]
  );

  const current = sorted[sorted.length - 1];
  const first = sorted[0];
  const growthSinceStart =
    current && first && sorted.length > 1
      ? (current.height_cm - first.height_cm).toFixed(1)
      : null;

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/otis/growth/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      setEntries((prev) => prev.filter((e) => e.id !== id));
      showToast({ text: "Entry removed" });
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    }
  }

  const rulerHeight = 600;
  const pxPerCm = rulerHeight / (RULER_MAX - RULER_MIN);

  function heightToY(cm: number) {
    return rulerHeight - (cm - RULER_MIN) * pxPerCm;
  }

  return (
    <div>
      {current && (
        <div className="scrapbook-card relative mb-8 p-6 text-center">
          <div
            className="washi-tape left-1/2 -translate-x-1/2"
            style={{ background: "rgba(74, 124, 89, 0.45)" }}
          />
          <p className="font-caveat text-6xl font-bold text-navy">
            {current.height_cm} cm
          </p>
          {dob && (
            <p className="mt-2 font-caveat text-2xl text-green">
              Otis is {calculateAge(dob, current.measured_date)} old
            </p>
          )}
          {growthSinceStart && (
            <p className="mt-2 font-caveat text-lg text-navy/70">
              He&apos;s grown {growthSinceStart}cm since we started measuring! 🚀
            </p>
          )}
        </div>
      )}

      <div className="relative mx-auto mb-8 max-h-[500px] overflow-y-auto rounded border border-kraft bg-cream p-4">
        <div className="relative mx-auto" style={{ height: rulerHeight, width: 200 }}>
          {current && (
            <div
              className="absolute bottom-0 left-8 right-8 rounded-t bg-green/15"
              style={{ height: heightToY(RULER_MIN) - heightToY(current.height_cm) + pxPerCm }}
            />
          )}

          {Array.from(
            { length: (RULER_MAX - RULER_MIN) / RULER_STEP + 1 },
            (_, i) => RULER_MIN + i * RULER_STEP
          ).map((cm) => (
            <div
              key={cm}
              className="absolute left-0 right-0 flex items-center"
              style={{ top: heightToY(cm) }}
            >
              <span className="w-10 text-right font-nunito text-xs text-navy/50">
                {cm}
              </span>
              <div className="ml-2 h-px flex-1 bg-kraft" />
            </div>
          ))}

          {sorted.map((entry, i) => {
            const isLatest = i === sorted.length - 1;
            const y = heightToY(entry.height_cm);
            return (
              <div
                key={entry.id}
                className="group absolute left-0 right-0"
                style={{ top: y }}
              >
                <div
                  className={`ml-12 mr-0 ${isLatest ? "h-[3px] bg-coral" : "h-[2px] bg-coral"}`}
                />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 rounded bg-cream px-2 py-1 shadow-sm">
                  <p className="whitespace-nowrap font-caveat text-sm font-bold text-navy">
                    {entry.height_cm} cm
                    {isLatest && " →"}
                  </p>
                  {dob && (
                    <p className="font-caveat text-xs text-green">
                      {calculateAge(dob, entry.measured_date)}
                    </p>
                  )}
                  <p className="font-nunito text-[10px] text-navy/50">
                    {format(parseISO(entry.measured_date), "d MMM yyyy")}
                  </p>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    🗑️
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {sorted.some((e) => e.photo_url) && (
        <div className="mb-8 flex gap-4 overflow-x-auto pb-2 scrollbar-none">
          {sorted
            .filter((e) => e.photo_url)
            .map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setLightboxPhoto(entry.photo_url!)}
                className="shrink-0 rotate-1 rounded bg-cream p-2 shadow"
              >
                <div className="relative h-24 w-20 overflow-hidden">
                  <Image
                    src={entry.photo_url!}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <p className="mt-1 font-caveat text-xs text-navy">
                  {entry.height_cm} cm
                </p>
                <p className="font-nunito text-[10px] text-navy/50">
                  {format(parseISO(entry.measured_date), "d MMM yyyy")}
                </p>
              </button>
            ))}
        </div>
      )}

      <AdminOnly>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="rounded bg-coral px-4 py-2 font-caveat text-lg text-cream"
        >
          Log height +
        </button>
      </AdminOnly>

      {showModal && (
        <GrowthModal
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            fetchEntries();
          }}
        />
      )}

      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxPhoto}
            alt=""
            className="max-h-[90vh] max-w-full rounded"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {!entries.length && (
        <p className="text-center font-caveat text-2xl text-navy/60">
          No height measurements yet — time to measure Otis! 📏
        </p>
      )}
    </div>
  );
}

function GrowthModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [height, setHeight] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!height) return;
    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        height_cm: parseFloat(height),
        measured_date: date,
        note: note || undefined,
      };

      if (photo) {
        payload.photo_base64 = await fileToBase64(photo);
        payload.photo_filename = photo.name;
      }

      const res = await fetch("/api/otis/growth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("failed");
      showToast({ text: "📏 Height logged!" });
      onSaved();
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={handleSubmit}
        className="scrapbook-card relative w-full max-w-md p-6"
      >
        <div
          className="washi-tape left-1/2 -translate-x-1/2"
          style={{ background: "rgba(74, 124, 89, 0.45)" }}
        />
        <h2 className="mb-4 font-caveat text-3xl text-navy">Log Height 📏</h2>

        <p className="mb-2 text-center font-caveat text-5xl text-navy">
          {height || "—"} cm
        </p>

        <input
          type="number"
          step="0.1"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          placeholder="Height in cm"
          className="mb-3 w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-nunito"
          required
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mb-3 w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-nunito"
        />

        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          className="mb-3 w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-caveat text-lg"
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          className="mb-4 w-full font-nunito text-sm"
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded border border-navy/20 py-3 font-caveat text-lg"
          >
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
