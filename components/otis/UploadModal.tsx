"use client";

import { useCallback, useState } from "react";
import { compressImage, formatFileSize } from "@/lib/compress-image";
import { useAdminName } from "./AdminGate";
import { showToast } from "./Toast";

interface UploadModalProps {
  placeId: string;
  onClose: () => void;
  onUploaded: () => void;
}

interface FilePreview {
  file: File;
  originalFile: File;
  preview: string;
  originalSize: number;
  compressedSize: number;
  compressing: boolean;
  caption: string;
}

export default function UploadModal({ placeId, onClose, onUploaded }: UploadModalProps) {
  const adminName = useAdminName();
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [takenDate, setTakenDate] = useState(new Date().toISOString().split("T")[0]);
  const [memoryNote, setMemoryNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const processFiles = useCallback(async (incoming: FileList | File[]) => {
    const list = Array.from(incoming).filter((f) => f.type.startsWith("image/"));

    const placeholders: FilePreview[] = list.map((file) => ({
      file,
      originalFile: file,
      preview: URL.createObjectURL(file),
      originalSize: file.size,
      compressedSize: file.size,
      compressing: true,
      caption: "",
    }));

    setFiles((prev) => [...prev, ...placeholders]);
    const startIndex = files.length;

    for (let i = 0; i < list.length; i++) {
      const original = list[i];
      const compressed = await compressImage(original);
      const idx = startIndex + i;

      setFiles((prev) => {
        const next = [...prev];
        if (next[idx]) {
          next[idx] = {
            ...next[idx],
            file: compressed,
            compressedSize: compressed.size,
            compressing: false,
          };
        }
        return next;
      });
    }
  }, [files.length]);

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleSave() {
    if (!files.length || files.some((f) => f.compressing)) return;
    setLoading(true);
    let saved = 0;

    try {
      for (const { file, caption } of files) {
        const base64 = await fileToBase64(file);
        const res = await fetch("/api/otis/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base64,
            filename: file.name.replace(/\.[^.]+$/, ".jpg"),
            place_id: placeId,
            memory_note: memoryNote || undefined,
            caption: caption || undefined,
            taken_by: adminName ?? undefined,
            taken_date: takenDate,
            admin_name: adminName ?? undefined,
          }),
        });
        if (res.ok) saved++;
      }

      if (saved > 0) {
        showToast({
          text: saved === 1 ? "📸 1 photo saved!" : `📸 ${saved} photos saved!`,
        });
        onUploaded();
        onClose();
      } else {
        showToast({ text: "Photo upload failed. Try again?", type: "error" });
      }
    } catch {
      showToast({ text: "Photo upload failed. Try again?", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center">
      <div className="scrapbook-card relative max-h-[90vh] w-full overflow-y-auto p-6 md:max-w-lg md:rounded">
        <div
          className="washi-tape left-1/2 -translate-x-1/2"
          style={{ background: "rgba(91, 141, 184, 0.45)" }}
        />
        <h2 className="mb-4 font-caveat text-3xl text-navy">Add Photos 📸</h2>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            processFiles(e.dataTransfer.files);
          }}
          className={`mb-2 flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed p-4 transition-colors ${
            dragOver ? "border-coral bg-coral/10" : "border-kraft"
          }`}
          onClick={() => document.getElementById("otis-file-input")?.click()}
        >
          <span className="font-caveat text-xl text-navy/70">
            Drop photos here or tap to browse
          </span>
          <input
            id="otis-file-input"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && processFiles(e.target.files)}
          />
        </div>

        <p className="mb-4 font-caveat text-sm text-navy/50">
          Photos are automatically compressed to keep things fast 📱
        </p>

        {files.length > 0 && (
          <div className="mb-4 space-y-3">
            {files.map((f, i) => (
              <div key={i}>
                <div className="relative inline-block">
                  <div className="relative h-16 w-16 overflow-hidden rounded">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.preview} alt="" className="h-full w-full object-cover" />
                    {f.compressing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-navy/40 font-caveat text-xs text-cream">
                        Compressing... ⚡
                      </div>
                    )}
                  </div>
                  <p className="mt-1 max-w-[64px] text-center font-nunito text-[10px] text-navy/60">
                    {f.compressing
                      ? "..."
                      : `${formatFileSize(f.originalSize)} → ${formatFileSize(f.compressedSize)}`}
                  </p>
                </div>
                <input
                  placeholder="Add a caption..."
                  value={f.caption}
                  onChange={(e) =>
                    setFiles((prev) => {
                      const next = [...prev];
                      next[i] = { ...next[i], caption: e.target.value };
                      return next;
                    })
                  }
                  className="mt-1 w-full rounded border border-kraft bg-cream px-2 py-1 font-caveat text-sm"
                />
              </div>
            ))}
          </div>
        )}

        <input
          type="date"
          value={takenDate}
          onChange={(e) => setTakenDate(e.target.value)}
          className="mb-3 w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-nunito"
        />

        <textarea
          value={memoryNote}
          onChange={(e) => setMemoryNote(e.target.value)}
          placeholder="✏️ Write a memory here... what did Otis do? What made you smile?"
          className="mb-4 w-full min-h-[80px] rounded border border-kraft bg-cream px-3 py-2 font-caveat text-lg"
        />

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
            disabled={loading || !files.length || files.some((f) => f.compressing)}
            className="min-h-[48px] flex-1 rounded bg-coral font-caveat text-lg text-cream disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save →"}
          </button>
        </div>
      </div>
    </div>
  );
}
