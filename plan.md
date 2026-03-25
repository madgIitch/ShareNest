# HomiMatch — Plan de inicialización desde 0

## Contexto del proyecto

HomiMatch es un marketplace bidireccional de habitaciones en pisos compartidos en España.
Diferenciador core: componente social (Friendz — amigos en común visibles en los anuncios).
Dos actores: quien publica habitación y quien busca. Un usuario puede ser ambos a la vez.

El repo está vacío (solo .git). Hay que construirlo todo desde cero.

---

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | React Native + Expo (SDK más reciente) |
| Navegación | Expo Router (file-based, carpeta `app/`) |
| Backend / Auth / DB | Supabase |
| Estilos | NativeWind (Tailwind para RN) |
| Estado servidor | TanStack Query |
| Estado cliente | Zustand |
| Formularios | React Hook Form + Zod |
| Mapas | react-leaflet (web) · react-native-maps (nativo) |
| Push notifications | Expo Notifications |
| Imágenes | Expo Image Picker + Supabase Storage |
| i18n | expo-localization + i18n-js (español por defecto) |

---

## FASE 1 — Scaffolding y configuración base

### 1.1 Inicializar proyecto Expo

```bash
npx create-expo-app@latest . --template blank-typescript
```

### 1.2 Instalar dependencias

```bash
# Navegación
npx expo install expo-router expo-constants expo-linking expo-status-bar
npx expo install react-native-safe-area-context react-native-screens
npx expo install react-native-gesture-handler react-native-reanimated

# Supabase
npm install @supabase/supabase-js

# Estado
npm install @tanstack/react-query zustand

# Formularios
npm install react-hook-form @hookform/resolvers zod

# Estilos
npm install nativewind
npm install --save-dev tailwindcss

# Mapas
npm install react-leaflet leaflet
npm install react-native-maps
npm install --save-dev @types/leaflet

# Expo extras
npx expo install expo-notifications expo-image-picker
npx expo install expo-localization expo-font expo-splash-screen

# i18n
npm install i18n-js
npm install --save-dev @types/i18n-js
```

### 1.3 Archivos de configuración

**`tailwind.config.js`**
```js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: { extend: {} },
  plugins: [],
}
```

**`babel.config.js`**
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

**`metro.config.js`**
```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: "./global.css" });
```

**`global.css`**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Leaflet price markers */
.hm-price-marker {
  background: white;
  border: 2px solid #222;
  border-radius: 20px;
  padding: 2px 8px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}
.hm-price-marker:hover {
  background: #222;
  color: white;
}
```

**`.env.local`** (crear vacío, el usuario rellena los valores)
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

---

## FASE 2 — Estructura de carpetas y archivos

Crea todos estos archivos con un export default mínimo (`export default function X() {}`).
No implementes nada todavía — solo la estructura.

```
app/
  _layout.tsx
  (auth)/
    _layout.tsx
    login.tsx
    register.tsx
    onboarding.tsx
  (tabs)/
    _layout.tsx
    index.tsx           ← Explorar (mapa + lista)
    search.tsx          ← Buscar compañero
    requests.tsx        ← Solicitudes
    profile.tsx         ← Perfil propio
  listing/
    [id].tsx
  seeker/
    [id].tsx
  household/
    index.tsx
    expenses.tsx
    [id]/
      index.tsx
  user/
    [id].tsx
  publish/
    _layout.tsx
    step-details.tsx
    step-location.tsx
    step-photos.tsx
    step-rules.tsx
    step-preview.tsx
  conversation/
    [id].tsx

