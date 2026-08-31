"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

/**
 * Dropping a pin on the door.
 *
 * Leaflet over OpenStreetMap's tiles, to match the geocoder — no key, no
 * billing. Their tile policy is the same shape as Nominatim's: fine at this
 * volume with attribution shown, not something to point a busy storefront at
 * unmoved. Swapping to a paid tile URL later is one string in this file.
 *
 * Rendered only on the client. Leaflet reaches for `window` as it loads, so the
 * caller imports this through `next/dynamic` with `ssr: false` — importing it
 * directly breaks the server render of every page the header is on.
 */

// India, wide enough to see which state you are in. Only used when there is no
// fix at all — a picker centred on someone else's city is a worse start than an
// obviously-unset one.
const FALLBACK: [number, number] = [22.35, 78.67];
const FALLBACK_ZOOM = 4;
const PIN_ZOOM = 17;

/**
 * A CSS pin rather than Leaflet's default marker.
 *
 * The default resolves its icon through a bundler-relative URL that Next does
 * not serve, so it 404s and the marker renders as a broken image — the single
 * most common way a Leaflet map looks broken. Drawing it avoids the asset
 * entirely.
 */
const pinIcon = L.divIcon({
  className: "",
  html: `<span style="
    display:block;width:22px;height:22px;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    background:var(--color-primary,#f97316);
    border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);
  "></span>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

/** Clicking the map moves the pin; it is a larger target than the pin itself. */
function ClickToPlace({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onChange(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

/**
 * Follow a fix that arrived from outside the map — "use my current location"
 * while the dialog is already open. Skipped when the change came from the map
 * itself, or panning would fight the drag that caused it.
 */
function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const last = useRef<string>("");

  useEffect(() => {
    const key = `${lat},${lng}`;
    if (last.current === key) return;
    last.current = key;
    map.setView([lat, lng], Math.max(map.getZoom(), PIN_ZOOM));
  }, [lat, lng, map]);

  return null;
}

/**
 * Leaflet measures its container once, on creation. In a dialog that is still
 * settling, that measurement is short — and the map renders with grey gaps
 * where it thinks there is no room, which is what this looked like first time.
 *
 * Observed rather than re-measured after a guessed delay: any delay is either
 * too short on a slow paint or a visible stall on a fast one, and the container
 * also changes size when the window does. The observer is right in both cases.
 */
function FixSize() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

export function LocationPickerMap({
  lat,
  lng,
  onChange,
}: {
  lat?: number;
  lng?: number;
  onChange: (lat: number, lng: number) => void;
}) {
  const hasFix = typeof lat === "number" && typeof lng === "number";
  const center: [number, number] = hasFix ? [lat, lng] : FALLBACK;

  const handlers = useMemo(
    () => ({
      dragend(e: L.DragEndEvent) {
        const { lat: newLat, lng: newLng } = (
          e.target as L.Marker
        ).getLatLng();
        onChange(newLat, newLng);
      },
    }),
    [onChange],
  );

  return (
    <MapContainer
      center={center}
      zoom={hasFix ? PIN_ZOOM : FALLBACK_ZOOM}
      scrollWheelZoom
      className="h-56 w-full rounded-xl"
      // Below the dialog's own z-50: Leaflet's panes sit at z-index 400+ by
      // default and would otherwise paint over the close button.
      style={{ zIndex: 0 }}
    >
      <TileLayer
        // Required by the tile usage policy, and it is their work.
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <FixSize />
      <ClickToPlace onChange={onChange} />
      {hasFix && (
        <>
          <Recenter lat={lat} lng={lng} />
          <Marker
            position={[lat, lng]}
            draggable
            icon={pinIcon}
            eventHandlers={handlers}
          />
        </>
      )}
    </MapContainer>
  );
}

export default LocationPickerMap;
