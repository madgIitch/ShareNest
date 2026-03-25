import { useRef, useEffect, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import WebView, { WebViewMessageEvent } from "react-native-webview";

interface MapViewProps {
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta?: number;
    longitudeDelta?: number;
  };
  markers?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    price?: number;
    selected?: boolean;
    onPress?: () => void;
  }>;
  onRegionChange?: (region: MapViewProps["initialRegion"]) => void;
  style?: object;
}

// Leaflet + OSM via CDN — works without native build (Expo Go compatible)
const MAP_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
html, body, #map { width:100%; height:100%; background:#111; }
.price-pill {
  background:#1A1A1A;
  color:#fff;
  font-family:-apple-system,BlinkMacSystemFont,sans-serif;
  font-weight:700;
  font-size:13px;
  padding:5px 10px;
  border-radius:20px;
  border:1.5px solid #333;
  white-space:nowrap;
  box-shadow:0 2px 8px rgba(0,0,0,0.6);
  cursor:pointer;
  transform:translate(-50%,-50%);
}
.price-pill.sel { background:#F36A39; border-color:#F36A39; }
</style>
</head>
<body>
<div id="map"></div>
<script>
(function(){
  var map = L.map('map',{zoomControl:false,attributionControl:true});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom:19
  }).addTo(map);
  L.control.zoom({position:'bottomright'}).addTo(map);

  var layerGroup = L.layerGroup().addTo(map);
  var markerDataMap = {};

  function pillIcon(price, sel){
    var label = price!=null ? ('\u20AC'+price) : '\u00B7';
    return L.divIcon({
      html:'<div class="price-pill'+(sel?' sel':'')+'">'+ label +'<\/div>',
      className:'',
      iconSize:[0,0],
      iconAnchor:[0,0]
    });
  }

  function renderMarkers(list){
    layerGroup.clearLayers();
    markerDataMap = {};
    (list||[]).forEach(function(m){
      var lm = L.marker([m.lat,m.lng],{icon:pillIcon(m.price,m.selected)});
      lm.on('click',function(){ post({type:'markerPress',id:m.id}); });
      layerGroup.addLayer(lm);
      markerDataMap[m.id] = {lm:lm, data:m};
    });
  }

  function post(msg){
    if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  }

  function handle(raw){
    try{
      var msg = JSON.parse(raw);
      if(msg.type==='init'){
        map.setView([msg.lat,msg.lng], msg.zoom||12);
        renderMarkers(msg.markers);
      } else if(msg.type==='setMarkers'){
        renderMarkers(msg.markers);
      } else if(msg.type==='flyTo'){
        map.flyTo([msg.lat,msg.lng], msg.zoom||14);
      }
    } catch(e){}
  }

  document.addEventListener('message',function(e){handle(e.data);});
  window.addEventListener('message',function(e){handle(e.data);});
  map.whenReady(function(){ post({type:'ready'}); });
})();
<\/script>
</body>
</html>`;

export default function MapView({ initialRegion, markers, onRegionChange, style }: MapViewProps) {
  const ref = useRef<WebView>(null);
  const ready = useRef(false);

  const post = useCallback((msg: object) => {
    ref.current?.postMessage(JSON.stringify(msg));
  }, []);

  const buildMarkerList = useCallback(
    () =>
      (markers ?? []).map((m) => ({
        id: m.id,
        lat: m.latitude,
        lng: m.longitude,
        price: m.price,
        selected: m.selected ?? false,
      })),
    [markers]
  );

  // Push marker updates once the map is ready
  useEffect(() => {
    if (ready.current) {
      post({ type: "setMarkers", markers: buildMarkerList() });
    }
  }, [buildMarkerList, post]);

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      let msg: any;
      try { msg = JSON.parse(e.nativeEvent.data); } catch { return; }

      if (msg.type === "ready") {
        ready.current = true;
        post({
          type: "init",
          lat: initialRegion.latitude,
          lng: initialRegion.longitude,
          zoom: 12,
          markers: buildMarkerList(),
        });
      } else if (msg.type === "markerPress") {
        markers?.find((m) => m.id === msg.id)?.onPress?.();
      }
    },
    [initialRegion, buildMarkerList, markers, post]
  );

  return (
    <View style={[s.container, style as any]}>
      <WebView
        ref={ref}
        source={{ html: MAP_HTML, baseUrl: "https://openstreetmap.org" }}
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
  container: { flex: 1, overflow: "hidden" },
  webView: { flex: 1, backgroundColor: "#111111" },
});
