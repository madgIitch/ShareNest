// src/lib/leafletHTML.ts
// Plantillas HTML para los mapas Leaflet embebidos en WebView.
// OSM tiles — sin Google, sin API key, sin registro.
// Paleta del moodboard urban-maps: warm beige, Apple Maps style.

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

// Paleta moodboard (warm beige / Apple Maps)
const C_PIN      = "#3478F6"; // pin activo — azul iOS
const C_ASSIGNED = "#34C759"; // pin asignado — verde iOS
const C_WHITE    = "#ffffff";
const C_TEXT     = "#1C1C1E"; // texto oscuro (no negro puro)
const C_BG       = "#F5F2EB"; // suelo base warm beige

/**
 * HTML completo para el mapa principal interactivo.
 *
 * Protocolo postMessage RN ← WebView:
 *   { type: 'REGION_CHANGE', zoom: number, bbox: [w,s,e,n] }
 *   { type: 'PIN_PRESS',     id: string, deselect: boolean }
 *   { type: 'CLUSTER_PRESS', id: number, lat: number, lng: number }
 *
 * API inyectada desde RN (injectJavaScript):
 *   window.updateClusters(clusters: ClusterItem[])
 *   window.zoomTo(lat, lng, zoom)
 *   window.deselect()
 */
export function buildMainMapHTML(): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="${LEAFLET_CSS}"/>
<script src="${LEAFLET_JS}"><\/script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#map{width:100%;height:100%;background:${C_BG}}
.leaflet-control-attribution{font-size:8px;opacity:0.6}

/* Pin individual — estilo Apple Maps */
.lp{
  background:${C_WHITE};
  border:2px solid ${C_PIN};
  border-radius:20px;
  padding:4px 10px;
  font-size:12px;
  font-weight:700;
  color:${C_PIN};
  white-space:nowrap;
  box-shadow:0 2px 8px rgba(52,120,246,0.22);
  cursor:pointer;
  font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif;
  letter-spacing:-0.2px;
}
/* Pin seleccionado */
.lp.sel{background:${C_PIN};color:${C_WHITE};box-shadow:0 3px 10px rgba(52,120,246,0.40)}
/* Pin nivel 3 — confirmado */
.lp.l3{background:${C_ASSIGNED};border-color:${C_ASSIGNED};color:${C_WHITE};box-shadow:0 2px 8px rgba(52,199,89,0.30)}

/* Cluster — burbuja azul */
.lc{
  background:${C_PIN};
  border:3px solid ${C_WHITE};
  border-radius:50%;
  width:44px;height:44px;
  display:flex;align-items:center;justify-content:center;
  font-size:14px;font-weight:700;color:${C_WHITE};
  box-shadow:0 2px 10px rgba(52,120,246,0.40);
  cursor:pointer;
  font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif;
}
</style>
</head>
<body>
<div id="map"></div>
<script>
var map = L.map('map', { zoomControl: true })
  .setView([40.416775, -3.70379], 5);

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  subdomains: 'abcd',
  maxZoom: 20,
  attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
}).addTo(map);

var _markers = {};
var _circles = {};
var _selId   = null;
var _last    = [];

function rn(data) {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify(data));
  }
}

map.on('moveend', function() {
  var b = map.getBounds();
  rn({
    type: 'REGION_CHANGE',
    zoom: map.getZoom(),
    bbox: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]
  });
});

function clearAll() {
  Object.values(_markers).forEach(function(m) { map.removeLayer(m); });
  Object.values(_circles).forEach(function(c) { map.removeLayer(c); });
  _markers = {};
  _circles = {};
}

function mkPin(price, currency, sel, privacyLevel) {
  var extra = sel ? ' sel' : (privacyLevel === 3 ? ' l3' : '');
  return '<div class="lp' + extra + '">' + (currency || '€') + price + '</div>';
}

function mkCluster(count) {
  return '<div class="lc">' + count + '</div>';
}

function renderClusters(clusters) {
  clearAll();
  clusters.forEach(function(item) {
    var m;
    if (item.type === 'cluster') {
      var icon = L.divIcon({
        html: mkCluster(item.count),
        className: '',
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });
      m = L.marker([item.lat, item.lng], { icon: icon });
      (function(it) {
        m.on('click', function() {
          rn({ type: 'CLUSTER_PRESS', id: it.id, lat: it.lat, lng: it.lng });
        });
      })(item);
      _markers['c_' + item.id] = m;
    } else {
      var pin = item.pin;
      var sel = pin.id === _selId;

      // Nivel 1/2: círculo de incertidumbre
      if (pin.privacyLevel === 1 || pin.privacyLevel === 2) {
        var radius = pin.privacyLevel === 1 ? 900 : 150;
        var fillOpacity = pin.privacyLevel === 1 ? 0.06 : 0.08;
        var strokeOpacity = pin.privacyLevel === 1 ? 0.18 : 0.25;
        var circle = L.circle([item.lat, item.lng], {
          radius: radius,
          fillColor: '#3478F6',
          fillOpacity: fillOpacity,
          color: '#3478F6',
          opacity: strokeOpacity,
          weight: 1.5,
          interactive: false
        }).addTo(map);
        _circles[pin.id] = circle;
      }

      var label = mkPin(pin.price, pin.currency, sel, pin.privacyLevel);
      var icon2 = L.divIcon({
        html: label,
        className: '',
        iconSize: [null, null],
        iconAnchor: [0, 28]
      });
      m = L.marker([item.lat, item.lng], { icon: icon2 });
      (function(it) {
        m.on('click', function() {
          var wasSelected = it.pin.id === _selId;
          _selId = wasSelected ? null : it.pin.id;
          rn({ type: 'PIN_PRESS', id: it.pin.id, deselect: wasSelected });
          renderClusters(_last);
        });
      })(item);
      _markers[pin.id] = m;
    }
    m.addTo(map);
  });
}

