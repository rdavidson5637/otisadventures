"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { spreadMapMarkers } from "@/lib/spread-map-markers";
import type { FamilyMember } from "@/types/otis";

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

export default function FamilyMapInner() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [home, setHome] = useState<{ lat: number; lng: number } | null>(null);

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

  const mappable = useMemo(() => {
    const withCoords = members.filter(
      (m): m is FamilyMember & { lat: number; lng: number } =>
        m.lat != null && m.lng != null
    );
    return spreadMapMarkers(withCoords);
  }, [members]);

  const stats = useMemo(() => {
    const locations = new Set(mappable.map((m) => m.location).filter(Boolean));
    return { cities: locations.size, members: mappable.length };
  }, [mappable]);

  if (!mappable.length && !home) {
    return (
      <p className="font-caveat text-xl text-navy/60">
        Add family member coordinates in admin to see the map 🗺️
      </p>
    );
  }

  const center = home ?? { lat: mappable[0]!.lat, lng: mappable[0]!.lng };

  return (
    <div>
      <div className="relative h-[300px] border border-kraft md:h-[400px]">
        <MapContainer center={[center.lat, center.lng]} zoom={4} className="h-full w-full z-0">
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {home && (
            <Marker position={[home.lat, home.lng]} icon={homeIcon}>
              <Popup>
                <p className="font-caveat text-lg font-bold text-navy">
                  This is where Otis lives! 🏠
                </p>
              </Popup>
            </Marker>
          )}
          {mappable.map((member) => (
            <Marker
              key={member.id}
              position={[member.mapLat, member.mapLng]}
              icon={createMemberIcon(member)}
            >
              <Popup>
                <p className="font-caveat text-lg font-bold text-navy">
                  {member.display_name}
                </p>
                {member.relationship && (
                  <p className="font-nunito text-xs text-navy/60">{member.relationship}</p>
                )}
                {member.location && (
                  <p className="font-nunito text-xs text-navy/60">📍 {member.location}</p>
                )}
                <p className="font-nunito text-xs text-navy/40">
                  Joined {format(parseISO(member.created_at), "MMMM yyyy")}
                </p>
              </Popup>
            </Marker>
          ))}
          {home &&
            mappable.map((member) => (
              <Polyline
                key={`line-${member.id}`}
                positions={[
                  [member.lat, member.lng],
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
