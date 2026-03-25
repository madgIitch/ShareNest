# HomiMatch — Plan de implementación por sprints

## Premisas

- Sprints de 2 semanas
- Stack: Expo + Expo Router · Supabase · NativeWind · TanStack Query · Zustand · react-leaflet (web) + react-native-maps (nativo)
- Cada sprint termina con algo funcionando end-to-end, no con pantallas sueltas
- El orden prioriza el core loop de valor: buscar → ver → solicitar → gestionar

---

## Sprint 0 — Fundación (2 semanas)

**Objetivo:** El proyecto arranca, la DB está en producción y hay un usuario registrado real.

### Infraestructura
- Inicializar repo con `create-expo-app` (blank-typescript)
- Configurar Expo Router, NativeWind, TanStack Query, Zustand
- Ejecutar migración SQL en Supabase (schema completo acordado)
- Ejecutar migración `add_room_listing_members.sql`
- Configurar variables de entorno y `src/lib/supabase.ts`

### Auth
- Pantalla Splash (diseño acordado — fondo oscuro, social proof)
- Pantalla Login (email + contraseña + Google OAuth)
- Onboarding paso 1: perfil básico (nombre, username, año, ocupación, foto)
- `useAuth` con `onAuthStateChange` → upsert en `profiles`
- Redirect automático: sin sesión → auth, con sesión → tabs

### Tipos
- Generar `src/types/database.ts` completo con todos los enums, tablas, vistas y RPCs

### Entregable
Un usuario puede registrarse, rellenar su perfil básico y entrar a la app.

---

## Sprint 1 — Explorar (2 semanas)

**Objetivo:** Un buscador puede explorar habitaciones reales en mapa y lista.

### Pantalla Explore (tab principal)
- Toggle mapa / lista
- **Modo lista:** `useInfiniteQuery` sobre RPC `search_room_listings`, FlatList con `RoomCard` y skeleton
- **Modo mapa web:** `MapView.web.tsx` con react-leaflet, markers de precio con `L.divIcon` (`hm-price-marker`), fix del icono por defecto, centro España `[40.4168, -3.7038]` zoom 6
- **Modo mapa nativo:** `MapView.tsx` con react-native-maps, misma interfaz de props
- Al tocar marker: bottom sheet con `RoomCard` resumida
- Al mover mapa: re-lanza query con bbox visible

### Filtros
- Barra de chips horizontal scrollable: ciudad, precio min/max, mascotas, fumador, disponibilidad
- Estado en `filtersStore` (Zustand)
- Cambiar filtro → re-ejecuta query
- `increment_city_count` RPC al seleccionar ciudad

### Componentes
- `RoomCard` completa: foto, precio, título, ubicación, pills, amigos en común, rating
- `RoomCardSkeleton`
- `MapView` (wrapper plataforma)

### Entregable
Explorar habitaciones reales con mapa funcional en web y lista con infinite scroll.

---

## Sprint 2 — Detalle y publicación (2 semanas)

**Objetivo:** Un publisher puede publicar su primera habitación y un buscador puede verla en detalle.

### Detalle de habitación (`app/listing/[id].tsx`)
- Hero con fotos (galería swipeable)
- Precio, título, ubicación, pills de características
- Bloque amigos en común: `get_mutual_friends` RPC, avatares + nombres
- Convivientes: query a `room_listing_members` donde `confirmed = true`, los `show_profile = false` aparecen como "conviviente anónimo"
- Amenities grid (baño, armario, ascensor, mascotas, fumador...)
- Gastos: chips de `bills_config` jsonb (incluido / +extra / —)
- Mapa mini con ubicación aproximada + disclaimer de privacidad
- Publisher card con grado de conexión (`get_connection_degree` RPC)
- CTA: botón "Solicitar habitación"

### Wizard publicar habitación (5 pasos)
- Paso 1: título, precio, tipo de cama, características (toggles)
- Paso 2: ubicación — mapa con pin arrastrable (Leaflet/RNMaps), dirección confirmada, nota de privacidad
- Paso 3: convivientes — detección de household activo → importar miembros de golpe; invitar por username; invitación genera notificación push al conviviente; `room_listing_members` insert
- Paso 4: gastos — selector por suministro (incluido / +extra / —) → escribe `bills_config` jsonb
- Paso 5: preview + checklist (aviso si sin fotos) + toggle publicar ahora / guardar borrador

### Fotos
- `listing_media` upload a Supabase Storage con `address_hash` para reutilización
- Paso de fotos en el wizard (mínimo 1, recomendado 3+)

### Entregable
Un publisher puede publicar una habitación completa. Un buscador puede ver el detalle con mapa, convivientes y gastos.

