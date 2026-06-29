"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getTimezoneCityLabel } from "@/lib/timezones";
import type { FamilyLocation } from "@/types/otis";

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

interface WhereMapInnerProps {
  locations: FamilyLocation[];
  home: { lat: number; lng: number; location?: string; timezone?: string } | null;
}

export default function WhereMapInner({ locations, home }: WhereMapInnerProps) {
  const mappable = useMemo(
    () => locations.filter((m) => m.lat != null && m.lng != null),
    [locations]
  );

  if (!mappable.length && !home) {
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
        {home && (
          <Marker position={[home.lat, home.lng]} icon={homeIcon}>
            <Popup>
              <p className="font-caveat text-lg font-bold text-navy">Otis</p>
              {home.location && (
                <p className="font-caveat text-sm text-green">🍀 {home.location}</p>
              )}
              {home.timezone && (
                <>
                  <LiveTime timezone={home.timezone} />
                  <p className="font-caveat text-xs text-navy/40">
                    {getTimezoneCityLabel(home.timezone)}
                  </p>
                </>
              )}
            </Popup>
          </Marker>
        )}
        {mappable.map((member) => (
          <Marker
            key={member.id}
            position={[member.lat!, member.lng!]}
            icon={createMemberIcon(member)}
          >
            <Popup>
              <p className="font-caveat text-lg font-bold text-navy">{member.display_name}</p>
              {member.relationship && (
                <p className="font-caveat text-sm text-navy/60">{member.relationship}</p>
              )}
              <p className="font-caveat text-sm text-green">📍 {member.current_location}</p>
              <LiveTime timezone={member.timezone} />
              <p className="font-caveat text-xs text-navy/40">
                {getTimezoneCityLabel(member.timezone)}
              </p>
            </Popup>
          </Marker>
        ))}
        {home &&
          mappable.map((member) => (
            <Polyline
              key={`line-${member.id}`}
              positions={[
                [member.lat!, member.lng!],
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
