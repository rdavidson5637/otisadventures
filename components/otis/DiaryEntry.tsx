"use client";

import { format, parseISO } from "date-fns";
import { getRotation, TIME_OF_DAY_LABELS } from "@/lib/otis-utils";
import type { DiaryEntry as DiaryEntryType } from "@/types/otis";
import Image from "next/image";

interface DiaryEntryProps {
  entry: DiaryEntryType;
  isAdmin: boolean;
  onEdit: (entry: DiaryEntryType) => void;
  onDelete: (id: string) => void;
}

export default function DiaryEntry({ entry, isAdmin, onEdit, onDelete }: DiaryEntryProps) {
  const rotation = getRotation(entry.id);
  const timeLabel = entry.time_of_day
    ? TIME_OF_DAY_LABELS[entry.time_of_day] ?? entry.time_of_day
    : "";

  function handleDelete() {
    if (confirm("Are you sure you want to delete this memory?")) {
      onDelete(entry.id);
    }
  }

  return (
    <div className="relative pl-8">
      <div className="absolute left-0 top-4 h-3 w-3 rounded-full bg-coral" />
      <article
        className="scrapbook-card group relative p-4"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <div
          className="washi-tape left-1/2 -translate-x-1/2"
          style={{ background: "rgba(212, 97, 78, 0.45)" }}
        />
        {timeLabel && (
          <p className="font-caveat text-base text-navy/70">{timeLabel}</p>
        )}
        {entry.title && (
          <h3 className="font-caveat text-xl font-bold text-navy">{entry.title}</h3>
        )}
        {entry.note && (
          <p className="mt-1 font-caveat text-base text-navy/70">{entry.note}</p>
        )}
        {entry.photo_url && (
          <div
            className="relative mx-auto mt-3 w-48 overflow-hidden bg-cream p-2 shadow-md"
            style={{ transform: "rotate(-2deg)" }}
          >
            <Image
              src={entry.photo_url}
              alt=""
              width={192}
              height={192}
              className="h-auto w-full object-cover"
            />
          </div>
        )}
        <p className="mt-2 text-right font-nunito text-xs text-navy/40">
          {format(parseISO(entry.created_at), "d MMM yyyy, h:mm a")}
        </p>

        {isAdmin && (
          <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onEdit(entry)}
              className="rounded bg-cream px-2 py-1 text-sm"
            >
              ✏️
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded bg-cream px-2 py-1 text-sm"
            >
              🗑️
            </button>
          </div>
        )}
      </article>
    </div>
  );
}
