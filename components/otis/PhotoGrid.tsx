"use client";

import { useState } from "react";
import Image from "next/image";
import type { Photo } from "@/types/otis";
import Lightbox from "./Lightbox";
import { showToast } from "./Toast";

interface PhotoGridProps {
  photos: Photo[];
  placeName?: string;
  isAdmin?: boolean;
  placeId?: string;
}

export default function PhotoGrid({ photos, isAdmin, placeId }: PhotoGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [localPhotos, setLocalPhotos] = useState(photos);

  const validPhotos = localPhotos.filter((p) => p.storage_url);
  if (!validPhotos.length) return null;

  const displayPhotos = validPhotos.slice(0, 4);
  const extraCount = validPhotos.length - 4;

  function openAt(index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  async function setHeroShot(photoId: string) {
    try {
      const res = await fetch(`/api/otis/photos/${photoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_hero_shot: true }),
      });
      if (!res.ok) throw new Error("failed");
      setLocalPhotos((prev) =>
        prev.map((p) => ({ ...p, is_hero_shot: p.id === photoId }))
      );
      showToast({ text: "⭐ Hero shot set!" });
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    }
  }

  async function setTripHighlight(photoId: string) {
    try {
      const res = await fetch(`/api/otis/photos/${photoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_trip_highlight: true }),
      });
      if (!res.ok) throw new Error("failed");
      setLocalPhotos((prev) =>
        prev.map((p) => ({ ...p, is_trip_highlight: p.id === photoId }))
      );
      showToast({ text: "⭐ Trip highlight set!" });
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-1">
        {displayPhotos.map((photo, i) => (
          <div key={photo.id} className="group/photo relative">
            <button
              type="button"
              onClick={() => openAt(i)}
              className="relative aspect-square w-full overflow-hidden bg-kraft/30"
            >
              <Image
                src={photo.storage_url!}
                alt={photo.caption ?? ""}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 200px"
              />
              {photo.caption && (
                <div className="absolute inset-0 flex items-end bg-navy/0 p-2 opacity-0 transition-opacity group-hover/photo:opacity-100 group-hover/photo:bg-navy/60">
                  <p className="font-caveat text-sm text-cream">{photo.caption}</p>
                </div>
              )}
              {i === 3 && extraCount > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-navy/50 font-caveat text-2xl text-cream">
                  +{extraCount} more
                </div>
              )}
            </button>
            {(photo.is_hero_shot || photo.is_trip_highlight) && (
              <span className="absolute left-1 top-1 text-sm">⭐</span>
            )}
            {isAdmin && placeId && (
              <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover/photo:opacity-100">
                <button
                  type="button"
                  title="Set as place hero"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHeroShot(photo.id);
                  }}
                  className="rounded bg-cream/90 px-1 text-xs"
                >
                  ⭐
                </button>
                <button
                  type="button"
                  title="Set as trip highlight"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTripHighlight(photo.id);
                  }}
                  className="rounded bg-cream/90 px-1 text-xs"
                >
                  🌍
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <Lightbox
        photos={validPhotos}
        index={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