src/
  lib/
    supabase.ts
    queryClient.ts
  types/
    database.ts         ← ver Fase 3
    index.ts
  hooks/
    useAuth.ts
    useRoomListings.ts
    useSeekerListings.ts
    useRequests.ts
    useConversations.ts
    useConnections.ts
    useHousehold.ts
    useProfile.ts
  stores/
    authStore.ts
    filtersStore.ts
  components/
    ui/
      Button.tsx
      Input.tsx
      Avatar.tsx
      Badge.tsx
      Card.tsx
      Sheet.tsx
      Skeleton.tsx
    listing/
      RoomCard.tsx
      RoomCardSkeleton.tsx
    seeker/
      SeekerCard.tsx
    request/
      RequestCard.tsx
      StatusBadge.tsx
    household/
      ExpenseItem.tsx
      BalanceSummary.tsx
    profile/
      FriendButton.tsx
      MutualFriends.tsx
    map/
      MapView.tsx
      MapView.web.tsx    ← implementación Leaflet
      MapMarker.tsx
  constants/
    colors.ts
    config.ts
  i18n/
    es.ts
    index.ts
  utils/
    format.ts
    addressHash.ts
```

---

## FASE 3 — Tipos de base de datos (`src/types/database.ts`)

Genera el archivo completo con esta estructura:

```ts
export type Database = {
  public: {
    Tables: { ... }
    Views:  { ... }
    Functions: { ... }
    Enums: { ... }
  }
}
```

### Enums

```ts
listing_status:      "draft" | "active" | "paused" | "rented"
seeker_status:       "active" | "paused" | "found"
request_status:      "pending" | "invited" | "offered" | "accepted" | "assigned" | "denied"
request_target:      "room_listing" | "seeker_listing"
connection_status:   "pending" | "accepted"
subscription_tier:   "superfriendz"
subscription_status: "active" | "expired" | "cancelled"
bed_type:            "individual" | "doble" | "litera"
media_zone:          "habitacion" | "cocina" | "bano" | "salon" | "terraza" | "lavadero" | "garaje" | "entrada" | "otro"
contract_type:       "long_term" | "temporary" | "flexible"
```

### Tablas

Cada tabla tiene `Row` (lectura), `Insert` (escritura nueva) y `Update` (escritura parcial).
Los campos opcionales en Insert/Update llevan `?` y pueden ser `null`.

**profiles**
Row: id uuid, username text|null, full_name text|null, avatar_url text|null, bio text|null,
phone text|null, city text|null, verified_at string|null, created_at string,
push_token text|null, notif_messages boolean, notif_requests boolean, notif_friendz boolean,
stripe_customer_id text|null, birth_year number|null, occupation text|null,
languages string[]|null, photos string[]|null, schedule string|null,
cleanliness number|null, noise_level number|null, has_pets boolean|null,
smokes boolean|null, works_from_home boolean|null, guests_frequency string|null,
looking_for string|null, budget_min number|null, budget_max number|null,
move_in_date string|null, preferred_cities string[]|null

**connections**
Row: id uuid, requester_id uuid, addressee_id uuid, status connection_status, created_at string

**room_listings**
Row: id uuid, publisher_id uuid, title text, description text|null, price number,
size_m2 number|null, bed_type bed_type|null, has_private_bath boolean, has_wardrobe boolean,
has_desk boolean, is_furnished boolean, city_id text, place_id text|null,
address_approx text|null, address_full text|null, lat number|null, lng number|null,
postal_code text|null, owner_lives_here boolean, flatmates_count number|null,
total_rooms number|null, total_m2 number|null, floor text|null, has_elevator boolean,
allows_pets boolean, allows_smoking boolean, has_quiet_hours boolean, no_parties boolean,
bills_config Json, available_from string|null, min_stay_months number|null,
contract_type contract_type, status listing_status,
search_vector string,   ← GENERATED: presente en Row, AUSENTE en Insert y Update
created_at string, updated_at string

**listing_media**
Row: id uuid, publisher_id uuid, listing_id uuid|null, url text, zone media_zone,
address_hash text|null, sort_order number, created_at string

**seeker_listings**
Row: id uuid, user_id uuid, title text, description text|null, budget_min number|null,
budget_max number|null, available_from string|null, min_stay_months number|null,
city_ids string[], place_ids string[], has_pets boolean|null, smokes boolean|null,
looking_for_flatmate boolean, status seeker_status,
search_vector string,   ← GENERATED: presente en Row, AUSENTE en Insert y Update
created_at string, updated_at string

**requests**
Row: id uuid, requester_id uuid, owner_id uuid, target_type request_target,
room_listing_id uuid|null, seeker_listing_id uuid|null, status request_status,
message text|null, presentation_message text|null, is_boosted boolean,
offered_at string|null, offer_terms Json|null,
requester_confirmed_at string|null, owner_confirmed_at string|null, created_at string

**conversations**
Row: id uuid, request_id uuid|null, participant_a uuid, participant_b uuid,
last_message_at string|null, last_message_preview text|null, created_at string

**messages**
Row: id uuid, conversation_id uuid, sender_id uuid, content text,
is_system boolean, read_at string|null, created_at string

**households**
Row: id uuid, name text, created_by uuid|null, invite_code text,
room_listing_id uuid|null, address text|null, city_id text|null, created_at string

**household_members**
Row: id uuid, household_id uuid, user_id uuid, role text, joined_at string,
leaving_date string|null, leaving_reason string|null

**expenses**
Row: id uuid, household_id uuid, paid_by uuid, amount number, category text,
description text|null, receipt_url text|null, date string, split_type text, created_at string

**expense_splits**
Row: id uuid, expense_id uuid, user_id uuid, amount number, is_settled boolean,
settled_at string|null, settled_by uuid|null

**push_tokens**
Row: id uuid, user_id uuid, token text, platform text, created_at string

**subscriptions**
Row: id uuid, user_id uuid, tier subscription_tier, status subscription_status,
product_id text|null, expires_at string|null, created_at string, updated_at string

### Vistas (solo Row, sin Insert/Update)

```
active_requests_count:  requester_id uuid, active_count number
cities_with_counts:     id text, name text, centroid text|null, bbox text|null, search_count number
household_balances:     expense_id uuid, household_id uuid, user_id uuid, amount number,
                        is_settled boolean, paid_by uuid, net_contribution number
