# HomiMatch — Plan de implementación para Codex
# Actualización al nuevo modelo de BBDD: rooms + common_areas

---

## CONTEXTO GENERAL

HomiMatch es una app React Native + Expo con Supabase/PostgreSQL. Se acaba de ejecutar
una migración de BBDD que introduce dos tablas nuevas y modifica el modelo existente.
Tu tarea es actualizar el código TypeScript del frontend para que refleje el nuevo
modelo sin romper funcionalidad existente.

Stack: React Native, Expo Router, Supabase JS v2, React Query (TanStack Query v5),
TypeScript estricto.

---

## QUÉ CAMBIÓ EN LA BBDD (ya migrado, no tocar SQL)

### Tablas nuevas

**`rooms`** — entidad física de una habitación. Puede existir sin listing.
```sql
rooms (
  id uuid PK,
  property_id uuid FK → properties,
  name text,                  -- "Habitación 1", "Habitación principal"
  size_m2 numeric,
  bed_type bed_type,          -- enum: 'individual' | 'doble' | 'litera'
  has_private_bath boolean,
  has_wardrobe boolean,
  has_desk boolean,
  photos jsonb,               -- string[] de URLs de fotos de la habitación
  created_at timestamptz
)
```

**`common_areas`** — zonas comunes del piso. Filtrables en búsqueda.
```sql
common_areas (
  id uuid PK,
  property_id uuid FK → properties,
  type common_area_type,      -- enum: 'cocina'|'bano'|'salon'|'terraza'|'lavadero'|'garaje'|'entrada'|'otro'
  photos jsonb,               -- { url: string, caption?: string }[]
  description text,
  amenities text[],
  is_shared_bath boolean,
  created_at timestamptz
  UNIQUE (property_id, type)
)
```

### Cambios en `properties`
- ELIMINADA: columna `household_id` (la FK ahora vive en `households.property_id`)
- AÑADIDAS: `owner_lives_here boolean`, `allows_pets boolean`, `allows_smoking boolean`,
  `has_quiet_hours boolean`, `no_parties boolean`
- `house_rules text[]` se mantiene como legacy pero las columnas booleanas son
  la fuente de verdad para búsqueda

### Cambios en `listings`
- AÑADIDA: `room_id uuid FK → rooms` (ya rellenada para todos los listings existentes)
- DEPRECADAS (siguen en BBDD por compatibilidad, NO eliminar): `size_m2`, `bed_type`,
  `has_private_bath`, `has_wardrobe`, `has_desk`
- La fuente de verdad de esos campos ahora es `rooms`, no `listings`

### Vista actualizada: `listings_with_property`
La vista ahora incluye todos los campos de `rooms` y `common_area_types`:
```
room_id, room_name, size_m2, bed_type, has_private_bath, has_wardrobe,
has_desk, room_photos, common_area_types (common_area_type[])
```
Y nuevos campos de `properties`:
```
owner_lives_here, allows_pets, allows_smoking, has_quiet_hours, no_parties,
property_photos (antes llamado images)
```

### RPC `search_listings` actualizada
Nueva firma:
```typescript
search_listings(
  p_city_id?: string,
  p_place_id?: string,
  p_price_min?: number,
  p_price_max?: number,
  p_allows_pets?: boolean,
  p_allows_smoking?: boolean,
  p_common_areas?: CommonAreaType[],  // NUEVO filtro
  p_available_from?: string,
  p_limit?: number,
  p_offset?: number
): listings_with_property[]
```

### Relación Property → Household corregida
- `households` tiene `property_id FK → properties` (igual que antes)
- `properties` ya NO tiene `household_id` (columna eliminada)
- Para obtener el household de un piso: `SELECT * FROM households WHERE property_id = $1`

---

## TAREAS A IMPLEMENTAR

### TAREA 1 — Actualizar `src/types/database.ts`

Añadir los nuevos tipos. Busca el archivo `database.ts` (o `database.types.ts`) y:

1. Añadir a `Tables`:

