import { useRef, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import WebView, { WebViewMessageEvent } from "react-native-webview";

export interface LocationResult {
  lat: number;
  lng: number;
  address_full: string;
  address_short: string;
  suburb: string;
  city: string;
  postcode: string;
}

interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationChange: (result: LocationResult) => void;
  style?: object;
}

// Nominatim reverse geocoding is done inside the WebView to avoid CORS issues
const PICKER_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
html, body, #map { width:100%; height:100%; background:#111; }
</style>
</head>
<body>
<div id="map"></div>
<script>
(function(){
  var map = L.map('map', { zoomControl: false });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap', maxZoom: 19
  }).addTo(map);
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  var pinIcon = L.divIcon({
    className: '',
    html: '<div style="position:relative;width:32px;height:44px">' +
      '<svg viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:32px;height:44px;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5))">' +
      '<path d="M16 0C7.163 0 0 7.163 0 16c0 11.314 16 28 16 28s16-16.686 16-28C32 7.163 24.837 0 16 0z" fill="#F36A39"/>' +
      '<circle cx="16" cy="16" r="6" fill="white"/>' +
      '<\/svg>' +
      '<div style="position:absolute;bottom:-3px;left:50%;transform:translateX(-50%);width:8px;height:4px;background:rgba(0,0,0,0.25);border-radius:50%"><\/div>' +
      '<\/div>',
    iconSize: [32, 44],
    iconAnchor: [16, 44],
  });

  var marker = L.marker([40.4168, -3.7038], { icon: pinIcon, draggable: true }).addTo(map);
  var geocodeTimer = null;

  function post(msg) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  }

  function geocode(lat, lng) {
    fetch('https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lng + '&format=json&accept-language=es')
      .then(function(r) { return r.json(); })
      .then(function(d) {
        var addr = d.address || {};
        var short = (addr.road || '') + (addr.house_number ? ', ' + addr.house_number : '');
        post({
          type: 'pinMoved',
          lat: lat, lng: lng,
          address_full: d.display_name || '',
          address_short: short,
          suburb: addr.suburb || addr.neighbourhood || addr.quarter || addr.district || '',
          city: addr.city || addr.town || addr.village || addr.municipality || '',
          postcode: addr.postcode || '',
        });
      })
      .catch(function() {
        post({ type: 'pinMoved', lat: lat, lng: lng, address_full: '', address_short: '', suburb: '', city: '', postcode: '' });
      });
  }

  marker.on('dragend', function() {
    var pos = marker.getLatLng();
    clearTimeout(geocodeTimer);
    geocodeTimer = setTimeout(function() { geocode(pos.lat, pos.lng); }, 300);
  });

  function handle(raw) {
    try {
      var msg = JSON.parse(raw);
      if (msg.type === 'init') {
        map.setView([msg.lat, msg.lng], msg.zoom || 15);
        marker.setLatLng([msg.lat, msg.lng]);
        geocode(msg.lat, msg.lng);
      }
    } catch(e) {}
  }

  document.addEventListener('message', function(e) { handle(e.data); });
  window.addEventListener('message', function(e) { handle(e.data); });
  map.whenReady(function() { post({ type: 'ready' }); });
})();
<\/script>
</body>
</html>`;

export default function LocationPicker({
  initialLat = 40.4168,
  initialLng = -3.7038,
  onLocationChange,
  style,
}: LocationPickerProps) {
  const ref = useRef<WebView>(null);

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      let msg: any;
      try { msg = JSON.parse(e.nativeEvent.data); } catch { return; }

      if (msg.type === "ready") {
        ref.current?.postMessage(
          JSON.stringify({ type: "init", lat: initialLat, lng: initialLng, zoom: 15 })
        );
      } else if (msg.type === "pinMoved") {
        onLocationChange({
          lat: msg.lat,
          lng: msg.lng,
          address_full: msg.address_full ?? "",
          address_short: msg.address_short ?? "",
          suburb: msg.suburb ?? "",
          city: msg.city ?? "",
          postcode: msg.postcode ?? "",
        });
      }
    },
    [initialLat, initialLng, onLocationChange]
  );

  return (
    <View style={[s.container, style as any]}>
      <WebView
        ref={ref}
        source={{ html: PICKER_HTML, baseUrl: "https://openstreetmap.org" }}
        originWhitelist={["*"]}
        javaScriptEnabled
        onMessage={onMessage}
        style={s.webView}
        scrollEnabled={false}
        bounces={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { borderRadius: 16, overflow: "hidden" },
  webView: { flex: 1, backgroundColor: "#1A1A1A" },
});
