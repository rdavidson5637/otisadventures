export type SpreadMarker<T> = T & { mapLat: number; mapLng: number };

/** Offset markers that share the same coordinates so each avatar stays visible. */
export function spreadMapMarkers<T extends { lat: number; lng: number }>(
  items: T[],
  radius = 0.18
): SpreadMarker<T>[] {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const key = `${item.lat.toFixed(4)},${item.lng.toFixed(4)}`;
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  const result: SpreadMarker<T>[] = [];

  for (const group of groups.values()) {
    if (group.length === 1) {
      const item = group[0];
      result.push({ ...item, mapLat: item.lat, mapLng: item.lng });
      continue;
    }

    group.forEach((item, index) => {
      const angle = (2 * Math.PI * index) / group.length - Math.PI / 2;
      result.push({
        ...item,
        mapLat: item.lat + radius * Math.sin(angle),
        mapLng: item.lng + radius * Math.cos(angle),
      });
    });
  }

  return result;
}
