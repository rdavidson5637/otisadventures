"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { spreadMapMarkers } from "@/lib/spread-map-markers";
import type { FamilyMember } from "@/types/otis";

type HomePoint = { lat: number; lng: number };

type MapPoint =
  | { kind: "otis"; id: "otis"; lat: number; lng: number }
  | {
      kind: "member";
      id: string;
      lat: number;
      lng: number;
      member: FamilyMember & { lat: number; lng: number };
    };

function createMemberIcon(member: FamilyMember) {
  const initials = member.display_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const inner = member.avatar_url
    ? `<img src="${member.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`
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

function coordsMatch(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  epsilon = 0.02
) {
  return Math.abs(a.lat - b.lat) < epsilon && Math.abs(a.lng - b.lng) < epsilon;
}

export default function FamilyMapInner() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [home, setHome] = useState<HomePoint | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/otis/family/map").then((r) => r.json()),
      fetch("/api/otis/settings").then((r) => r.json()),
    ]).then(([memberData, settings]) => {
      setMembers(memberData ?? []);
      const lat = parseFloat(settings.home_lat);
      const lng = parseFloat(settings.home_lng);
      if (!isNaN(lat) && !isNaN(lng)) setHome({ lat, lng });
    });
  }, []);

  const spreadPoints = useMemo(() => {
    const raw: MapPoint[] = [];

    if (home) {
      raw.push({ kind: "otis", id: "otis", lat: home.lat, lng: home.lng });
    }

    for (const member of members) {
      if (member.lat == null || member.lng == null) continue;
      raw.push({
        kind: "member",
        id: member.id,
        lat: member.lat,
        lng: member.lng,
        member: member as FamilyMember & { lat: number; lng: number },
      });
    }

    return spreadMapMarkers(raw);
  }, [members, home]);

  const memberPoints = spreadPoints.filter(
    (p): p is (typeof spreadPoints)[number] & { kind: "member" } => p.kind === "member"
  );

  const stats = useMemo(() => {
    const locations = new Set(memberPoints.map((m) => m.member.location).filter(Boolean));
    return { cities: locations.size, members: memberPoints.length };
  }, [memberPoints]);

  if (!spreadPoints.length) {
    return (
      <p className="font-caveat text-xl text-navy/60">
        Add family member coordinates in admin to see the map 🗺️
      </p>
    );
  }

  const center = home ?? { lat: spreadPoints[0]!.lat, lng: spreadPoints[0]!.lng };

  return (
    <div>
      <div className="relative h-[300px] border border-kraft md:h-[400px]">
        <MapContainer center={[center.lat, center.lng]} zoom={4} className="h-full w-full z-0">
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {spreadPoints.map((point) =>
            point.kind === "otis" ? (
              <Marker key="otis" position={[point.mapLat, point.mapLng]} icon={homeIcon}>
                <Popup>
                  <p className="font-caveat text-lg font-bold text-navy">
                    This is where Otis lives! 🏠
                  </p>
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
                    <p className="font-nunito text-xs text-navy/60">{point.member.relationship}</p>
                  )}
                  {point.member.location && (
                    <p className="font-nunito text-xs text-navy/60">📍 {point.member.location}</p>
                  )}
                  <p className="font-nunito text-xs text-navy/40">
                    Joined {format(parseISO(point.member.created_at), "MMMM yyyy")}
                  </p>
                </Popup>
              </Marker>
            )
          )}
          {home &&
            memberPoints
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
                    weight: 2,
                    dashArray: "8 8",
                  }}
                />
              ))}
        </MapContainer>
      </div>
      <p className="mt-4 text-center font-caveat text-xl text-navy/80">
        Otis has family in {stats.cities} {stats.cities === 1 ? "city" : "cities"} across the
        world 💛
      </p>
    </div>
  );
}
