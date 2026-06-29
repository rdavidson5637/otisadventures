"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Image from "next/image";
import { MEAL_TYPE_COLORS } from "@/lib/otis-utils";
import type { FoodLog, MealType } from "@/types/otis";

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

function createFoodIcon(mealType: MealType | null) {
  const color = mealType ? MEAL_TYPE_COLORS[mealType] : "#1E2D4A";
  return L.divIcon({
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 4px rgba(0,0,0,0.2)">🍴</div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

interface FoodMapInnerProps {
  entries: FoodLog[];
  centreLat?: number | null;
  centreLng?: number | null;
}

export default function FoodMapInner({
  entries,
  centreLat,
  centreLng,
}: FoodMapInnerProps) {
  const [coords, setCoords] = useState<Record<string, { lat: number; lng: number }>>({});
  const geocodeCache = useRef<Record<string, { lat: number; lng: number }>>({});

  const geocode = useCallback(async (location: string, entryId: string) => {
    if (geocodeCache.current[location]) {
      setCoords((prev) => ({
        ...prev,
        [entryId]: geocodeCache.current[location],
      }));
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
        { headers: { "User-Agent": "OtisAdventures/1.0" } }
      );
      const data = await res.json();
      if (data?.[0]) {
        const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        geocodeCache.current[location] = result;
        setCoords((prev) => ({ ...prev, [entryId]: result }));
        await fetch(`/api/otis/food/${entryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: result.lat, lng: result.lng }),
        });
      }
    } catch {
      /* silent fail per spec */
    }
  }, []);

  useEffect(() => {
    for (const entry of entries) {
      if (entry.lat != null && entry.lng != null) {
        setCoords((prev) => ({
          ...prev,
          [entry.id]: { lat: entry.lat!, lng: entry.lng! },
        }));
      } else if (entry.location) {
        geocode(entry.location, entry.id);
      }
    }
  }, [entries, geocode]);

  const center =
    centreLat != null && centreLng != null
      ? { lat: centreLat, lng: centreLng }
      : Object.values(coords)[0] ?? { lat: 54.5, lng: -5.8 };

  const mappable = entries.filter((e) => coords[e.id]);

  return (
    <div>
      <div className="relative h-[300px] border border-kraft md:h-[400px]">
        <MapContainer center={[center.lat, center.lng]} zoom={8} className="h-full w-full z-0">
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {mappable.map((entry) => {
            const c = coords[entry.id];
            if (!c) return null;
            return (
              <Marker
                key={entry.id}
                position={[c.lat, c.lng]}
                icon={createFoodIcon(entry.meal_type)}
              >
                <Popup>
                  <p className="font-caveat text-lg font-bold text-navy">
                    {entry.restaurant_name}
                  </p>
                  {entry.what_otis_ate && (
                    <p className="font-caveat text-sm italic text-coral">
                      {entry.what_otis_ate}
                    </p>
                  )}
                  <p className="font-caveat text-sm">
                    {"🍴".repeat(entry.otis_rating ?? 0)}
                  </p>
                  {entry.date && (
                    <p className="font-nunito text-xs text-navy/60">
                      {format(parseISO(entry.date), "d MMM yyyy")}
                    </p>
                  )}
                  {entry.photo_url && (
                    <div className="relative mt-2 h-16 w-16">
                      <Image src={entry.photo_url} alt="" fill className="object-cover" />
                    </div>
                  )}
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
        <div className="absolute bottom-3 left-3 z-[400] rounded bg-cream/90 p-2 shadow">
          <p className="mb-1 font-caveat text-sm font-bold text-navy">Legend</p>
          {(Object.keys(MEAL_LABELS) as MealType[]).map((type) => (
            <div key={type} className="flex items-center gap-2 font-caveat text-xs text-navy">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ background: MEAL_TYPE_COLORS[type] }}
              />
              {MEAL_LABELS[type]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
