// src/lib/leafletHTML.ts
// Plantillas HTML para los mapas Leaflet embebidos en WebView.
// OSM tiles — sin Google, sin API key, sin registro.

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

// Colores del tema (sincronizados con src/theme/colors.ts)
const C_PRIMARY = "#10b981";
const C_PRIMARY_DARK = "#059669";
const C_WHITE = "#ffffff";
const C_TEXT = "#111827";
const C_BG = "#f3f4f6";

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
.leaflet-control-attribution{font-size:8px}

/* Pin individual */
.lp{
  background:${C_WHITE};
  border:2px solid ${C_PRIMARY};
  border-radius:12px;
  padding:4px 8px;
  font-size:12px;
  font-weight:700;
  color:${C_TEXT};
  white-space:nowrap;
  box-shadow:0 2px 6px rgba(0,0,0,0.18);
  cursor:pointer;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
}
.lp.sel{background:${C_PRIMARY};color:${C_WHITE}}
.lp.hi{border-color:${C_PRIMARY_DARK};border-width:3px}

/* Cluster */
.lc{
  background:${C_PRIMARY};
  border:3px solid ${C_WHITE};
  border-radius:50%;
  width:44px;height:44px;
  display:flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:700;color:${C_WHITE};
  box-shadow:0 2px 8px rgba(0,0,0,0.25);
  cursor:pointer;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
}
</style>
</head>
<body>
<div id="map"></div>
<script>
var map = L.map('map', { zoomControl: true })
  .setView([40.416775, -3.70379], 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var _markers = {};
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
  _markers = {};
}

function mkPin(price, currency, sel, hi) {
  var cls = 'lp' + (sel ? ' sel' : '') + (hi ? ' hi' : '');
  return '<div class="' + cls + '">' + (currency || '€') + price + '</div>';
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
      var sel = item.pin.id === _selId;
      var icon2 = L.divIcon({
        html: mkPin(item.pin.price, item.pin.currency, sel, !!item.pin.isHighlighted),
        className: '',
        iconSize: [80, 30],
        iconAnchor: [40, 30]
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
      _markers[item.pin.id] = m;
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
          fillColor:'rgba(16,185,129,0.08)',fillOpacity:1,
          color:'rgba(16,185,129,0.40)',weight:1.5
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
  background:${C_PRIMARY};
  border:3px solid ${C_WHITE};
  border-radius:50%;
  box-shadow:0 2px 4px rgba(0,0,0,0.25);
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

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
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
