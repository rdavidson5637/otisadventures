"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CATEGORY_COLORS } from "@/lib/otis-utils";
import { useOtis } from "@/lib/otis-context";
import type { Photo, Place } from "@/types/otis";
import { useIsAdmin } from "./AdminGate";
import Lightbox from "./Lightbox";
import { showToast } from "./Toast";

interface PlaceDrawerProps {
  place: Place;
  photos: Photo[];
  open: boolean;
  onClose: () => void;
  onUpdate?: (place: Place) => void;
}

export default function PlaceDrawer({
  place: initialPlace,
  photos,
  open,
  onClose,
  onUpdate,
}: PlaceDrawerProps) {
  const isAdmin = useIsAdmin();
  const { getAge } = useOtis();
  const [place, setPlace] = useState(initialPlace);
  const [editingLongDesc, setEditingLongDesc] = useState(false);
  const [editingThoughts, setEditingThoughts] = useState(false);
  const [longDescDraft, setLongDescDraft] = useState(initialPlace.long_description ?? "");
  const [thoughtsDraft, setThoughtsDraft] = useState(initialPlace.otis_thoughts ?? "");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  const categoryColor = CATEGORY_COLORS[place.category ?? "nature"] ?? "#5B8DB8";
  const validPhotos = photos.filter((p) => p.storage_url);

  useEffect(() => {
    setPlace(initialPlace);
    setLongDescDraft(initialPlace.long_description ?? "");
    setThoughtsDraft(initialPlace.otis_thoughts ?? "");
  }, [initialPlace]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = "hidden";
    } else {
      setVisible(false);
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  async function saveField(field: "long_description" | "otis_thoughts", value: string) {
    try {
      const res = await fetch(`/api/otis/places/${place.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value || null }),
      });
      if (!res.ok) throw new Error("failed");
      const updated = await res.json();
      setPlace(updated);
      onUpdate?.(updated);
      showToast({ text: "Saved! ✏️" });
      if (field === "long_description") setEditingLongDesc(false);
      if (field === "otis_thoughts") setEditingThoughts(false);
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    }
  }

  const showThoughtsSection =
    isAdmin || Boolean(place.otis_thoughts);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end md:items-stretch">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 bg-black/50 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={onClose}
      />

      <div
        className={`relative flex max-h-[92vh] w-full max-w-[560px] flex-col bg-cream shadow-2xl transition-transform duration-300 ease-out md:h-full md:max-h-none ${
          visible
            ? "translate-y-0 md:translate-x-0"
            : "translate-y-full md:translate-y-0 md:translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="relative shrink-0 border-b border-kraft/40 p-6 pb-4">
          <div
            className="washi-tape left-1/2 -translate-x-1/2"
            style={{ background: `rgba(${hexToRgb(categoryColor)}, 0.45)` }}
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 font-caveat text-2xl text-navy/60 hover:text-navy"
          >
            ✕
          </button>
          {place.category && (
            <span
              className="font-caveat text-xs font-bold uppercase tracking-wide"
              style={{ color: categoryColor }}
            >
              {place.category}
            </span>
          )}
          <h2 className="mt-1 pr-8 font-caveat text-3xl font-bold text-navy">{place.name}</h2>
          {place.location && (
            <p className="font-nunito text-sm text-navy/60">📍 {place.location}</p>
          )}
          {place.visited_date && getAge(place.visited_date) && (
            <p className="mt-1 font-caveat text-base italic text-navy/60">
              Otis was {getAge(place.visited_date)} when he visited
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-4">
          {(place.long_description || isAdmin) && (
            <section className="mb-8">
              <h3 className="font-caveat text-xl text-navy">
                About this place
                <span
                  className="mt-1 block h-0.5 w-12"
                  style={{ backgroundColor: categoryColor }}
                />
              </h3>
              {editingLongDesc || (!place.long_description && isAdmin) ? (
                <div className="mt-3">
                  {!place.long_description && !editingLongDesc && isAdmin ? (
                    <button
                      type="button"
                      onClick={() => setEditingLongDesc(true)}
                      className="font-caveat text-base text-navy hover:text-coral"
                    >
                      Add a description →
                    </button>
                  ) : (
                    <>
                      <textarea
                        value={longDescDraft}
                        onChange={(e) => setLongDescDraft(e.target.value)}
                        className="w-full rounded border border-kraft bg-white/60 px-3 py-2 font-nunito text-base leading-relaxed text-navy/80"
                        rows={6}
                      />
                      <button
                        type="button"
                        onClick={() => saveField("long_description", longDescDraft)}
                        className="mt-2 rounded bg-coral px-4 py-2 font-caveat text-lg text-cream"
                      >
                        Save →
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <p className="mt-3 font-nunito text-base leading-[1.7] text-navy/75">
                  {place.long_description}
                </p>
              )}
            </section>
          )}

          {showThoughtsSection && (
            <section className="mb-8">
              <h3 className="font-caveat text-xl text-navy">What Otis thought 👶</h3>
              {isAdmin && (editingThoughts || !place.otis_thoughts) ? (
                <div className="mt-3">
                  <textarea
                    value={thoughtsDraft}
                    onChange={(e) => setThoughtsDraft(e.target.value)}
                    placeholder="Write about Otis' experience here — what did he love? What made him laugh? Any funny moments?..."
                    className="w-full rounded border border-kraft bg-white/60 px-3 py-2 font-caveat text-lg italic text-navy"
                    rows={5}
                  />
                  <button
                    type="button"
                    onClick={() => saveField("otis_thoughts", thoughtsDraft)}
                    className="mt-2 rounded bg-coral px-4 py-2 font-caveat text-lg text-cream"
                  >
                    Save →
                  </button>
                </div>
              ) : isAdmin && place.otis_thoughts ? (
                <div className="mt-3">
                  <p className="font-caveat text-lg italic text-coral">{place.otis_thoughts}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setThoughtsDraft(place.otis_thoughts ?? "");
                      setEditingThoughts(true);
                    }}
                    className="mt-2 font-caveat text-sm text-navy/60 hover:text-navy"
                  >
                    ✏️ Edit
                  </button>
                </div>
              ) : (
                place.otis_thoughts && (
                  <blockquote
                    className="mt-3 rounded-r border-l-4 border-coral bg-cream/80 px-4 py-3 font-caveat text-lg italic text-coral"
                  >
                    {place.otis_thoughts}
                  </blockquote>
                )
              )}
            </section>
          )}

          {validPhotos.length > 0 && (
            <section>
              <h3 className="mb-3 font-caveat text-xl text-navy">Photos 📷</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {validPhotos.map((photo, i) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => {
                      setLightboxIndex(i);
                      setLightboxOpen(true);
                    }}
                    className="relative h-24 w-24 shrink-0 overflow-hidden rounded bg-kraft/30"
                  >
                    <Image
                      src={photo.storage_url!}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <Lightbox
        photos={validPhotos}
        index={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}
