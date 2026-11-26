"use client";

import { useEffect, useRef } from "react";
import type { Map as MlMap, Marker } from "maplibre-gl";

/** Free vector map style (OpenFreeMap, OSM data); attribution is part of the style. */
const STYLE = "https://tiles.openfreemap.org/styles/liberty";
const FALLBACK = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
};

export function MapView({
  lat,
  lon,
  interactive = true,
  onPick,
  className = "",
}: {
  lat: number | null;
  lon: number | null;
  interactive?: boolean;
  onPick?: (p: { lat: number; lon: number }) => void;
  className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<MlMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  // Aborted tile requests are expected when a map closes; don't report them as errors.
  useEffect(() => {
    const ignoreAbort = (e: PromiseRejectionEvent) => {
      if (e.reason?.name === "AbortError") e.preventDefault();
    };
    window.addEventListener("unhandledrejection", ignoreAbort);
    return () => window.removeEventListener("unhandledrejection", ignoreAbort);
  }, []);

  useEffect(() => {
    if (!el.current || map.current) return;
    let cancelled = false;
    import("maplibre-gl").then(({ default: ml }) => {
      if (cancelled || !el.current) return;
      const m = new ml.Map({
        container: el.current,
        style: STYLE,
        center: lon != null && lat != null ? [lon, lat] : [16.2, 43.5],
        zoom: lat != null ? (interactive ? 11 : 9.5) : 6.3,
        interactive,
        attributionControl: { compact: true },
      });
      // A missing tile is not worth an error overlay; if the whole style fails, fall back to OSM raster.
      let fellBack = false;
      m.on("error", (e) => {
        const msg = String(e.error?.message ?? "");
        if (!fellBack && !m.isStyleLoaded() && msg.includes("openfreemap")) {
          fellBack = true;
          m.setStyle(FALLBACK);
        }
        console.warn("map:", msg);
      });
      if (interactive) {
        m.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");
        m.on("click", (e) => pickRef.current?.({ lat: Number(e.lngLat.lat.toFixed(5)), lon: Number(e.lngLat.lng.toFixed(5)) }));
      }
      marker.current = new ml.Marker({ color: "#0e7490" });
      if (lat != null && lon != null) marker.current.setLngLat([lon, lat]).addTo(m);
      map.current = m;
    });
    return () => {
      cancelled = true;
      const m = map.current;
      map.current = null;
      if (!m) return;
      // Removing a map while it is still loading aborts its requests (AbortError).
      // Wait for the first load (or give up after 10 s), then remove quietly.
      const remove = () => {
        try {
          m.remove();
        } catch {}
      };
      if (m.loaded()) remove();
      else {
        m.once("load", remove);
        setTimeout(remove, 10000);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m || lat == null || lon == null) return;
    marker.current?.setLngLat([lon, lat]).addTo(m);
    m.easeTo({ center: [lon, lat], duration: 600 });
  }, [lat, lon]);

  // inline style: maplibre's CSS sets position: relative on the container
  return <div ref={el} className={className} style={{ position: "relative", width: "100%", height: "100%" }} />;
}
