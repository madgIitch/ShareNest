Sprint 1 — Setup & Auth (semanas 1–2)
El objetivo es tener la base del proyecto 100% operativa antes de tocar producto.

Infraestructura: Crear proyecto Supabase, configurar entornos (dev/staging/prod), variables de entorno con expo-constants. Inicializar repo con Expo, configurar ESLint + Prettier + TypeScript strict mode, CI básico con GitHub Actions que linte y testee en cada PR.

Auth: Supabase Auth con email magic link como método principal y phone OTP (número alemán + internacional). Flujo de onboarding post-login (pantalla de bienvenida que solo aparece una vez). Gestión de sesión persistente con expo-secure-store. RLS activado en todas las tablas desde el día 1.

Tablas Supabase iniciales:

profiles (id, username, full_name, avatar_url, bio, phone, city, verified_at, created_at)
Entregable: App que abre, muestra pantalla de login, autentica y persiste la sesión.

Sprint 2 — Perfiles de usuario (semanas 3–4)
Features: Pantalla de perfil propio con avatar (Supabase Storage, resize automático vía Edge Function), edición de nombre, bio, ciudad y número. Pantalla de perfil ajeno (modo read-only). Verificación de número de teléfono para generar confianza (badge de verificado). Pantalla de configuración básica.

Supabase Storage: Bucket avatars con políticas de acceso (solo el owner puede subir, todos pueden leer). Thumbnails generados en Edge Function con sharp o equivalente.

RLS destacada:

-- Solo el propio usuario edita su perfil
CREATE POLICY "update_own_profile" ON profiles
FOR UPDATE USING (auth.uid() = id);
Entregable: Perfil completo funcional, flujo de onboarding con foto + datos básicos.

Sprint 3 — Diseño base UI (semanas 5–6)
Sprint dedicado a construir el sistema de diseño y los componentes reutilizables antes de construir las pantallas más complejas. Invertir aquí ahorra tiempo en los sprints 4–8.

Componentes a construir: ListingCard, UserAvatar, TagBadge, PriceTag, CitySelector, ImagePicker (wrapper de expo-image-picker), BottomSheet (basado en @gorhom/bottom-sheet), Toast/Snackbar, skeleton loaders, empty states, error boundaries.

Navegación: Tab bar principal con 4 tabs: Explorar, Mis anuncios, Mensajes, Perfil. Stack navigators dentro de cada tab. Deep linking configurado (para compartir listings desde fuera de la app).

Theming: Paleta de colores definida (modo claro mínimo, oscuro opcional en sprint 9), tipografía con fuentes custom via expo-font.

Entregable: Storybook-like screen con todos los componentes. Navegación vacía pero funcional.

Sprint 4 — Listings: crear y gestionar (semanas 7–8)
El core del producto.

Tablas:

listings (
  id, owner_id, type, -- 'offer' | 'search'
  title, description, city, district,
  price, size_m2, rooms, available_from,
  is_furnished, pets_allowed, smokers_allowed,
  lat, lng,
  status, -- 'active' | 'paused' | 'rented'
  images jsonb, -- array de URLs de Storage
  created_at, updated_at
)
Features: Formulario de creación en pasos (wizard de 3 pasos: datos básicos → fotos → preferencias). Upload de hasta 8 fotos con reordenación. Selector de ciudad con geocoding (Expo Location + API de geocoding). Preview del listing antes de publicar. Dashboard de mis anuncios (activos, pausados, archivados). Editar y pausar/activar anuncio. Marcar como alquilado.

Storage: Bucket listing-images, imágenes redimensionadas a 1200px max. URL firmada para acceso.

Entregable: Crear, editar y gestionar listings propios de forma completa.

Sprint 5 — Búsqueda, filtros y mapa (semanas 9–10)
Features: Feed principal con listings paginados (cursor-based pagination con TanStack Query). Filtros: ciudad, precio min/max, tamaño, disponible desde, mascotas, fumadores, tipo (ofrecer/buscar). Búsqueda por texto libre (Postgres full-text search con tsvector). Vista de mapa con clusters usando react-native-maps + Expo MapView. Tap en marker abre card del listing. Guardado de filtros preferidos en AsyncStorage.

Supabase: Índice GiST para búsqueda geoespacial con PostGIS. Función RPC para búsqueda combinada (texto + filtros + radio geográfico).

