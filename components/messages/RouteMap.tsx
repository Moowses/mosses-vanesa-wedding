"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { LngLatBoundsLike } from "maplibre-gl";

type LatLon = { lat: number; lon: number };

type RouteItem = {
  id: string;
  fromLabel: string;
  toLabel: string;
  from: LatLon;
  to: LatLon;
};

const routes: RouteItem[] = [
  {
    id: "chicago",
    fromLabel: "Chicago USA",
    toLabel: "Davao City",
    from: { lat: 41.8781, lon: -87.6298 },
    to: { lat: 7.1907, lon: 125.4553 },
  },
  {
    id: "florida",
    fromLabel: "Florida",
    toLabel: "Davao City",
    from: { lat: 25.7617, lon: -80.1918 },
    to: { lat: 7.1907, lon: 125.4553 },
  },
  {
    id: "singapore",
    fromLabel: "Singapore",
    toLabel: "Davao City",
    from: { lat: 1.3521, lon: 103.8198 },
    to: { lat: 7.1907, lon: 125.4553 },
  },
  {
    id: "cebu",
    fromLabel: "Cebu Phillipine",
    toLabel: "Davao City",
    from: { lat: 10.3157, lon: 123.8854 },
    to: { lat: 7.1907, lon: 125.4553 },
  },
  {
    id: "cdo",
    fromLabel: "Cagayan De Oro",
    toLabel: "Davao City",
    from: { lat: 8.4542, lon: 124.6319 },
    to: { lat: 7.1907, lon: 125.4553 },
  },
  {
    id: "mati",
    fromLabel: "Mati City",
    toLabel: "Davao City",
    from: { lat: 6.9551, lon: 126.216 },
    to: { lat: 7.1907, lon: 125.4553 },
  },
  {
    id: "surallah",
    fromLabel: "Sulralla",
    toLabel: "Davao City",
    from: { lat: 6.3753, lon: 124.7474 },
    to: { lat: 7.1907, lon: 125.4553 },
  },
  {
    id: "mlang",
    fromLabel: "Mlang Cotabato",
    toLabel: "Davao City",
    from: { lat: 6.9476, lon: 124.8809 },
    to: { lat: 7.1907, lon: 125.4553 },
  },
];

function makeLineFeature(route: RouteItem) {
  return {
    type: "Feature" as const,
    properties: { id: route.id, from: route.fromLabel, to: route.toLabel },
    geometry: {
      type: "LineString" as const,
      coordinates: [
        [route.from.lon, route.from.lat],
        [route.to.lon, route.to.lat],
      ],
    },
  };
}

export default function RouteMap() {
  const sequence = useMemo(
    () => ["chicago", "florida", "singapore", "cebu", "cdo", "mati", "surallah", "mlang", "__overview__", "florida"],
    []
  );
  const [seqIndex, setSeqIndex] = useState(0);
  const selectedId = sequence[seqIndex] === "__overview__" ? null : (sequence[seqIndex] as string);
  const selected = useMemo(() => routes.find((r) => r.id === selectedId) ?? null, [selectedId]);
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const planeRef = useRef<maplibregl.Marker | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapElRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [115, 10],
      zoom: 2.2,
      attributionControl: false,
    });

    mapRef.current = map;

    const plane = document.createElement("div");
    plane.style.width = "14px";
    plane.style.height = "14px";
    plane.style.borderRadius = "9999px";
    plane.style.background = "#7f3022";
    plane.style.boxShadow = "0 0 0 2px rgba(255,255,255,0.8)";
    planeRef.current = new maplibregl.Marker({ element: plane, anchor: "center" })
      .setLngLat([selected?.from.lon ?? 125.4553, selected?.from.lat ?? 7.1907])
      .addTo(map);

    map.on("load", () => {
      const allLines = {
        type: "FeatureCollection" as const,
        features: routes.map((r) => makeLineFeature(r)),
      };

      map.addSource("routes-all", { type: "geojson", data: allLines });
      map.addLayer({
        id: "routes-all-line",
        type: "line",
        source: "routes-all",
        paint: {
          "line-color": "#d7b5aa",
          "line-width": 2,
          "line-opacity": 0.5,
          "line-dasharray": [2, 2],
        },
      });

      map.addSource("route-selected", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: selected ? [makeLineFeature(selected)] : [],
        },
      });

      map.addLayer({
        id: "route-selected-line",
        type: "line",
        source: "route-selected",
        paint: {
          "line-color": "#e38b70",
          "line-width": 4,
          "line-opacity": 0.95,
          "line-dasharray": [1, 1.5],
        },
      });
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, [selected]);

  useEffect(() => {
    const t = window.setInterval(() => {
      setSeqIndex((i) => (i + 1) % sequence.length);
    }, 7000);
    return () => window.clearInterval(t);
  }, [sequence.length]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const source = map.getSource("route-selected") as maplibregl.GeoJSONSource | undefined;
    if (source && selected) {
      source.setData({
        type: "FeatureCollection",
        features: [makeLineFeature(selected)],
      });
    }
    if (source && !selected) {
      source.setData({
        type: "FeatureCollection",
        features: [],
      });
    }

    if (!selected) {
      map.easeTo({ center: [118, 10], zoom: 2.2, duration: 1800 });
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const bounds: LngLatBoundsLike = [[selected.from.lon, selected.from.lat], [selected.to.lon, selected.to.lat]];
    map.fitBounds(bounds, { padding: 80, duration: 1600, maxZoom: 5.8 });

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const marker = planeRef.current;
    if (!marker) return;

    const start = [selected.from.lon, selected.from.lat] as const;
    const end = [selected.to.lon, selected.to.lat] as const;
    const duration = 5500;
    let t0 = performance.now();

    const tick = (now: number) => {
      const elapsed = now - t0;
      const p = Math.min(1, elapsed / duration);
      const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const lon = start[0] + (end[0] - start[0]) * ease;
      const lat = start[1] + (end[1] - start[1]) * ease;
      marker.setLngLat([lon, lat]);

      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        t0 = performance.now();
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [selected]);

  return (
    <div className="rounded-3xl border border-white/50 bg-white/70 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.12)] backdrop-blur">
      <div className="text-sm uppercase tracking-[0.22em] text-[#8c6f63]">Guest Routes</div>
      <h2 className="mt-2 text-2xl font-semibold text-[#3e2c28]">Traveling To Davao City</h2>

      <div className="mt-5 overflow-hidden rounded-2xl border border-[#e8d7d2] bg-[#fffaf8] p-3">
        <div ref={mapElRef} className="h-[320px] w-full overflow-hidden rounded-xl" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm text-[#5a4a45]">
        {routes.map((route) => (
          <button
            key={route.id}
            type="button"
            onClick={() => {
              const idx = sequence.findIndex((id) => id === route.id);
              if (idx >= 0) setSeqIndex(idx);
            }}
            className={[
              "rounded-xl px-3 py-2 ring-1 transition",
              selectedId === route.id
                ? "bg-[#f5d8cf] ring-[#d8a496] text-[#5a2d22]"
                : "bg-white/80 ring-[#ecdcd6] hover:bg-[#fdf3ef]",
            ].join(" ")}
          >
            {route.fromLabel}
          </button>
        ))}
      </div>
    </div>
  );
}
