"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { spreadMapMarkers } from "@/lib/spread-map-markers";
import { getTimezoneCityLabel } from "@/lib/timezones";
import type { FamilyLocation } from "@/types/otis";

type HomePoint = {
  lat: number;
  lng: number;
  location?: string;
  timezone?: string;
};

type MapPoint =
  | { kind: "otis"; id: "otis"; lat: number; lng: number; home: HomePoint }
  | { kind: "member"; id: string; lat: number; lng: number; member: FamilyLocation };

function createMemberIcon(member: FamilyLocation) {
  const initials = member.display_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const inner = member.avatar_url
    ? `<img src="${member.avatar_url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`
    : `<span style="font-family:Georgia,serif;font-size:14px;color:#1E2D4A">${initials}</span>`;

  return L.divIcon({
    html: `<div style="width:40px;height:40px;border-radius:50%;background:#F5F0E8;border:3px solid #1E2D4A;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.2)">${inner}</div>`,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

const homeIcon = L.divIcon({
  html: `<div style="width:48px;height:48px;display:flex;align-items:center;justify-content:center;font-size:28px">👶</div>`,
  className: "",
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

function LiveTime({ timezone }: { timezone: string }) {
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

  return <span className="font-caveat text-lg text-coral">{time}</span>;
}

function coordsMatch(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  epsilon = 0.02
) {
  return Math.abs(a.lat - b.lat) < epsilon && Math.abs(a.lng - b.lng) < epsilon;
}

interface WhereMapInnerProps {
  locations: FamilyLocation[];
  home: HomePoint | null;
}

export default function WhereMapInner({ locations, home }: WhereMapInnerProps) {
  const spreadPoints = useMemo(() => {
    const raw: MapPoint[] = [];

    if (home) {
      raw.push({
        kind: "otis",
        id: "otis",
        lat: home.lat,
        lng: home.lng,
        home,
      });
    }

    for (const member of locations) {
      if (member.lat == null || member.lng == null) continue;
      raw.push({
        kind: "member",
        id: member.id,
        lat: member.lat,
        lng: member.lng,
        member,
      });
    }

    return spreadMapMarkers(raw);
  }, [locations, home]);

  const members = spreadPoints.filter(
    (p): p is (typeof spreadPoints)[number] & { kind: "member" } => p.kind === "member"
  );

  if (!spreadPoints.length) {
    return (
      <div className="flex h-[280px] items-center justify-center border border-kraft bg-cream font-caveat text-xl text-navy/60 md:h-[400px]">
        Add coordinates in admin to see the map 🗺️
      </div>
    );
  }

  return (
    <div className="relative h-[280px] border border-kraft md:h-[400px]">
      <MapContainer center={[20, 0]} zoom={2} className="h-full w-full z-0">
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {spreadPoints.map((point) =>
          point.kind === "otis" ? (
            <Marker key="otis" position={[point.mapLat, point.mapLng]} icon={homeIcon}>
              <Popup>
                <p className="font-caveat text-lg font-bold text-navy">Otis</p>
                {point.home.location && (
                  <p className="font-caveat text-sm text-green">🍀 {point.home.location}</p>
                )}
                {point.home.timezone && (
                  <>
                    <LiveTime timezone={point.home.timezone} />
                    <p className="font-caveat text-xs text-navy/40">
                      {getTimezoneCityLabel(point.home.timezone)}
                    </p>
                  </>
                )}
              </Popup>
            </Marker>
          ) : (
            <Marker
              key={point.member.id}
              position={[point.mapLat, point.mapLng]}
              icon={createMemberIcon(point.member)}
            >
              <Popup>
                <p className="font-caveat text-lg font-bold text-navy">
                  {point.member.display_name}
                </p>
                {point.member.relationship && (
                  <p className="font-caveat text-sm text-navy/60">{point.member.relationship}</p>
                )}
                <p className="font-caveat text-sm text-green">
                  📍 {point.member.current_location}
                </p>
                <LiveTime timezone={point.member.timezone} />
                <p className="font-caveat text-xs text-navy/40">
                  {getTimezoneCityLabel(point.member.timezone)}
                </p>
              </Popup>
            </Marker>
          )
        )}
        {home &&
          members
            .filter((point) => !coordsMatch(point, home))
            .map((point) => (
              <Polyline
                key={`line-${point.member.id}`}
                positions={[
                  [point.lat, point.lng],
                  [home.lat, home.lng],
                ]}
                pathOptions={{
                  color: "#1E2D4A",
                  opacity: 0.2,
                  weight: 1,
                  dashArray: "6 6",
                }}
              />
            ))}
      </MapContainer>
    </div>
  );
}