window.updateClusters = function(clusters) {
  _last = clusters;
  renderClusters(clusters);
};

window.zoomTo = function(lat, lng, zoom) {
  map.flyTo([lat, lng], zoom, { duration: 0.4 });
};

// Encuadra el mapa para mostrar todos los puntos dados [[lat,lng], ...]
window.fitBoundsTo = function(latlngs) {
  if (!latlngs || latlngs.length === 0) return;
  if (latlngs.length === 1) {
    map.flyTo(latlngs[0], 14, { duration: 0.6 });
    return;
  }
  var bounds = L.latLngBounds(latlngs);
  map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 14, duration: 0.6 });
};

window.deselect = function() {
  _selId = null;
  renderClusters(_last);
};
<\/script>
</body>
</html>`;
}

/**
 * HTML para el mini mapa estático en la pantalla de detalle.
 * Las coordenadas ya vienen procesadas por PrivacyEngine desde RN.
 */
export function buildMiniMapHTML(
  lat: number,
  lng: number,
  zoom: number,
  accuracyRadius?: number,
): string {
  const circle =
    accuracyRadius != null
      ? `L.circle([${lat},${lng}],{
          radius:${accuracyRadius},
          fillColor:'#3478F6',fillOpacity:0.08,
          color:'#3478F6',opacity:0.25,weight:1.5,
          interactive:false
        }).addTo(map);`
      : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="${LEAFLET_CSS}"/>
<script src="${LEAFLET_JS}"><\/script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#map{width:100%;height:100%;background:${C_BG}}
.leaflet-control-zoom,.leaflet-control-attribution{display:none}
.mp{
  width:14px;height:14px;
  background:${C_PIN};
  border:3px solid ${C_WHITE};
  border-radius:50%;
  box-shadow:0 2px 4px rgba(52,120,246,0.35);
}
</style>
</head>
<body>
<div id="map"></div>
<script>
var map = L.map('map', {
  zoomControl: false,
  attributionControl: false,
  dragging: false,
  scrollWheelZoom: false,
  touchZoom: false,
  doubleClickZoom: false,
  boxZoom: false,
  keyboard: false
}).setView([${lat}, ${lng}], ${zoom});

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  subdomains: 'abcd', maxZoom: 20,
  attribution: '&copy; OpenStreetMap &copy; CARTO'
}).addTo(map);
${circle}
var icon = L.divIcon({
  html: '<div class="mp"></div>',
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});
L.marker([${lat}, ${lng}], { icon: icon, interactive: false }).addTo(map);
<\/script>
</body>
</html>`;
}

/**
 * HTML para mini mapa editable.
 * Emite postMessage con:
 *   { type: 'PIN_MOVE', lat: number, lng: number }
 */
export function buildEditableMiniMapHTML(
  lat: number,
  lng: number,
  zoom = 16,
): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="${LEAFLET_CSS}"/>
<script src="${LEAFLET_JS}"><\/script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#map{width:100%;height:100%;background:${C_BG}}
.leaflet-control-attribution{display:none}
.mp{
  width:16px;height:16px;
  background:${C_PIN};
  border:3px solid ${C_WHITE};
  border-radius:50%;
  box-shadow:0 2px 6px rgba(52,120,246,0.35);
}
</style>
</head>
<body>
<div id="map"></div>
<script>
function rn(data){
  if(window.ReactNativeWebView){
    window.ReactNativeWebView.postMessage(JSON.stringify(data));
  }
}

var map = L.map('map', { zoomControl:true }).setView([${lat}, ${lng}], ${zoom});
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  subdomains:'abcd', maxZoom:20,
  attribution:'&copy; OpenStreetMap &copy; CARTO'
}).addTo(map);

var icon = L.divIcon({
  html:'<div class="mp"></div>',
  className:'',
  iconSize:[16,16],
  iconAnchor:[8,8]
});

var marker = L.marker([${lat}, ${lng}], { icon: icon, draggable: true }).addTo(map);

function emit(lat,lng){
  rn({ type:'PIN_MOVE', lat:lat, lng:lng });
}

marker.on('dragend', function(e){
  var p = e.target.getLatLng();
  emit(p.lat, p.lng);
});

map.on('click', function(e){
  marker.setLatLng(e.latlng);
  emit(e.latlng.lat, e.latlng.lng);
});
<\/script>
</body>
</html>`;
}
