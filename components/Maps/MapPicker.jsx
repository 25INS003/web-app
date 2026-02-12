"use client";

import React, { useState, useEffect } from "react";
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  useMap, 
  useMapEvents 
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const MarkerMover = ({ onMove }) => {
  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const ChangeView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

const MapPicker = ({ lat, lng, onLocationChange }) => {
  const [center, setCenter] = useState([lat || 20.5937, lng || 78.9629]); // Default to India center

  useEffect(() => {
    if (lat && lng) {
      setCenter([lat, lng]);
    }
  }, [lat, lng]);

  const handleMarkerDrag = (e) => {
    const { lat, lng } = e.target.getLatLng();
    onLocationChange(lat, lng);
  };

  const handleMapClick = (newLat, newLng) => {
    onLocationChange(newLat, newLng);
  };

  return (
    <div className="h-[300px] w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 z-0">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker 
          position={[lat || center[0], lng || center[1]]} 
          draggable={true}
          eventHandlers={{
            dragend: handleMarkerDrag
          }}
        />
        <MarkerMover onMove={handleMapClick} />
        <ChangeView center={[lat || center[0], lng || center[1]]} />
      </MapContainer>
    </div>
  );
};

export default MapPicker;