```

### Funciones RPC

```ts
search_room_listings:   Args: { p_query?, p_city_id?, p_place_id?, p_price_min?,
                                p_price_max?, p_size_min?, p_allows_pets?,
                                p_allows_smoking?, p_available_from?, p_lat?,
                                p_lng?, p_radius_km?, p_limit?, p_offset? }
                        Returns: Tables['room_listings']['Row'][]

search_users:           Args: { p_query: string, p_limit?: number }
                        Returns: { id, full_name, avatar_url, username, verified_at, city }[]

get_mutual_friends:     Args: { p_user_a: string, p_user_b: string }
                        Returns: { id, full_name, avatar_url, username, verified_at }[]

get_connection_degree:  Args: { p_viewer: string, p_target: string }
                        Returns: number | null

join_household_by_code: Args: { p_code: string }
                        Returns: string

increment_city_count:   Args: { p_city_id: string }
                        Returns: void
```

---

## FASE 4 — Infraestructura de la app

### 4.1 `src/lib/supabase.ts`

```ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

### 4.2 `src/lib/queryClient.ts`

```ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});
```

### 4.3 `src/stores/authStore.ts`

Zustand store con: `user`, `session`, `loading`.
Acciones: `setUser`, `setSession`, `setLoading`, `clear`.

### 4.4 `src/stores/filtersStore.ts`

Zustand store con: `city_id`, `place_id`, `price_min`, `price_max`,
`allows_pets`, `allows_smoking`, `available_from`.
Acciones: `setFilter`, `resetFilters`.

### 4.5 `src/hooks/useAuth.ts`

- Escucha `supabase.auth.onAuthStateChange`
- Sincroniza con `authStore`
- Al login: upsert en `profiles` con `id = user.id`
- Expone: `user`, `session`, `loading`, `signIn`, `signUp`, `signOut`