---

## Sprint 3 — Solicitudes y chat (2 semanas)

**Objetivo:** El core loop de negocio funciona end-to-end: solicitar → gestionar → chatear → hacer oferta.

### Solicitudes (`app/(tabs)/requests.tsx`)
- Segmento Recibidas / Enviadas
- Badge de notificaciones en tab bar
- `RequestCard` con estado visual por colores (naranja pending, azul invited, morado offered, verde accepted, negro assigned)
- Amigos en común visibles en las recibidas
- Acciones según estado:
  - pending recibida → Chatear / Hacer oferta / Rechazar
  - invited → Mensaje / Hacer oferta / Rechazar
  - offered recibida → Aceptar / Rechazar
  - offered enviada → Mensaje / Retirar
- Modal "Hacer oferta": precio, fecha de entrada, estancia mínima → escribe `offer_terms` jsonb
- Flujo completo: `pending → invited → offered → accepted → assigned`

### Chat (`app/conversation/[id].tsx`)
- Mensajes en tiempo real con Supabase Realtime (`messages` table subscription)
- Burbuja propia (derecha) vs ajena (izquierda)
- Mensajes de sistema (eventos del flujo: "Sara te ha hecho una oferta")
- Input con envío, read receipts (`read_at`)
- Actualiza `last_message_at` y `last_message_preview` en `conversations`

### Notificaciones push
- Expo Notifications: registro de token → upsert en `push_tokens`
- Edge Function `notify-request-update`: dispara push al owner/requester en cada cambio de estado

### Entregable
Un buscador puede solicitar, chatear y recibir/aceptar una oferta. Un publisher puede gestionar todas sus solicitudes.

---

## Sprint 4 — Social: Friendz y perfiles (2 semanas)

**Objetivo:** El componente social es visible y útil en toda la app.

### Onboarding pasos 2-5
- Paso 2 Lifestyle: horario (cards), limpieza/ruido (scale dots clickeables → `cleanliness`, `noise_level`), mascotas/fumar (toggles)
- Paso 3 Fotos: grid 3×2, picker de imágenes → `profiles.photos[]`
- Paso 4 Qué busco: selector looking_for (room / flatmate / both) → `profiles.looking_for`
- Paso 5 Friendz: importar contactos del dispositivo, sugerencias de `search_users` RPC, conectar → insert en `connections`

### Perfiles (`app/user/[id].tsx` + `app/(tabs)/profile.tsx`)
- Hero con fotos del perfil (swipeable)
- Avatar, nombre, username, verificado, bio, meta (ocupación, edad, Friendz count)
- Vista ajena: strip amigos en común (naranja), botón Conectar/Conectado, botón Mensaje
- Tab Lifestyle: bloque compatibilidad (solo en ajeno, compara `cleanliness`/`noise_level`), chips horario/convivencia/idiomas
- Tab Anuncios: mini-listing cards con estado
- Tab Friendz: lista de conexiones con badge "también te conoce"
- Vista propia: botón Editar perfil, sin bloque de compatibilidad

### Friendz en anuncios
- `RoomCard` y detalle de habitación muestran amigos en común (query `get_mutual_friends`)
- `conn-badge` en detalle con número de amigos
- `get_connection_degree` RPC para mostrar grado de conexión con el publisher

### Búsqueda de usuarios
- `search_users` RPC con debounce para buscar al añadir convivientes o conectar

### Entregable
El componente social es funcional: puedes ver quién conoces en cada anuncio, conectar con personas y ver perfiles completos con compatibilidad.

---

## Sprint 5 — Household y gastos (2 semanas)

**Objetivo:** Los convivientes pueden gestionar gastos compartidos.

### Household
- Crear household: nombre + código de invitación auto-generado (6 chars)
- Unirse por código: `join_household_by_code` RPC
- Vinculación opcional al `room_listing_id` del anuncio de origen
- Dashboard: nombre del piso, strip de miembros con chips, tab bar (Balance / Gastos / Actividad)

### Balance (`tab Balance`)
- Card negra: total del mes + botón Añadir
- Cards individuales: "Pagas tú" (net positivo) y "Tu parte" del total
- Balance por persona: avatar, nombre, importe neto, barra proporcional
- Bloque "Liquidar deudas": quién te debe qué, botón Liquidar → marca splits como `is_settled = true`

### Gastos (`tab Gastos`)
- Botón Añadir gasto → bottom sheet: categoría (grid de iconos), importe grande, reparto entre todos
- Lista por mes: icono de categoría, nombre, quién pagó, tu parte en rojo (debes) o verde (pagado)
- Split type: equal (default) o custom
- Meses anteriores en opacidad reducida

