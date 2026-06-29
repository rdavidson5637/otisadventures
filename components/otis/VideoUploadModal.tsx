"use client";

import { useCallback, useRef, useState } from "react";
import { useAdminName } from "./AdminGate";
import { showToast } from "./Toast";

interface VideoUploadModalProps {
  placeId?: string;
  tripId?: string;
  onClose: () => void;
  onUploaded: () => void;
}

const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export default function VideoUploadModal({
  placeId,
  tripId,
  onClose,
  onUploaded,
}: VideoUploadModalProps) {
  const adminName = useAdminName();
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [caption, setCaption] = useState("");
  const [takenDate, setTakenDate] = useState(new Date().toISOString().split("T")[0]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileSelect = useCallback((selected: File) => {
    if (!ALLOWED_TYPES.includes(selected.type)) {
      showToast({ text: "Please choose mp4, mov, or webm", type: "error" });
      return;
    }
    setFile(selected);
    setDuration(null);

    const url = URL.createObjectURL(selected);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      setDuration(video.duration);
      URL.revokeObjectURL(url);
    };
    video.src = url;
  }, []);

  function fileToBase64(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  }

  async function captureThumbnail(): Promise<string | undefined> {
    const el = videoRef.current;
    if (!el || el.readyState < 2) return undefined;

    const canvas = document.createElement("canvas");
    canvas.width = el.videoWidth || 320;
    canvas.height = el.videoHeight || 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  }

  function uploadWithProgress(payload: object): Promise<boolean> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/otis/videos");
      xhr.setRequestHeader("Content-Type", "application/json");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
      xhr.onerror = () => resolve(false);
      xhr.send(JSON.stringify(payload));
    });
  }

  async function handleSave() {
    if (!file) return;
    setLoading(true);
    setUploadProgress(0);

    try {
      const base64 = await fileToBase64(file);
      const thumbnail = await captureThumbnail();

      const ok = await uploadWithProgress({
        base64,
        filename: file.name,
        mime_type: file.type,
        place_id: placeId,
        trip_id: tripId,
        caption: caption || undefined,
        taken_by: adminName ?? undefined,
        taken_date: takenDate,
        duration_seconds: duration ? Math.round(duration) : undefined,
        thumbnail_base64: thumbnail,
      });

      if (ok) {
        showToast({ text: "🎬 Video saved!" });
        onUploaded();
        onClose();
      } else {
        showToast({ text: "Video upload failed. Try again?", type: "error" });
      }
    } catch {
      showToast({ text: "Video upload failed. Try again?", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center">
      <div className="scrapbook-card relative max-h-[90vh] w-full overflow-y-auto p-6 md:max-w-lg md:rounded">
        <div
          className="washi-tape left-1/2 -translate-x-1/2"
          style={{ background: "rgba(139, 107, 168, 0.45)" }}
        />
        <h2 className="mb-4 font-caveat text-3xl text-navy">Add Video 🎬</h2>

        <p className="mb-3 font-caveat text-sm text-navy/50">
          Keep videos under 30 seconds for best performance
        </p>

        <div
          className="mb-4 flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-kraft p-4"
          onClick={() => document.getElementById("otis-video-input")?.click()}
        >
          <span className="font-caveat text-xl text-navy/70">
            {file ? file.name : "Tap to choose a video"}
          </span>
          <input
            id="otis-video-input"
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
        </div>

        {file && (
          <>
            <video
              ref={videoRef}
              src={URL.createObjectURL(file)}
              className="mb-2 hidden"
              preload="metadata"
            />
            {duration !== null && (
              <p className="mb-2 font-caveat text-sm text-navy/70">
                Duration: {Math.round(duration)}s
                {duration > 60 && (
                  <span className="ml-2 text-coral">
                    This video is quite long — consider trimming it
                  </span>
                )}
              </p>
            )}
          </>
        )}

        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption..."
          className="mb-3 w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-caveat text-lg"
        />

        <input
          type="date"
          value={takenDate}
          onChange={(e) => setTakenDate(e.target.value)}
          className="mb-4 w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-nunito"
        />

        {loading && (
          <div className="mb-4">
            <div className="h-2 overflow-hidden rounded bg-kraft/30">
              <div
                className="h-full bg-coral transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="mt-1 text-center font-caveat text-sm text-navy/60">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] flex-1 rounded border border-navy/20 font-caveat text-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || !file}
            className="min-h-[48px] flex-1 rounded bg-coral font-caveat text-lg text-cream disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Save →"}
          </button>
        </div>
      </div>
    </div>
  );
}
