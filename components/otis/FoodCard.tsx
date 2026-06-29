"use client";

import { format, parseISO } from "date-fns";
import Image from "next/image";
import { getRotation, MEAL_TYPE_COLORS } from "@/lib/otis-utils";
import type { FoodLog, MealType } from "@/types/otis";

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "🌅 Breakfast",
  lunch: "☀️ Lunch",
  dinner: "🌙 Dinner",
  snack: "🍪 Snack",
};

interface FoodCardProps {
  entry: FoodLog;
  isAdmin: boolean;
  onEdit: (entry: FoodLog) => void;
  onDelete: (id: string) => void;
}

export default function FoodCard({ entry, isAdmin, onEdit, onDelete }: FoodCardProps) {
  const rotation = getRotation(entry.id);
  const mealColor = MEAL_TYPE_COLORS[entry.meal_type ?? "lunch"] ?? "#4A7C59";

  function handleDelete() {
    if (confirm("Are you sure you want to delete this meal?")) {
      onDelete(entry.id);
    }
  }

  return (
    <article
      className="scrapbook-card group relative p-4"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <div
        className="washi-tape left-1/2 -translate-x-1/2"
        style={{ background: `rgba(${hexToRgb(mealColor)}, 0.45)` }}
      />
      {entry.meal_type && (
        <span
          className="absolute right-3 top-3 rounded px-2 py-0.5 font-caveat text-sm text-cream"
          style={{ background: mealColor }}
        >
          {MEAL_LABELS[entry.meal_type]}
        </span>
      )}
      <h3 className="pr-24 font-caveat text-2xl font-bold text-navy">
        {entry.restaurant_name}
      </h3>
      {entry.location && (
        <p className="font-nunito text-sm text-navy/60">📍 {entry.location}</p>
      )}
      {entry.date && (
        <p className="font-nunito text-sm text-navy/50">
          {format(parseISO(entry.date), "d MMM yyyy")}
        </p>
      )}
      {entry.what_otis_ate && (
        <div className="mt-3">
          <p className="font-caveat text-sm text-navy/70">What Otis ate:</p>
          <p className="font-caveat text-lg italic text-navy">{entry.what_otis_ate}</p>
        </div>
      )}
      {entry.otis_rating != null && (
        <div className="mt-2">
          <p className="font-caveat text-sm text-navy/70">Otis&apos; verdict:</p>
          <span className="font-caveat text-xl">
            {"🍴".repeat(entry.otis_rating)}
          </span>
        </div>
      )}
      {entry.photo_url ? (
        <div
          className="relative mx-auto mt-3 w-40 overflow-hidden bg-cream p-2 shadow-md"
          style={{ transform: "rotate(2deg)" }}
        >
          <Image
            src={entry.photo_url}
            alt=""
            width={160}
            height={160}
            className="h-auto w-full object-cover"
          />
        </div>
      ) : (
        <p className="mt-3 font-caveat text-sm text-navy/40">No photo for this one 📷</p>
      )}
      {entry.note && (
        <p className="mt-2 font-caveat text-base italic text-navy/60">{entry.note}</p>
      )}

      {isAdmin && (
        <div className="absolute left-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button type="button" onClick={() => onEdit(entry)} className="text-sm">
            ✏️
          </button>
          <button type="button" onClick={handleDelete} className="text-sm">
            🗑️
          </button>
        </div>
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