```typescript
rooms: {
  Row: {
    id: string
    property_id: string
    name: string | null
    size_m2: number | null
    bed_type: 'individual' | 'doble' | 'litera' | null
    has_private_bath: boolean
    has_wardrobe: boolean
    has_desk: boolean
    photos: Json  // string[]
    created_at: string
  }
  Insert: {
    id?: string
    property_id: string
    name?: string | null
    size_m2?: number | null
    bed_type?: 'individual' | 'doble' | 'litera' | null
    has_private_bath?: boolean
    has_wardrobe?: boolean
    has_desk?: boolean
    photos?: Json
    created_at?: string
  }
  Update: Partial<Tables['rooms']['Insert']>
}

common_areas: {
  Row: {
    id: string
    property_id: string
    type: CommonAreaType
    photos: Json  // { url: string; caption?: string }[]
    description: string | null
    amenities: string[]
    is_shared_bath: boolean
    created_at: string
  }
  Insert: {
    id?: string
    property_id: string
    type: CommonAreaType
    photos?: Json
    description?: string | null
    amenities?: string[]
    is_shared_bath?: boolean
    created_at?: string
  }
  Update: Partial<Tables['common_areas']['Insert']>
}
```

2. Actualizar `properties.Row` para:
   - ELIMINAR: `household_id`
   - AÑADIR: `owner_lives_here: boolean`, `allows_pets: boolean`,
     `allows_smoking: boolean`, `has_quiet_hours: boolean`, `no_parties: boolean`

3. Actualizar `listings.Row` para:
   - AÑADIR: `room_id: string | null`

4. Actualizar `Views` para añadir `listings_with_property`:
```typescript
listings_with_property: {
  Row: {
    // todos los campos de listings excepto images → pasan a llamarse así:
    id: string
    owner_id: string
    room_id: string | null
    property_id: string
    type: string
    title: string
    description: string | null
    price: number
    available_from: string | null
    min_stay_months: number | null
    contract_type: string | null
    status: string
    created_at: string
    updated_at: string
    search_vector: unknown | null
    // Ubicación (con fallback de property sobre listing)
    city_id: string | null
    place_id: string | null
    lat: number | null
    lng: number | null
    postal_code: string | null
    address: string | null
    city_name: string | null
    district_name: string | null
    // Property
    property_total_m2: number | null
    property_total_rooms: number | null
    floor: string | null
    has_elevator: boolean
    owner_lives_here: boolean
    allows_pets: boolean
    allows_smoking: boolean
    has_quiet_hours: boolean
    no_parties: boolean
    bills_config: Json | null
    property_photos: Json | null  // PropertyPhoto[] | string[]
    // Room
    room_name: string | null
    size_m2: number | null
    bed_type: string | null
    has_private_bath: boolean | null
    has_wardrobe: boolean | null
    has_desk: boolean | null
    room_photos: Json | null  // string[]
    // Common areas
    common_area_types: CommonAreaType[] | null
  }
}
```

5. Añadir enums:
```typescript
type CommonAreaType = 'cocina' | 'bano' | 'salon' | 'terraza' | 'lavadero' | 'garaje' | 'entrada' | 'otro'
type BedType = 'individual' | 'doble' | 'litera'
```

---

### TAREA 2 — Crear `src/types/room.ts`

```typescript
import type { Database } from './database'

export type Room = Database['public']['Tables']['rooms']['Row']
export type RoomInsert = Database['public']['Tables']['rooms']['Insert']
export type RoomUpdate = Database['public']['Tables']['rooms']['Update']

export type CommonArea = Database['public']['Tables']['common_areas']['Row']
export type CommonAreaInsert = Database['public']['Tables']['common_areas']['Insert']
export type CommonAreaType = 'cocina' | 'bano' | 'salon' | 'terraza' | 'lavadero' | 'garaje' | 'entrada' | 'otro'

export const COMMON_AREA_LABELS: Record<CommonAreaType, { label: string; icon: string }> = {
  cocina:   { label: 'Cocina',    icon: '🍳' },
  bano:     { label: 'Baño',      icon: '🚿' },
  salon:    { label: 'Salón',     icon: '🛋️' },
  terraza:  { label: 'Terraza',   icon: '🌿' },
  lavadero: { label: 'Lavadero',  icon: '🧺' },
  garaje:   { label: 'Garaje',    icon: '🚗' },
  entrada:  { label: 'Entrada',   icon: '🚪' },
  otro:     { label: 'Otro',      icon: '📷' },
}
```

---

### TAREA 3 — Actualizar `src/types/propertyPhoto.ts`

El archivo ya existe con `PropertyPhoto` y `PropertyPhotoRoom`. Actualizarlo para
que `PropertyPhotoRoom` coincida con `CommonAreaType`:

```typescript
// PropertyPhotoRoom es un alias de CommonAreaType para compatibilidad
export type PropertyPhotoRoom = 'cocina' | 'bano' | 'salon' | 'terraza' | 'lavadero' | 'garaje' | 'entrada' | 'otro'
```

IMPORTANTE: el campo `room` en `PropertyPhoto` puede tener valores legacy como
`"baño"` (con tilde) o `"Cocina"` (mayúscula). Actualizar `normalizePropertyPhotos()`
para normalizar estos valores:

