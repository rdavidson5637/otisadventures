"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/otis-utils";
import type { Place, SpontaneousTrip } from "@/types/otis";
import PlaceCard from "./PlaceCard";
import type { PlaceWithData } from "./PlacesTab";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapViewInnerProps {
  places: Place[];
  spontaneousTrips: SpontaneousTrip[];
  placesWithData: PlaceWithData[];
  center: [number, number];
  zoom: number;
}

function createPlaceIcon(place: Place) {
  const color = CATEGORY_COLORS[place.category ?? "nature"] ?? "#5B8DB8";
  const html = place.visited
    ? `<div style="background:${color};width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;color:white;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">✅</div>`
    : `<div style="background:white;width:20px;height:20px;border-radius:50%;border:2px solid ${color};box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`;

  return L.divIcon({
    html,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

const spontaneousIcon = L.divIcon({
  html: `<div style="font-size:24px">⭐</div>`,
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function MapViewInner({
  places,
  spontaneousTrips,
  placesWithData,
  center,
  zoom,
}: MapViewInnerProps) {
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithData | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const dataMap = useMemo(() => {
    const m = new Map<string, PlaceWithData>();
    for (const p of placesWithData) m.set(p.id, p);
    return m;
  }, [placesWithData]);

  function handlePlaceClick(place: Place) {
    const withData = dataMap.get(place.id) ?? {
      ...place,
      photos: [],
      comments: [],
      reactions: [],
    };
    setSelectedPlace(withData);
    setPanelOpen(true);
  }

  const mappablePlaces = places.filter((p) => p.lat != null && p.lng != null);

  return (
    <div className="relative h-[60vh] w-full">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full z-0"
        scrollWheelZoom
      >
        <MapResizer />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mappablePlaces.map((place) => (
          <Marker
            key={place.id}
            position={[place.lat!, place.lng!]}
            icon={createPlaceIcon(place)}
            eventHandlers={{ click: () => handlePlaceClick(place) }}
          />
        ))}
        {spontaneousTrips
          .filter((t) => t.location)
          .map((trip) => {
            const coords = parseLocation(trip.location!);
            if (!coords) return null;
            return (
              <Marker
                key={trip.id}
                position={coords}
                icon={spontaneousIcon}
              />
            );
          })}
      </MapContainer>

      <div className="absolute bottom-4 left-4 z-[400] scrapbook-card p-3 shadow-lg">
        <p className="mb-2 font-caveat text-base font-bold text-navy">Categories</p>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2 font-caveat text-sm text-navy">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: CATEGORY_COLORS[key] }}
            />
            {label}
          </div>
        ))}
      </div>

      <div
        className={`fixed right-0 top-0 z-[500] h-full w-full bg-cream shadow-2xl transition-transform duration-300 md:w-[380px] ${
          panelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedPlace && (
          <div className="relative h-full overflow-y-auto p-4 pt-12">
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="absolute right-4 top-4 font-caveat text-2xl text-navy"
            >
              ✕
            </button>
            <PlaceCard
              place={selectedPlace}
              photos={selectedPlace.photos}
              comments={selectedPlace.comments}
              reactions={selectedPlace.reactions}
              readOnly
            />
          </div>
        )}
      </div>
    </div>
  );
}

function parseLocation(location: string): [number, number] | null {
  const parts = location.split(",").map((s) => parseFloat(s.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return [parts[0], parts[1]];
  }
  return null;
}
