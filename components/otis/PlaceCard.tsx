"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import Image from "next/image";
import { CATEGORY_COLORS, getRotation } from "@/lib/otis-utils";
import type { Comment, Photo, Place, Reaction, Video } from "@/types/otis";
import { useIsAdmin, useAdminName } from "./AdminGate";
import { useOtis } from "@/lib/otis-context";
import CommentsSection from "./CommentsSection";
import PhotoGrid from "./PhotoGrid";
import PlaceDrawer from "./PlaceDrawer";
import ReactionsRow from "./ReactionsRow";
import UploadModal from "./UploadModal";
import VideoPlayer from "./VideoPlayer";
import VideoUploadModal from "./VideoUploadModal";
import { showToast } from "./Toast";

interface PlaceCardProps {
  place: Place;
  photos?: Photo[];
  video?: Video | null;
  comments?: Comment[];
  reactions?: Reaction[];
  readOnly?: boolean;
  onUpdate?: (place: Place) => void;
  onPhotosChange?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

export default function PlaceCard({
  place: initialPlace,
  photos = [],
  video: initialVideo,
  comments = [],
  reactions = [],
  readOnly = false,
  onUpdate,
  onPhotosChange,
  style,
  className = "",
}: PlaceCardProps) {
  const isAdmin = useIsAdmin() && !readOnly;
  const adminName = useAdminName();
  const { getAgeShort, getAge } = useOtis();
  const [place, setPlace] = useState(initialPlace);
  const [video, setVideo] = useState<Video | null>(initialVideo ?? null);
  const [showUpload, setShowUpload] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const rotation = getRotation(place.id);
  const categoryColor = CATEGORY_COLORS[place.category ?? "nature"] ?? "#5B8DB8";
  const hasPhotos = photos.some((p) => p.storage_url);
  const hasVideo = !!video?.storage_url;

  const fetchVideo = useCallback(async () => {
    try {
      const res = await fetch(`/api/otis/videos?place_id=${place.id}`);
      if (res.ok) {
        const data = await res.json();
        setVideo(data);
      }
    } catch {
      /* ignore */
    }
  }, [place.id]);

  useEffect(() => {
    if (!initialVideo) fetchVideo();
  }, [initialVideo, fetchVideo]);

  async function patchPlace(updates: Partial<Place> & { admin_name?: string }) {
    try {
      const res = await fetch(`/api/otis/places/${place.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updates,
          admin_name: updates.admin_name ?? adminName ?? undefined,
        }),
      });
      if (!res.ok) throw new Error("failed");
      const updated = await res.json();
      setPlace(updated);
      onUpdate?.(updated);
      return true;
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
      return false;
    }
  }

  async function toggleVisited() {
    const newVisited = !place.visited;
    const updates: Partial<Place> = {
      visited: newVisited,
      visited_date: newVisited
        ? new Date().toISOString().split("T")[0]
        : null,
    };
    const ok = await patchPlace(updates);
    if (ok) {
      showToast({
        text: newVisited ? "🎉 Adventure logged!" : "Removed from visited",
      });
    }
  }

  async function setRating(rating: number) {
    await patchPlace({ otis_rating: rating });
  }

  function handlePlaceUpdate(updated: Place) {
    setPlace(updated);
    onUpdate?.(updated);
  }

  return (
    <article
      className={`scrapbook-card group relative overflow-hidden transition-all duration-300 hover:z-10 hover:scale-[1.02] hover:rotate-0 ${className}`}
      style={{ transform: `rotate(${rotation}deg)`, ...style }}
    >
      <div
        className="washi-tape left-1/2 -translate-x-1/2"
        style={{ background: `rgba(${hexToRgb(categoryColor)}, 0.45)` }}
      />

      <div className="relative">
        {hasPhotos || hasVideo ? (
          <div className="relative">
            {hasPhotos && (
              <PhotoGrid
                photos={photos}
                placeName={place.name}
                isAdmin={isAdmin}
                placeId={place.id}
              />
            )}
            {hasVideo && (
              <button
                type="button"
                onClick={() => setShowVideoPlayer(true)}
                className={`relative overflow-hidden bg-navy/20 ${
                  hasPhotos ? "absolute bottom-2 left-2 h-20 w-20 rounded shadow-lg" : "aspect-[2/1] w-full"
                }`}
              >
                {video!.thumbnail_url ? (
                  <div className="relative h-full w-full">
                    <Image
                      src={video!.thumbnail_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-navy/40" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <span className="text-3xl">▶️</span>
                </div>
              </button>
            )}
          </div>
        ) : isAdmin ? (
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="flex aspect-[2/1] w-full flex-col items-center justify-center bg-kraft/30 font-caveat text-lg text-navy/60 hover:bg-kraft/50"
          >
            <span className="text-3xl">📷</span>
            Tap to add photos of Otis!
          </button>
        ) : (
          <div className="flex aspect-[2/1] w-full items-center justify-center bg-kraft/30 font-caveat text-lg text-navy/60">
            No photos yet 📷
          </div>
        )}

        {isAdmin && (hasPhotos || hasVideo) && (
          <div className="absolute bottom-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="rounded-full bg-coral px-3 py-1 font-caveat text-sm text-cream shadow"
            >
              + Add photos
            </button>
            {!hasVideo && (
              <button
                type="button"
                onClick={() => setShowVideoUpload(true)}
                className="rounded-full bg-navy px-3 py-1 font-caveat text-sm text-cream shadow"
              >
                Add video 🎬
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-4">
        {place.category && (
          <span
            className="font-caveat text-xs font-bold uppercase tracking-wide"
            style={{ color: categoryColor }}
          >
            {place.category}
          </span>
        )}
        <h3 className="font-caveat text-[22px] font-bold text-navy">{place.name}</h3>
        {place.location && (
          <p className="font-nunito text-sm text-navy/60">📍 {place.location}</p>
        )}

        <div className="mt-3">
          <p className="font-caveat text-sm text-navy/70">Otis&apos; rating</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                disabled={!isAdmin}
                onClick={() => isAdmin && setRating(n)}
                className={`text-xl ${!isAdmin ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
              >
                {n <= (place.otis_rating ?? 0) ? "👶" : "○"}
              </button>
            ))}
          </div>
        </div>

        {isAdmin ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={place.visited_date ?? ""}
              onChange={(e) => patchPlace({ visited_date: e.target.value || null })}
              className="rounded border border-kraft bg-cream px-2 py-1 font-nunito text-sm"
            />
            <button
              type="button"
              onClick={toggleVisited}
              className={`rounded px-3 py-1 font-caveat text-base ${
                place.visited
                  ? "bg-green/20 text-green"
                  : "border border-kraft text-navy"
              }`}
            >
              {place.visited ? "We were here! ✅" : "Mark as visited"}
            </button>
          </div>
        ) : (
          place.visited_date && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-block rounded bg-green/20 px-2 py-1 font-caveat text-sm text-green">
                Visited {format(parseISO(place.visited_date), "d MMM yyyy")}
              </span>
              {getAgeShort(place.visited_date) && (
                <span className="rounded bg-kraft/60 px-2 py-1 font-caveat text-sm text-navy/70">
                  Age: {getAgeShort(place.visited_date)}
                </span>
              )}
            </div>
          )
        )}

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="mt-4 font-caveat text-base text-navy hover:text-coral"
        >
          Learn more about this place →
        </button>

        {!readOnly && (
          <>
            <ReactionsRow placeId={place.id} initialReactions={reactions} />
            <CommentsSection placeId={place.id} initialComments={comments} />
          </>
        )}
      </div>

      <PlaceDrawer
        place={place}
        photos={photos}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdate={handlePlaceUpdate}
      />

      {showUpload && (
        <UploadModal
          placeId={place.id}
          onClose={() => setShowUpload(false)}
          onUploaded={() => {
            onPhotosChange?.();
            setShowUpload(false);
          }}
        />
      )}

      {showVideoUpload && (
        <VideoUploadModal
          placeId={place.id}
          onClose={() => setShowVideoUpload(false)}
          onUploaded={() => {
            fetchVideo();
            setShowVideoUpload(false);
          }}
        />
      )}

      {showVideoPlayer && video && (
        <VideoPlayer video={video} onClose={() => setShowVideoPlayer(false)} />
      )}
    </article>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

export function PlaceCardSkeleton() {
  return <div className="h-96 rounded bg-kraft/50 skeleton-shimmer" />;
}