```typescript
function normalizeRoom(raw: string): PropertyPhotoRoom {
  const map: Record<string, PropertyPhotoRoom> = {
    'baño': 'bano', 'bano': 'bano',
    'cocina': 'cocina', 'Cocina': 'cocina',
    'salón': 'salon', 'salon': 'salon', 'Salón': 'salon',
    'terraza': 'terraza', 'Terraza': 'terraza',
    // ... resto de casos
  }
  return map[raw] ?? 'otro'
}
```

---

### TAREA 4 — Crear hooks para `rooms` y `common_areas`

Crear `src/hooks/useRooms.ts`:

```typescript
// useRoomsByProperty(propertyId) → Room[]
// Devuelve todas las habitaciones de un piso, ordenadas por created_at ASC

// useCreateRoom() → mutation
// Inserta en rooms y devuelve el nuevo Room

// useUpdateRoom() → mutation
// Actualiza una room por id

// useDeleteRoom() → mutation
// Elimina una room (solo si no tiene listing activo)
```

Crear `src/hooks/useCommonAreas.ts`:

```typescript
// useCommonAreasByProperty(propertyId) → CommonArea[]
// Devuelve todas las zonas comunes de un piso

// useUpsertCommonArea() → mutation
// INSERT ... ON CONFLICT (property_id, type) DO UPDATE
// Usar supabase.from('common_areas').upsert({ property_id, type, ... }, { onConflict: 'property_id,type' })

// useDeleteCommonArea() → mutation
// Elimina una zona común por id
```

---

### TAREA 5 — Actualizar `src/hooks/useListings.ts`

**Cambio crítico:** Cualquier query que actualmente usa la tabla `listings` directamente
y accede a campos de ubicación (city, district, lat, lng, etc.) debe pasar a usar
la vista `listings_with_property`.

1. `useSearchListings` — ya usa `search_listings` RPC. Actualizar la firma para incluir
   el nuevo parámetro `p_common_areas`:
```typescript
type SearchListingsParams = {
  cityId?: string
  placeId?: string
  priceMin?: number
  priceMax?: number
  allowsPets?: boolean
  allowsSmoking?: boolean
  commonAreas?: CommonAreaType[]  // NUEVO
  availableFrom?: string
  limit?: number
  offset?: number
}
```

2. `useListing(id)` — si actualmente hace `SELECT * FROM listings WHERE id = $1`,
   cambiarlo a `SELECT * FROM listings_with_property WHERE id = $1` para obtener
   todos los datos del piso y la habitación en una sola query.

3. Actualizar el tipo de retorno de todos los hooks que devuelvan listings para usar
   `ListingWithProperty` (de la vista) en lugar de `Listing` (de la tabla).

---

### TAREA 6 — Actualizar `src/hooks/useProperties.ts`

1. Eliminar cualquier referencia a `property.household_id` — ya no existe esa columna.
   Para obtener el household de una propiedad:
```typescript
// En lugar de:
property.household_id

// Usar:
const { data: household } = useQuery({
  queryKey: ['household', propertyId],
  queryFn: () => supabase
    .from('households')
    .select('*')
    .eq('property_id', propertyId)
    .maybeSingle()
    .then(r => r.data)
})
```

2. Actualizar `useMyProperties` para incluir las nuevas columnas booleanas en el
   tipo de retorno.

---

### TAREA 7 — Actualizar el `ListingWizard`

Este es el cambio más extenso. El wizard tiene 9 pasos y necesita manejar el
nuevo modelo Room + CommonArea.

**Estado del wizard — separar claramente:**
```typescript
// Estado del PISO (steps 1-5) → se guarda en properties + common_areas
const [propertyPhotos, setPropertyPhotos] = useState<PropertyPhoto[]>(() =>
  normalizePropertyPhotos(existingProperty?.images ?? [])
)
// commonAreas: array de zonas comunes ya existentes en la BD
const [commonAreas, setCommonAreas] = useState<CommonAreaInput[]>([])

// Estado de la HABITACIÓN (steps 6-8) → se guarda en rooms
const [roomPhotos, setRoomPhotos] = useState<string[]>(() => {
  if (existingRoom?.photos) return existingRoom.photos as string[]
  return []
})

// Estado del ANUNCIO (steps 1, 6-9) → se guarda en listings
// price, title, description, available_from, etc.
```

**Cambio en la función `listingToForm()`:**
Al editar, los campos físicos de la habitación (size_m2, bed_type, has_private_bath,
etc.) deben cargarse desde `room` (si existe) en lugar de desde `listing`:

```typescript
function listingToForm(
  listing: ListingWithProperty,
  opts?: { existingRoom?: Room | null }
): FormData {
  const room = opts?.existingRoom
  return {
    // Datos de la habitación → desde room si existe, fallback a listing (legacy)
    size_m2: room?.size_m2?.toString() ?? listing.size_m2?.toString() ?? '',
    bed_type: (room?.bed_type ?? listing.bed_type ?? 'doble') as BedType,
    has_private_bath: room?.has_private_bath ?? listing.has_private_bath ?? false,
    has_wardrobe: room?.has_wardrobe ?? listing.has_wardrobe ?? false,
    has_desk: room?.has_desk ?? listing.has_desk ?? false,
    // ... resto de campos
  }
}
```

**Cambio en `handleSubmit()`:**

Al crear nuevo anuncio:
1. Crear/actualizar `Property` (igual que antes)
2. **NUEVO:** Crear `Room` con los datos físicos de la habitación:
   ```typescript
   const { data: room } = await supabase
     .from('rooms')
     .insert({
       property_id: propertyId,
       size_m2: form.size_m2 ? Number(form.size_m2) : null,
       bed_type: form.bed_type as BedType,
       has_private_bath: form.private_bath,
       has_wardrobe: form.wardrobe,
       has_desk: form.desk,
       photos: allRoomImages,
     })
     .select('id')
     .single()
   ```
3. Crear `Listing` con `room_id: room.id` y SIN los campos físicos deprecados
   (aunque pueden quedar en el payload por compatibilidad)
4. **NUEVO (opcional en MVP):** Upsert de `common_areas` si el propietario las añadió

Al editar anuncio existente:
1. Actualizar `Property`
2. **NUEVO:** Actualizar el `Room` existente (obtenido via `listing.room_id`):
   ```typescript
   await supabase
     .from('rooms')
     .update({
       size_m2: ...,
       bed_type: ...,
       has_private_bath: ...,
       photos: allRoomImages,
     })
     .eq('id', listing.room_id)
   ```
3. Actualizar `Listing` (solo campos del anuncio: price, title, available_from, etc.)

**Step 3 — Fotos del piso:** Ya implementado con `PropertyPhoto[]` y etiquetas de zona.
No necesita cambios de lógica, pero las etiquetas deben usar `CommonAreaType`
(sin tildes: `bano` no `baño`). Revisar el picker de zonas.

**Step 7 — Fotos de la habitación:** Ahora se guardan en `rooms.photos`, no en
`listings.images`. Al cargar para editar, leer desde `existingRoom.photos`.

**Normas de la casa (Step 5):** Los toggles deben leer/escribir desde las columnas
booleanas de `properties`, no desde `house_rules[]`:
```typescript
// Al cargar:
no_smokers: !existingProperty?.allows_smoking,
pets_ok: existingProperty?.allows_pets ?? false,
quiet_hours: existingProperty?.has_quiet_hours ?? false,
no_parties: existingProperty?.no_parties ?? false,

// Al guardar en propertyPayload:
allows_pets: form.pets_ok,
allows_smoking: !form.no_smokers,
has_quiet_hours: form.quiet_hours,
no_parties: form.no_parties,
// house_rules mantenerlo para legacy (puede calcularse desde los booleanos)
house_rules: [
  ...(form.pets_ok ? ['mascotas_ok'] : []),
  ...(!form.no_smokers ? [] : ['no_fumadores']),
  ...(form.quiet_hours ? ['silencio'] : []),
  ...(form.no_parties ? ['sin_fiestas'] : []),
]
```

---

### TAREA 8 — Actualizar `src/hooks/useHousehold.ts`

Eliminar cualquier código que actualice o lea `properties.household_id`.

Si hay código como:
```typescript
// ANTES (incorrecto):
await supabase.from('properties').update({ household_id: householdId }).eq('id', propertyId)

// ELIMINAR — esa columna ya no existe
```

Para obtener el household de una propiedad, consultar `households` por `property_id`:
```typescript
const { data: household } = await supabase
  .from('households')
  .select('*')
  .eq('property_id', propertyId)
  .maybeSingle()
```

---

### TAREA 9 — Actualizar pantalla de búsqueda (Explorar)

Si existe una pantalla de búsqueda/explorar con filtros, añadir el filtro de
zonas comunes:

```typescript
// Nuevos filtros disponibles:
- Mascotas permitidas → p_allows_pets: boolean
- Fumadores permitidos → p_allows_smoking: boolean
- Zonas comunes → p_common_areas: CommonAreaType[]  (multi-select: terraza, garaje...)
```