CREATE INDEX listings_location_idx ON listings USING GIST (
  ST_SetSRID(ST_MakePoint(lng, lat), 4326)
);
Entregable: Búsqueda funcional con filtros y mapa. El producto ya es "usable" en este punto.

Sprint 6 — Request management + chat (semanas 11–12)
Esta es la feature diferenciadora: el flujo de solicitud con control del anunciante.

Tablas:

requests (
  id, listing_id, requester_id, owner_id,
  status, -- 'pending' | 'accepted' | 'denied'
  message, created_at
)

messages (
  id, conversation_id, sender_id,
  content, read_at, created_at
)

conversations (
  id, listing_id, request_id,
  participant_a, participant_b,
  last_message_at
)
Flujo de request: Usuario interesado envía solicitud con mensaje inicial. Anunciante ve lista de solicitudes con perfil del solicitante. Acepta → el solicitante obtiene acceso a los detalles completos del piso + se abre el chat. Deniega → notificación educada al solicitante.

Chat en tiempo real: Supabase Realtime con postgres_changes. Indicador de typing. Marca de leído. Lista de conversaciones activas en tab Mensajes. Notificaciones push con expo-notifications + Edge Function que dispara al llegar nuevo mensaje.

RLS crítica: Los detalles del listing (dirección exacta) solo son visibles si el request está en estado accepted.

Entregable: Flujo completo de solicitud → aceptación → chat.

Sprint 7 — Social graph: Friendz list (semanas 13–14)
La capa social que diferencia a Flatsforfriendz de un portal convencional.

Tablas:

connections (
  id, requester_id, addressee_id,
  status, -- 'pending' | 'accepted'
  created_at
)
Features: Buscar usuarios por nombre/username. Enviar solicitud de conexión. Aceptar/rechazar. Lista de friendz. En el perfil ajeno: sección de "amigos en común" (query SQL recursiva a 2 grados). En los listings: badge que muestra si el anunciante es un friendz o friend-of-friend. Feed opcional filtrado solo a listings de tu red.

Trust score visual: Badge en perfil que muestra si el usuario tiene friendz en común contigo. Esto es el diferenciador de confianza del producto.

Entregable: Red social funcional, friendz list, amigos en común visibles en perfiles y listings.

Sprint 8 — Templates + Instagram + push notifications (semanas 15–16)
La integración con Instagram es el canal de adquisición principal de Flatsforfriendz.

Sharing templates: Edge Function que genera una imagen PNG del listing usando @vercel/og o similar (HTML to canvas renderizado en edge). Template con foto del piso, precio, ciudad y QR/URL de deep link. El usuario descarga la imagen y la comparte en su Instagram Story. Deep link que abre la app directamente en ese listing.

Push notifications completas: expo-notifications + tabla push_tokens en Supabase. Edge Function (Deno) que envía notificaciones via Expo Push API cuando: llega nuevo mensaje, aceptan/deniegan una solicitud, alguien te envía solicitud de amistad. Gestión de preferencias de notificación por usuario.

Tabla:

push_tokens (user_id, token, platform, created_at)
Entregable: Template descargable funcional, deep links desde Instagram funcionando, todas las notificaciones push operativas.

Sprint 9 — QA, polishing y deploy (semanas 17–18)
QA: Testing E2E con Maestro (más sencillo que Detox para Expo). Tests unitarios de lógica crítica (RLS policies, filtros de búsqueda, request flow). Auditoría de seguridad de RLS (intentar acceder a datos ajenos). Performance profiling con Expo DevTools.

Polishing: Animaciones de transición con react-native-reanimated. Haptic feedback en acciones clave. Soporte offline básico (TanStack Query cache). Accesibilidad (accessibilityLabel en todos los elementos interactivos). Onboarding tutorial (3 pantallas con react-native-onboarding-swiper o custom).

Plan freemium — Superfriendz: Tabla subscriptions conectada a RevenueCat (que tiene SDK para Expo). Plan gratuito: 1 listing activo, solicitudes limitadas. Superfriendz (≈ modelo del original: 1 mes / 3 meses / 6 meses): listings ilimitados, estadísticas de vistas, badge destacado, acceso prioritario. Gate de features con RevenueCat.checkEntitlements().

Deploy: EAS Build para generar los binarios. Configuración de eas.json con perfiles dev/preview/production. Submit a App Store y Google Play con EAS Submit. OTA updates configurados con expo-updates para hotfixes sin pasar por review.

Entregable: App en stores, estable, con monetización básica funcionando.