### 4.6 `app/_layout.tsx` — RootLayout

Wrappea todo con:
1. `QueryClientProvider` (TanStack Query)
2. Listener de auth (`useAuth`)
3. `SafeAreaProvider`
4. Redirect a `(auth)/login` si no hay sesión, a `(tabs)` si la hay

---

## FASE 5 — Mapas con Leaflet

### `src/components/map/MapView.web.tsx`

Implementación completa con react-leaflet para web.

```tsx
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix icono por defecto (bug conocido con bundlers)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Marker de precio
const priceIcon = (price: number) =>
  L.divIcon({
    className: "",
    html: `<div class="hm-price-marker">€${price}</div>`,
    iconSize: [60, 28],
    iconAnchor: [30, 14],
  });

// El MapContainer necesita height explícito en el style prop.
// Sin height el mapa no renderiza — es el error más común con Leaflet.
// Usa: style={{ height: "100%", width: "100%" }} y asegúrate de que
// el contenedor padre también tenga height definido.

// TileLayer: https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
// attribution: "© OpenStreetMap contributors"

// Centro España por defecto: center={[40.4168, -3.7038]} zoom={6}
```

### `src/components/map/MapView.tsx` (nativo)

Usa `react-native-maps` con la misma interfaz de props.

### Props compartidas (`MapViewProps`)

```ts
interface MapViewProps {
  initialRegion: {
    latitude: number;
    longitude: number;
    zoom?: number;           // Leaflet
    latitudeDelta?: number;  // RNMaps
    longitudeDelta?: number; // RNMaps
  };
  markers?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    price?: number;
    onPress?: () => void;
  }>;
  onRegionChange?: (region: MapViewProps["initialRegion"]) => void;
  style?: object;
}
```

---

## FASE 6 — Pantalla Explore (`app/(tabs)/index.tsx`)

Pantalla principal con dos modos toggleables.

**Modo mapa:**
- `MapView` con markers de precio
- Al tocar marker: bottom Sheet con `RoomCard` resumida
- Al mover mapa: re-lanza query con bbox visible
- Botón flotante para cambiar a modo lista

**Modo lista:**
- `FlatList` de `RoomCard`
- `useInfiniteQuery` con `search_room_listings` RPC
- `RoomCardSkeleton` mientras carga
- Pull-to-refresh

**Filtros:**
- Barra de filtros horizontalmente scrollable (ciudad, precio, mascotas, fumador)
- Estado en `filtersStore`
- Cambiar filtro re-ejecuta la query

---

## FASE 7 — Tab bar (`app/(tabs)/_layout.tsx`)

4 tabs:

| Tab | Ruta | Icono |
|-----|------|-------|
| Explorar | `index` | map |
| Buscar compañero | `search` | search |
| Solicitudes | `requests` | bell |
| Mi perfil | `profile` | user |

---

## Restricciones

- No hay entidad `property` ni `room` — el modelo antiguo fue descartado
- Cada `room_listing` es un anuncio independiente (no agrupados por piso)
- No uses `StyleSheet.create` — solo clases de NativeWind
- No uses Redux ni Context para estado global
- No instales Google Maps ni Mapbox
- No toques `cities`, `city_places`, `city_search_counts` — ya existen en Supabase con datos

---

## Checklist de entrega

- [ ] `expo start` arranca sin errores
- [ ] `expo start --web` arranca sin errores
- [ ] Estructura de carpetas completa
- [ ] `src/types/database.ts` tipado completo
- [ ] `src/lib/supabase.ts` con env vars
- [ ] `useAuth` con `onAuthStateChange`
- [ ] Tab bar con 4 tabs navegables
- [ ] Mapa Leaflet renderiza en web con markers de precio
- [ ] Pantalla Explore: toggle mapa/lista funcional
- [ ] Infinite scroll en modo lista