Los chips de filtro para zonas comunes deben usar `COMMON_AREA_LABELS` del
`src/types/room.ts` para mostrar icono + label.

---

### TAREA 10 — Actualizar pantalla de detalle del listing

La pantalla de detalle (vista buscador) debe mostrar:

1. **Galería del piso** — `property_photos` de la vista (puede ser `PropertyPhoto[]`
   con `{ url, zone }` o `string[]` legacy). Mostrar las etiquetas de zona.

2. **Galería de la habitación** — `room_photos` de la vista (siempre `string[]`).

3. **Zonas comunes disponibles** — chips con `common_area_types[]`.
   Ejemplo: si `common_area_types = ['cocina', 'terraza']`, mostrar chips
   "🍳 Cocina" y "🌿 Terraza".

4. **Normas del piso** — leer desde `allows_pets`, `allows_smoking`,
   `has_quiet_hours`, `no_parties` (columnas booleanas), NO desde `house_rules`.

5. **Owner lives here** — si `owner_lives_here = true`, mostrar badge
   "El propietario vive aquí".

---

## INVARIANTES A RESPETAR

1. **No eliminar columnas deprecated de `listings`** (`size_m2`, `bed_type`,
   `has_private_bath`, `has_wardrobe`, `has_desk`, `images`). Siguen en la BBDD
   y el código puede seguir escribiéndolas por compatibilidad, pero la lectura
   debe priorizar `rooms`.

2. **Siempre que se crea un Listing, también crear un Room**. La constraint
   `listings_room_active_unique` asegura que no puede haber dos listings
   activos/borrador para el mismo room, pero sí puede haber un room sin listing.

3. **`room_photos` en la vista = `rooms.photos`**. Las fotos de la habitación
   ya no se leen de `listings.images`. Sin embargo, para listings migrados
   automáticamente, `rooms.photos` contiene lo que antes era `listings.images`,
   así que la migración fue transparente.

4. **`property_photos` en la vista = `properties.images`**. El campo `images` de
   `properties` puede contener `string[]` (formato legacy) o
   `{ url: string; zone: string }[]` (formato nuevo). Usar `normalizePropertyPhotos()`
   para manejar ambos.

5. **No cambiar la RPC `confirm_assignment`**. Ya fue actualizada en la migración
   de BBDD para usar el nombre de la property en lugar del UUID del listing.

6. **El filtro de búsqueda `p_common_areas` usa el operador `@>` (contains all)**.
   Si el usuario selecciona `['terraza', 'garaje']`, la RPC devuelve pisos que
   tienen AMBAS zonas. Esto es intencional.

---

## ARCHIVOS A CREAR O MODIFICAR

### Crear:
- `src/types/room.ts`
- `src/hooks/useRooms.ts`
- `src/hooks/useCommonAreas.ts`

### Modificar:
- `src/types/database.ts` (o `database.types.ts`) — tipos Room, CommonArea, listings_with_property view
- `src/types/propertyPhoto.ts` — normalización de CommonAreaType sin tildes
- `src/hooks/useListings.ts` — firma de search_listings, tipo ListingWithProperty
- `src/hooks/useProperties.ts` — eliminar household_id
- `src/hooks/useHousehold.ts` — eliminar referencias a properties.household_id
- `src/components/listing/ListingWizard.tsx` — submit con Room, carga desde room en edición
- `src/components/listing/Step3CommonPhotos.tsx` — normalización de room keys (sin tildes)
- Pantalla de detalle del listing (buscar por nombre, probablemente en `app/listing/[id].tsx`)
- Pantalla de búsqueda/explorar (buscar por nombre, probablemente en `app/(tabs)/explore.tsx`)

---

## VERIFICACIÓN

Tras los cambios, verificar que:

1. Crear un listing nuevo genera un `Room` en la tabla `rooms` con el room_id
   correcto en `listings.room_id`.

2. Editar un listing carga `size_m2`, `bed_type` etc. desde `rooms`, no desde
   `listings`.

3. La búsqueda devuelve resultados correctos y los filtros de zonas comunes
   funcionan (aunque la tabla `common_areas` esté vacía, no debe romper nada).

4. La pantalla de detalle muestra `property_photos` y `room_photos` por separado.

5. No hay referencias a `property.household_id` en ningún archivo TypeScript.

6. `normalizePropertyPhotos()` maneja correctamente tanto `string[]` como
   `{ url, zone }[]` (con tildes) como `{ url, room }[]` (sin tildes).