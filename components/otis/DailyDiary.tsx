"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  eachDayOfInterval,
  format,
  parseISO,
} from "date-fns";
import type { DiaryEntry as DiaryEntryType, TimeOfDay, WeatherType } from "@/types/otis";
import { TIME_OF_DAY_LABELS } from "@/lib/otis-utils";
import { WEATHER_EMOJIS, WEATHER_LABELS, WEATHER_OPTIONS } from "@/lib/weather-utils";
import DiaryEntry from "./DiaryEntry";
import { showToast } from "./Toast";

interface DailyDiaryProps {
  tripId: string;
  startDate: string;
  endDate: string;
  isAdmin: boolean;
  initialEntries?: DiaryEntryType[];
  uploadPlaceId?: string;
}

export default function DailyDiary({
  tripId,
  startDate,
  endDate,
  isAdmin,
  initialEntries,
  uploadPlaceId,
}: DailyDiaryProps) {
  const dates = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  });

  const [selectedDate, setSelectedDate] = useState(
    format(dates[0] ?? new Date(), "yyyy-MM-dd")
  );
  const [allEntries, setAllEntries] = useState<DiaryEntryType[]>(initialEntries ?? []);
  const [entries, setEntries] = useState<DiaryEntryType[]>([]);
  const [allEntryDates, setAllEntryDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntryType | null>(null);
  const dateStripRef = useRef<HTMLDivElement>(null);

  const fetchEntriesForDate = useCallback(
    async (date: string) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/otis/diary?trip_id=${tripId}&entry_date=${date}`
        );
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        setEntries(data);
      } catch {
        showToast({ text: "Something went wrong. Try again?", type: "error" });
      } finally {
        setLoading(false);
      }
    },
    [tripId]
  );

  const fetchAllDates = useCallback(async () => {
    try {
      const res = await fetch(`/api/otis/diary?trip_id=${tripId}`);
      if (!res.ok) return;
      const data: DiaryEntryType[] = await res.json();
      setAllEntries(data);
      setAllEntryDates(new Set(data.map((e) => e.entry_date)));
    } catch {
      /* ignore */
    }
  }, [tripId]);

  const weatherByDate = useMemo(() => {
    const map: Record<string, WeatherType> = {};
    for (const e of allEntries) {
      if (e.weather && !map[e.entry_date]) map[e.entry_date] = e.weather;
    }
    return map;
  }, [allEntries]);

  const weatherStats = useMemo(() => {
    let sunny = 0;
    let rainy = 0;
    for (const w of Object.values(weatherByDate)) {
      if (w === "sunny") sunny++;
      if (w === "rainy") rainy++;
    }
    return { sunny, rainy };
  }, [weatherByDate]);

  const dayWeather = weatherByDate[selectedDate];

  useEffect(() => {
    fetchEntriesForDate(selectedDate);
  }, [selectedDate, fetchEntriesForDate]);

  useEffect(() => {
    fetchAllDates();
  }, [fetchAllDates]);

  useEffect(() => {
    const el = dateStripRef.current?.querySelector(`[data-date="${selectedDate}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedDate]);

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/otis/diary/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      setEntries((prev) => prev.filter((e) => e.id !== id));
      fetchAllDates();
      showToast({ text: "📝 Memory saved!" });
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    }
  }

  return (
    <div className="px-4 py-6">
      <h2 className="mb-2 font-caveat text-3xl font-bold text-cream">Daily Diary 📅</h2>
      {(weatherStats.sunny > 0 || weatherStats.rainy > 0) && (
        <p className="mb-6 font-caveat text-lg text-cream/80">
          ☀️ {weatherStats.sunny} sunny days · 🌧️ {weatherStats.rainy} rainy days
        </p>
      )}

      <div
        ref={dateStripRef}
        className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none"
      >
        {dates.map((date) => {
          const dateStr = format(date, "yyyy-MM-dd");
          const isActive = dateStr === selectedDate;
          const hasEntries = allEntryDates.has(dateStr);
          const weather = weatherByDate[dateStr];
          return (
            <button
              key={dateStr}
              data-date={dateStr}
              type="button"
              onClick={() => setSelectedDate(dateStr)}
              className={`relative shrink-0 rounded px-3 py-2 font-caveat text-base transition-colors ${
                isActive ? "bg-coral text-cream" : "bg-cream/80 text-navy"
              }`}
            >
              {format(date, "EEE d MMM")}
              {weather && (
                <span className="mt-0.5 block text-center text-sm">
                  {WEATHER_EMOJIS[weather]}
                </span>
              )}
              {hasEntries && !weather && (
                <span className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-green" />
              )}
            </button>
          );
        })}
      </div>

      <div className="relative border-l-2 border-dashed border-kraft pl-4">
        {dayWeather && (
          <div className="mb-6 scrapbook-card p-4">
            <p className="font-caveat text-2xl font-bold text-cream">
              {format(parseISO(selectedDate), "EEEE d MMMM")}
            </p>
            <p className="font-caveat text-lg text-cream/80">
              {WEATHER_EMOJIS[dayWeather]} {WEATHER_LABELS[dayWeather]} · {entries.length}{" "}
              {entries.length === 1 ? "memory" : "memories"} logged
            </p>
          </div>
        )}
        {loading ? (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-32 rounded bg-kraft/50 skeleton-shimmer" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="font-caveat text-xl text-cream/80">
            No memories logged for this day yet — go make some! 🍀
          </p>
        ) : (
          <div className="space-y-6">
            {entries.map((entry) => (
              <DiaryEntry
                key={entry.id}
                entry={entry}
                isAdmin={isAdmin}
                onEdit={(e) => {
                  setEditingEntry(e);
                  setShowModal(true);
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {isAdmin && (
        <>
          <button
            type="button"
            onClick={() => {
              setEditingEntry(null);
              setShowModal(true);
            }}
            className="fixed bottom-20 right-4 z-40 rounded-full bg-coral px-5 py-3 font-caveat text-lg text-cream shadow-lg safe-bottom"
          >
            Add entry +
          </button>

          {showModal && (
            <DiaryEntryModal
              tripId={tripId}
              entryDate={selectedDate}
              uploadPlaceId={uploadPlaceId}
              entry={editingEntry}
              defaultWeather={dayWeather}
              onClose={() => {
                setShowModal(false);
                setEditingEntry(null);
              }}
              onSaved={() => {
                setShowModal(false);
                setEditingEntry(null);
                fetchEntriesForDate(selectedDate);
                fetchAllDates();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

function DiaryEntryModal({
  tripId,
  entryDate,
  uploadPlaceId,
  entry,
  defaultWeather,
  onClose,
  onSaved,
}: {
  tripId: string;
  entryDate: string;
  uploadPlaceId?: string;
  entry: DiaryEntryType | null;
  defaultWeather?: WeatherType;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    time_of_day: (entry?.time_of_day ?? "morning") as TimeOfDay,
    title: entry?.title ?? "",
    note: entry?.note ?? "",
    photo_url: entry?.photo_url ?? "",
    weather: (entry?.weather ?? defaultWeather ?? null) as WeatherType | null,
  });
  const [loading, setLoading] = useState(false);

  async function handlePhotoUpload(file: File) {
    if (!uploadPlaceId) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const res = await fetch("/api/otis/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64,
          filename: file.name,
          place_id: uploadPlaceId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setForm((f) => ({ ...f, photo_url: data.storage_url }));
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body = {
        trip_id: tripId,
        entry_date: entryDate,
        time_of_day: form.time_of_day,
        title: form.title || undefined,
        note: form.note || undefined,
        photo_url: form.photo_url || undefined,
        weather: form.weather || undefined,
      };

      const res = entry
        ? await fetch(`/api/otis/diary/${entry.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/otis/diary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!res.ok) throw new Error("failed");
      showToast({ text: "📝 Memory saved!" });
      onSaved();
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={handleSubmit} className="scrapbook-card relative max-h-[90vh] w-full max-w-md overflow-y-auto p-6">
        <div
          className="washi-tape left-1/2 -translate-x-1/2"
          style={{ background: "rgba(245, 200, 66, 0.45)" }}
        />
        <h2 className="mb-4 font-caveat text-3xl text-navy">
          {entry ? "Edit Memory ✏️" : "Add a Memory 📝"}
        </h2>
        <p className="mb-3 font-caveat text-lg text-navy/70">
          {format(parseISO(entryDate), "EEEE d MMMM yyyy")}
        </p>
        <div className="mb-4">
          <p className="mb-2 font-caveat text-sm text-navy/70">What was the weather like?</p>
          <div className="flex flex-wrap gap-2">
            {WEATHER_OPTIONS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setForm({ ...form, weather: form.weather === w ? null : w })}
                className={`rounded px-3 py-2 text-2xl ${
                  form.weather === w ? "bg-cream shadow" : "bg-transparent"
                }`}
              >
                {WEATHER_EMOJIS[w]}
              </button>
            ))}
          </div>
        </div>
        <select
          value={form.time_of_day}
          onChange={(e) =>
            setForm({ ...form, time_of_day: e.target.value as TimeOfDay })
          }
          className="mb-3 w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-nunito"
        >
          {Object.entries(TIME_OF_DAY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="mb-3 w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-caveat text-lg"
        />
        <textarea
          placeholder="Note"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          className="mb-3 w-full rounded border border-kraft bg-cream px-3 py-2 font-caveat text-lg"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
          className="mb-4 w-full font-nunito text-sm"
        />
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded border py-3 font-caveat text-lg">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded bg-coral py-3 font-caveat text-lg text-cream"
          >
            {loading ? "Saving..." : "Save memory →"}
          </button>
        </div>
      </form>
    </div>
  );
}
