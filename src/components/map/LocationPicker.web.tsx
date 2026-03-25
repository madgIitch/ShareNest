import { useEffect, useRef } from "react";
import { View } from "react-native";
import L from "leaflet";
import type { LocationResult } from "./LocationPicker";

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("leaflet-bundle")) return;
  const link = document.createElement("link");
  link.id = "leaflet-bundle";
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(link);
}

injectStyles();
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: "", iconRetinaUrl: "", shadowUrl: "" });

interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationChange: (result: LocationResult) => void;
  style?: object;
}

const PIN_HTML = `<div style="position:relative;width:32px;height:44px">
  <svg viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:32px;height:44px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))">
    <path d="M16 0C7.163 0 0 7.163 0 16c0 11.314 16 28 16 28s16-16.686 16-28C32 7.163 24.837 0 16 0z" fill="#F36A39"/>
    <circle cx="16" cy="16" r="6" fill="white"/>
  </svg>
</div>`;

function geocode(lat: number, lng: number, cb: (r: LocationResult) => void) {
  fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`
  )
    .then((r) => r.json())
    .then((d) => {
      const a = d.address ?? {};
      cb({
        lat, lng,
        address_full: d.display_name ?? "",
        address_short: (a.road ?? "") + (a.house_number ? `, ${a.house_number}` : ""),
        suburb: a.suburb ?? a.neighbourhood ?? a.quarter ?? a.district ?? "",
        city: a.city ?? a.town ?? a.village ?? a.municipality ?? "",
        postcode: a.postcode ?? "",
      });
    })
    .catch(() => cb({ lat, lng, address_full: "", address_short: "", suburb: "", city: "", postcode: "" }));
}

export default function LocationPicker({
  initialLat = 40.4168,
  initialLng = -3.7038,
  onLocationChange,
  style,
}: LocationPickerProps) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!divRef.current || mapRef.current) return;

    const pinIcon = L.divIcon({
      className: "",
      html: PIN_HTML,
      iconSize: [32, 44],
      iconAnchor: [16, 44],
    });

    const map = L.map(divRef.current, { zoomControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    map.setView([initialLat, initialLng], 15);

    const marker = L.marker([initialLat, initialLng], { icon: pinIcon, draggable: true }).addTo(map);
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      geocode(pos.lat, pos.lng, onLocationChange);
    });

    geocode(initialLat, initialLng, onLocationChange);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[{ flex: 1 }, style as any]}>
      {/* @ts-ignore — div is valid in web context */}
      <div ref={divRef} style={{ width: "100%", height: "100%" }} />
    </View>
  );
}