### Actividad (`tab Actividad`)
- Feed cronológico tipo timeline: "Sara añadió un gasto · €94 · Hace 2 días"

### Integración con wizard de publicación
- Paso 3 del wizard detecta household activo → banner "Importar convivientes del household" → inserta en `room_listing_members`

### Entregable
Los convivientes pueden gestionar gastos, ver balances y liquidar deudas.

---

## Sprint 6 — Buscar compañero (2 semanas)

**Objetivo:** El flujo inverso funciona: un publisher puede buscar activamente buscadores compatibles.

### Seeker listings (`app/(tabs)/search.tsx`)
- Lista de perfiles buscando habitación con `SeekerCard`
- Filtros: ciudad, presupuesto, disponibilidad, mascotas, fumador
- Query a `seeker_listings` con filtros

### `SeekerCard`
- Avatar del buscador, nombre, presupuesto, ciudades buscadas, lifestyle chips
- Amigos en común (si los hay)
- Botón "Invitar" → crea request con `target_type = seeker_listing`

### Detalle de buscador (`app/seeker/[id].tsx`)
- Perfil completo del buscador
- Preferencias: presupuesto, ciudades, disponibilidad, lifestyle
- Amigos en común destacados
- CTA: "Invitarle a mi habitación" → selección de qué anuncio si tienes varios activos

### Publicar anuncio de buscador
- Formulario simple: título, descripción, presupuesto, ciudades, disponibilidad
- UNIQUE constraint → un usuario solo puede tener 1 seeker listing activo
- Toggle pausar/activar

### Solicitudes bidireccionales
- En la tab Solicitudes, las requests con `target_type = seeker_listing` aparecen con UI adaptada
- El buscador ve "Invitación de Sara a su habitación en Malasaña"

### Entregable
El marketplace es genuinamente bidireccional: los publishers también pueden buscar activamente.

---

## Sprint 7 — Pulido y lanzamiento (2 semanas)

**Objetivo:** La app está lista para usuarios reales.

### Calidad
- Error boundaries en todas las pantallas principales
- Estados de error con retry en todos los hooks
- Loading states consistentes (skeletons, spinners)
- Pull-to-refresh en todas las listas
- Offline graceful degradation

### Notificaciones completas
- Push en: nueva solicitud, nuevo mensaje, cambio de estado de request, invitación a household, conviviente confirma en anuncio
- Gestión de preferencias: `notif_messages`, `notif_requests`, `notif_friendz` en settings

### Settings y cuenta
- Editar perfil completo (bio, fotos, lifestyle)
- Gestión de notificaciones
- Cerrar sesión, eliminar cuenta

### Web (Expo Web)
- Verificar que el mapa Leaflet funciona correctamente en web
- `map.invalidateSize()` en cambios de tab
- CSS height explícito en el contenedor del mapa
- SEO básico para los anuncios (meta tags dinámicos)

### Verificación de identidad
- Subir DNI/NIE → `profiles.verified_at` (manual en esta fase, automático después)
- Badge verificado visible en perfiles y anuncios

### Analytics
- `increment_city_count` en búsquedas para alimentar `cities_with_counts`
- Eventos básicos de uso (vistas de anuncio, solicitudes enviadas)

### Entregable
App en producción, lista para primeros usuarios reales en Madrid.

---

## Resumen de sprints

| Sprint | Semanas | Foco | Entregable clave |
|--------|---------|------|-----------------|
| 0 | 1–2 | Fundación + Auth | Usuario registrado en producción |
| 1 | 3–4 | Explorar | Mapa + lista con habitaciones reales |
| 2 | 5–6 | Detalle + Publicar | Primer anuncio publicado end-to-end |
| 3 | 7–8 | Solicitudes + Chat | Core loop completo: solicitar → asignar |
| 4 | 9–10 | Social (Friendz + Perfiles) | Amigos en común visibles en toda la app |
| 5 | 11–12 | Household + Gastos | Gestión de gastos entre convivientes |
| 6 | 13–14 | Buscar compañero | Marketplace genuinamente bidireccional |
| 7 | 15–16 | Pulido + Lanzamiento | App en producción para usuarios reales |

**Total: 16 semanas (4 meses)**

---

## Pendiente de diseñar

Pantallas que quedan por mockupear antes o durante la implementación:

- Chat / Conversación (`app/conversation/[id].tsx`)
- Buscar compañero — `SeekerCard` y detalle de buscador
- Settings / Editar perfil
- Pantalla de búsqueda de usuarios (Friendz)