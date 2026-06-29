"use client";

import type { Video } from "@/types/otis";
import { format, parseISO } from "date-fns";

interface VideoPlayerProps {
  video: Video;
  onClose: () => void;
}

export default function VideoPlayer({ video, onClose }: VideoPlayerProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-0 font-caveat text-3xl text-cream md:top-2 md:-right-12"
        >
          ✕
        </button>

        <video
          src={video.storage_url}
          controls
          autoPlay
          playsInline
          className="w-full rounded bg-black md:max-h-[80vh]"
        />

        <div className="mt-4 text-center">
          {video.caption && (
            <p className="font-caveat text-xl text-cream">{video.caption}</p>
          )}
          <p className="mt-1 font-caveat text-base text-cream/70">
            {video.taken_by && `🎬 ${video.taken_by}`}
            {video.taken_by && video.taken_date && " · "}
            {video.taken_date &&
              format(parseISO(video.taken_date), "d MMM yyyy")}
          </p>
        </div>
      </div>
    </div>
  );
}
