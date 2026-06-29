"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { haversineDistance } from "@/lib/haversine";
import type { TripWithStats } from "@/types/otis";

function createTripIcon(trip: TripWithStats) {
  const isFuture =
    !trip.is_active &&
    trip.end_date &&
    new Date(trip.end_date) > new Date();

  const borderStyle = isFuture ? "3px dashed #1E2D4A" : "3px solid #1E2D4A";

  return L.divIcon({
    html: `<div style="width:44px;height:44px;border-radius:50%;background:#F5F0E8;border:${borderStyle};display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 2px 6px rgba(0,0,0,0.25)">${trip.cover_emoji ?? "🌍"}</div>`,
    className: "",
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

function ResetViewButton() {
  const map = useMap();
  return (
    <button
      type="button"
      onClick={() => map.setView([20, 0], 2)}
      className="absolute right-3 top-3 z-[400] rounded bg-cream px-3 py-1 font-caveat text-sm text-navy shadow"
    >
      Reset view
    </button>
  );
}

interface WorldMapInnerProps {
  trips: TripWithStats[];
}

export default function WorldMapInner({ trips }: WorldMapInnerProps) {
  const mapRef = useRef<L.Map | null>(null);

  const stats = useMemo(() => {
    const countries = new Set(
      trips.map((t) => t.location).filter((l): l is string => !!l)
    );

    const sorted = [...trips].sort((a, b) => {
      const da = a.start_date ? new Date(a.start_date).getTime() : 0;
      const db = b.start_date ? new Date(b.start_date).getTime() : 0;
      return da - db;
    });

    let totalMiles = 0;
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (
        prev.centre_lat != null &&
        prev.centre_lng != null &&
        curr.centre_lat != null &&
        curr.centre_lng != null
      ) {
        totalMiles += haversineDistance(
          prev.centre_lat,
          prev.centre_lng,
          curr.centre_lat,
          curr.centre_lng
        );
      }
    }

    return {
      countryCount: countries.size,
      totalMiles: Math.round(totalMiles),
    };
  }, [trips]);

  return (
    <section>
      <h2 className="mb-3 font-caveat text-3xl text-cream">Otis&apos; World 🌍</h2>

      <div className="relative h-[280px] border-y border-kraft md:h-[400px]">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          className="h-full w-full z-0"
          scrollWheelZoom
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <ResetViewButton />
          {trips.map((trip) => (
            <Marker
              key={trip.id}
              position={[trip.centre_lat!, trip.centre_lng!]}
              icon={createTripIcon(trip)}
            >
              <Popup className="world-map-popup">
                <div className="min-w-[180px] p-1">
                  <p className="font-caveat text-lg font-bold text-navy">
                    {trip.cover_emoji} {trip.name}
                  </p>
                  {trip.location && (
                    <p className="font-nunito text-xs text-navy/60">{trip.location}</p>
                  )}
                  {trip.start_date && trip.end_date && (
                    <p className="font-nunito text-xs text-navy/60">
                      {format(parseISO(trip.start_date), "d MMM yyyy")} –{" "}
                      {format(parseISO(trip.end_date), "d MMM yyyy")}
                    </p>
                  )}
                  <p className="mt-1 font-nunito text-xs text-navy/60">
                    {trip.places_visited ?? 0} places visited
                  </p>
                  <Link
                    href={`/otis/${trip.slug}`}
                    className="mt-2 inline-block font-caveat text-base text-coral"
                  >
                    Open Scrapbook →
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <p className="mt-4 text-center font-caveat text-xl text-cream">
        Otis has explored {stats.countryCount}{" "}
        {stats.countryCount === 1 ? "country" : "countries"} and travelled{" "}
        {stats.totalMiles.toLocaleString()} miles so far 🌍
      </p>
    </section>
  );
}
