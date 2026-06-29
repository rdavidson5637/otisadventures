"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { getRotation } from "@/lib/otis-utils";
import {
  getTimezoneCityLabel,
  getTimezoneTapeColour,
  TIMEZONE_OPTIONS,
} from "@/lib/timezones";
import { useOtis } from "@/lib/otis-context";
import type { FamilyLocation } from "@/types/otis";
import { AdminOnly } from "./AdminGate";
import { showToast } from "./Toast";

const WhereMapInner = dynamic(() => import("./WhereMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[280px] items-center justify-center bg-cream font-caveat text-2xl text-navy md:h-[400px]">
      Loading map... 🌍
    </div>
  ),
});

type ViewMode = "map" | "cards";

function LiveClock({ timezone }: { timezone: string }) {
  const [time, setTime] = useState("");

  useEffect(() => {
    function tick() {
      setTime(
        new Date().toLocaleTimeString("en-GB", {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timezone]);

  return (
    <div className="mt-2 text-center">
      <p className="font-caveat text-2xl text-coral">{time}</p>
      <p className="font-caveat text-xs text-navy/40">{getTimezoneCityLabel(timezone)}</p>
    </div>
  );
}

function MemberCard({
  member,
  larger,
}: {
  member: FamilyLocation;
  larger?: boolean;
}) {
  const rotation = getRotation(member.member_username);

  return (
    <article
      className={`scrapbook-card relative p-5 transition-all duration-300 hover:z-10 hover:scale-[1.02] hover:rotate-0 ${
        larger ? "md:col-span-1" : ""
      }`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <div
        className="washi-tape left-1/2 -translate-x-1/2"
        style={{ background: getTimezoneTapeColour(member.timezone) }}
      />
      <div className="flex flex-col items-center text-center">
        {member.avatar_url ? (
          <Image
            src={member.avatar_url}
            alt={member.display_name}
            width={56}
            height={56}
            className="h-14 w-14 rounded-full border-2 border-navy/20 object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cream text-lg font-bold text-navy">
            {member.display_name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
        )}
        <h3
          className={`mt-3 font-caveat font-bold text-navy ${
            larger ? "text-3xl" : "text-2xl"
          }`}
        >
          {member.display_name}
        </h3>
        {member.relationship && (
          <p className="font-caveat text-sm text-navy/60">{member.relationship}</p>
        )}
        <p className="mt-2 font-caveat text-lg text-green">📍 {member.current_location}</p>
        {member.location_detail && (
          <p className="font-caveat text-sm text-navy/60">{member.location_detail}</p>
        )}
        <LiveClock timezone={member.timezone} />
        <p className="mt-3 font-caveat text-xs text-navy/40">
          Last updated{" "}
          {formatDistanceToNow(parseISO(member.last_updated), { addSuffix: true })}
        </p>
      </div>
    </article>
  );
}

function OtisCard({ age }: { age: string }) {
  return (
    <article
      className="scrapbook-card relative p-6 transition-all duration-300 hover:z-10 hover:scale-[1.02] hover:rotate-0 md:scale-105"
      style={{ transform: `rotate(${getRotation("otis")}deg)` }}
    >
      <div
        className="washi-tape left-1/2 -translate-x-1/2"
        style={{ background: "rgba(74, 124, 89, 0.45)" }}
      />
      <div className="flex flex-col items-center text-center">
        <span className="text-5xl">👶</span>
        <h3 className="mt-3 font-caveat text-3xl font-bold text-navy">Otis</h3>
        <p className="font-caveat text-sm text-navy/60">{age}</p>
        <p className="mt-2 font-caveat text-lg text-green">🍀 Northern Ireland</p>
        <LiveClock timezone="Europe/London" />
      </div>
    </article>
  );
}

type LocationEditRow = Omit<FamilyLocation, "lat" | "lng"> & {
  lat: string;
  lng: string;
};

function LocationsModal({
  locations,
  onClose,
  onSaved,
}: {
  locations: FamilyLocation[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [rows, setRows] = useState<LocationEditRow[]>(
    locations.map((l) => ({
      ...l,
      lat: l.lat?.toString() ?? "",
      lng: l.lng?.toString() ?? "",
    }))
  );
  const [saving, setSaving] = useState(false);
  const [tzSearch, setTzSearch] = useState<Record<string, string>>({});

  async function handleSave() {
    setSaving(true);
    try {
      const payload = rows.map((r) => ({
        member_username: r.member_username,
        display_name: r.display_name,
        current_location: r.current_location,
        location_detail: r.location_detail || undefined,
        timezone: r.timezone,
        lat: r.lat ? parseFloat(r.lat) : undefined,
        lng: r.lng ? parseFloat(r.lng) : undefined,
        relationship: r.relationship || undefined,
        avatar_url: r.avatar_url || undefined,
      }));

      const res = await fetch("/api/otis/locations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locations: payload }),
      });

      if (res.ok) {
        showToast({ text: "Locations updated ✓" });
        onSaved();
        onClose();
      } else {
        showToast({ text: "Something went wrong. Try again?", type: "error" });
      }
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center">
      <div className="scrapbook-card relative max-h-[90vh] w-full overflow-y-auto p-6 md:max-w-2xl md:rounded">
        <div
          className="washi-tape left-1/2 -translate-x-1/2"
          style={{ background: "rgba(91, 141, 184, 0.45)" }}
        />
        <h3 className="font-caveat text-2xl font-bold text-navy">Update locations ✏️</h3>
        <p className="mt-1 font-caveat text-sm text-navy/60">
          You manage everyone&apos;s locations — update these when family are travelling!
        </p>
        <div className="mt-4 space-y-4">
          {rows.map((row, i) => {
            const search = tzSearch[row.member_username] ?? "";
            const filteredTz = TIMEZONE_OPTIONS.filter(
              (t) =>
                t.label.toLowerCase().includes(search.toLowerCase()) ||
                t.value.toLowerCase().includes(search.toLowerCase())
            );

            return (
              <div key={row.member_username} className="rounded bg-cream/80 p-3">
                <p className="font-caveat text-lg font-bold text-navy">{row.display_name}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <input
                    placeholder="Current location"
                    value={row.current_location}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...next[i], current_location: e.target.value };
                      setRows(next);
                    }}
                    className="rounded border border-kraft bg-cream px-3 py-2 font-caveat"
                  />
                  <input
                    placeholder="Location detail (optional)"
                    value={row.location_detail ?? ""}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...next[i], location_detail: e.target.value };
                      setRows(next);
                    }}
                    className="rounded border border-kraft bg-cream px-3 py-2 font-caveat"
                  />
                  <div className="relative sm:col-span-2">
                    <input
                      placeholder="Search timezone..."
                      value={
                        search ||
                        (TIMEZONE_OPTIONS.find((t) => t.value === row.timezone)?.label ??
                          row.timezone)
                      }
                      onChange={(e) =>
                        setTzSearch((s) => ({ ...s, [row.member_username]: e.target.value }))
                      }
                      onFocus={() => setTzSearch((s) => ({ ...s, [row.member_username]: "" }))}
                      className="w-full rounded border border-kraft bg-cream px-3 py-2 font-caveat"
                    />
                    {search !== undefined && tzSearch[row.member_username] !== undefined && (
                      <div className="absolute z-10 mt-1 max-h-32 w-full overflow-y-auto rounded border border-kraft bg-cream shadow">
                        {filteredTz.map((t) => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => {
                              const next = [...rows];
                              next[i] = { ...next[i], timezone: t.value };
                              setRows(next);
                              setTzSearch((s) => {
                                const copy = { ...s };
                                delete copy[row.member_username];
                                return copy;
                              });
                            }}
                            className="block w-full px-3 py-1 text-left font-caveat text-sm hover:bg-kraft/30"
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    placeholder="Latitude"
                    value={row.lat}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...next[i], lat: e.target.value };
                      setRows(next);
                    }}
                    className="rounded border border-kraft bg-cream px-3 py-2 font-caveat"
                  />
                  <input
                    placeholder="Longitude"
                    value={row.lng}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...next[i], lng: e.target.value };
                      setRows(next);
                    }}
                    className="rounded border border-kraft bg-cream px-3 py-2 font-caveat"
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded border border-kraft px-4 py-2 font-caveat text-lg text-navy"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded bg-coral px-4 py-2 font-caveat text-lg text-cream disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save all →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WhereIsEveryone() {
  const { getAge, dob } = useOtis();
  const currentAge = dob ? getAge(new Date().toISOString().split("T")[0]) : "Our little star";
  const [locations, setLocations] = useState<FamilyLocation[]>([]);
  const [home, setHome] = useState<{ lat: number; lng: number } | null>(null);
  const [view, setView] = useState<ViewMode>("cards");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [locRes, settingsRes] = await Promise.all([
        fetch("/api/otis/locations"),
        fetch("/api/otis/settings"),
      ]);
      if (locRes.ok) setLocations(await locRes.json());
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        const lat = parseFloat(settings.home_lat);
        const lng = parseFloat(settings.home_lng);
        if (!isNaN(lat) && !isNaN(lng)) setHome({ lat, lng });
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("otis_where_view") as ViewMode | null;
    if (saved === "map" || saved === "cards") setView(saved);
    fetchData();
  }, [fetchData]);

  function switchView(mode: ViewMode) {
    setView(mode);
    localStorage.setItem("otis_where_view", mode);
  }

  if (loading) {
    return (
      <section>
        <p className="font-caveat text-xl text-navy/60">Loading locations... 🌍</p>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-caveat text-3xl font-bold text-navy md:text-4xl">
          Where Is Everyone? 🌍
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-navy/20 bg-cream p-1">
            <button
              type="button"
              onClick={() => switchView("map")}
              className={`rounded-full px-4 py-1 font-caveat text-lg transition-colors ${
                view === "map" ? "bg-navy text-cream" : "text-navy"
              }`}
            >
              🗺️ Map
            </button>
            <button
              type="button"
              onClick={() => switchView("cards")}
              className={`rounded-full px-4 py-1 font-caveat text-lg transition-colors ${
                view === "cards" ? "bg-navy text-cream" : "text-navy"
              }`}
            >
              👥 Cards
            </button>
          </div>
          <AdminOnly>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="font-caveat text-lg text-coral hover:underline"
            >
              Update locations ✏️
            </button>
          </AdminOnly>
        </div>
      </div>

      {view === "map" ? (
        <WhereMapInner locations={locations} home={home} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <OtisCard age={currentAge} />
          {locations.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}

      {showModal && (
        <LocationsModal
          locations={locations}
          onClose={() => setShowModal(false)}
          onSaved={fetchData}
        />
      )}
    </section>
  );
}
