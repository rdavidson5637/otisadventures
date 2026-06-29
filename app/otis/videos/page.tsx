"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import Image from "next/image";
import { getRotation } from "@/lib/otis-utils";
import type { VideoWithRelations } from "@/types/otis";
import { AdminOnly } from "@/components/otis/AdminGate";
import VideoPlayer from "@/components/otis/VideoPlayer";
import VideoUploadModal from "@/components/otis/VideoUploadModal";

export default function VideosPageClient() {
  const [videos, setVideos] = useState<VideoWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<VideoWithRelations | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch("/api/otis/videos?all=true");
      if (res.ok) setVideos(await res.json());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const grouped = useMemo(() => {
    const groups = new Map<string, VideoWithRelations[]>();
    for (const video of videos) {
      const key = video.trip_name ?? "Other";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(video);
    }
    return Array.from(groups.entries());
  }, [videos]);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-center font-caveat text-2xl text-navy">Loading videos... 🎬</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-12 text-center">
        <h1 className="font-caveat text-5xl font-bold text-navy md:text-6xl">
          Otis&apos; Videos 🎬
        </h1>
        <p className="mt-4 font-caveat text-xl text-navy/70">
          Every precious moment, captured on camera 💛
        </p>
      </header>

      {videos.length === 0 ? (
        <p className="text-center font-caveat text-2xl text-navy/60">
          No videos yet — go capture some magic! 🎬
        </p>
      ) : (
        grouped.map(([tripName, tripVideos]) => (
          <section key={tripName} className="mb-12">
            <h2 className="mb-6 font-caveat text-3xl text-navy">{tripName}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tripVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onPlay={() => setPlayingVideo(video)}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <AdminOnly>
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="fixed bottom-6 right-6 z-40 rounded-full bg-coral px-5 py-3 font-caveat text-lg text-cream shadow-lg safe-bottom"
        >
          Upload a video +
        </button>
      </AdminOnly>

      {playingVideo && (
        <VideoPlayer
          video={playingVideo}
          onClose={() => setPlayingVideo(null)}
        />
      )}

      {showUpload && (
        <VideoUploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={() => {
            setShowUpload(false);
            fetchVideos();
          }}
        />
      )}
    </main>
  );
}

function VideoCard({
  video,
  onPlay,
}: {
  video: VideoWithRelations;
  onPlay: () => void;
}) {
  const rotation = getRotation(video.id);

  return (
    <button
      type="button"
      onClick={onPlay}
      className="scrapbook-card group relative overflow-hidden text-left transition-transform hover:scale-[1.02]"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <div
        className="washi-tape left-1/2 -translate-x-1/2"
        style={{ background: "rgba(139, 107, 168, 0.45)" }}
      />

      <div className="relative aspect-video w-full overflow-hidden bg-navy/20">
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt=""
            fill
            className="object-cover"
            sizes="400px"
          />
        ) : (
          <div className="h-full w-full bg-navy/40" />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <span className="text-5xl">▶️</span>
        </div>
      </div>

      <div className="p-4">
        {video.place_name && (
          <h3 className="font-caveat text-xl font-bold text-navy">{video.place_name}</h3>
        )}
        {video.trip_name && (
          <p className="font-nunito text-sm text-navy/50">{video.trip_name}</p>
        )}
        {video.caption && (
          <p className="mt-2 font-caveat text-base italic text-navy/70">{video.caption}</p>
        )}
        <p className="mt-2 font-caveat text-sm text-navy/60">
          {video.taken_by && `🎬 ${video.taken_by}`}
          {video.taken_by && video.taken_date && " · "}
          {video.taken_date &&
            format(parseISO(video.taken_date), "d MMM yyyy")}
        </p>
      </div>
    </button>
  );
}
