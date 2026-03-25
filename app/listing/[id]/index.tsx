import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { MiniMapView } from "../../../src/components/ui/MiniMapView";
import { SendRequestSheet } from "../../../src/components/requests/SendRequestSheet";
import { UserAvatar } from "../../../src/components/ui/UserAvatar";
import type { PrivacyLevel } from "../../../src/core/PrivacyEngine";
import { useListing, useUpdateListingStatus, useDeleteListing } from "../../../src/hooks/useListings";
import { useProfile } from "../../../src/hooks/useProfile";
import { useProperty } from "../../../src/hooks/useProperties";
import { useMyRequestForListing, useReceivedRequests } from "../../../src/hooks/useRequests";
import { useConversations } from "../../../src/hooks/useConversations";
import { useMutualFriends } from "../../../src/hooks/useConnections";
import { useAuth } from "../../../src/providers/AuthProvider";
import { useHaptics } from "../../../src/hooks/useHaptics";
import { getSavedListingIds, toggleSavedListing } from "../../../src/lib/savedListings";
import { colors, fontSize, radius, spacing } from "../../../src/theme";
import { COMMON_AREA_LABELS, type CommonAreaType } from "../../../src/types/room";
import type { ListingWithProperty } from "../../../src/types/listingWithProperty";

const { width: SW } = Dimensions.get("window");

type BillState = "included" | "extra" | "none";
type PhotoItem = { url: string; area: CommonAreaType; label: string; icon: string };

type ListingDetailRow = ListingWithProperty & {
  city_name?: string | null;
  district_name?: string | null;
  room_name?: string | null;
  room_photos?: unknown;
  property_photos?: unknown;
  common_area_types?: CommonAreaType[] | null;
  owner_lives_here?: boolean;
  allows_pets?: boolean;
  allows_smoking?: boolean;
  has_quiet_hours?: boolean;
  no_parties?: boolean;
  bills_config?: unknown | null;
  property_total_m2?: number | null;
  property_total_rooms?: number | null;
  images?: string[] | null;
};

function BillDot({ state }: { state: BillState }) {
  const bg = state === "included" ? styles.billDotGreen : state === "extra" ? styles.billDotAmber : styles.billDotGray;
  return <View style={[styles.billDot, bg]} />;
}

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MetricCell({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metricCell}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function RuleTag({ label }: { label: string }) {
  return (
    <View style={styles.ruleTag}>
      <Text style={styles.ruleTagText}>{label}</Text>
    </View>
  );
}

function normalizeCommonAreaType(raw: string): CommonAreaType {
  const normalized = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  const map: Record<string, CommonAreaType> = {
    cocina: "cocina",
    bano: "bano",
    salon: "salon",
    terraza: "terraza",
    lavadero: "lavadero",
    garaje: "garaje",
    entrada: "entrada",
    otro: "otro",
  };
  return map[normalized] ?? "otro";
}

function normalizePropertyPhotos(raw: unknown): PhotoItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") {
        const meta = COMMON_AREA_LABELS.otro;
        return { url: item, area: "otro", label: meta.label, icon: meta.icon };
      }
      if (!item || typeof item !== "object") return null;
      const value = item as Record<string, unknown>;
      const url = typeof value.url === "string" ? value.url : "";
      if (!url) return null;
      const rawZone =
        (typeof value.zone === "string" && value.zone) ||
        (typeof value.room === "string" && value.room) ||
        (typeof value.caption === "string" && value.caption) ||
        "otro";
      const area = normalizeCommonAreaType(rawZone);
      const meta = COMMON_AREA_LABELS[area];
      return { url, area, label: meta.label, icon: meta.icon };
    })
    .filter((item): item is PhotoItem => !!item);
}

function normalizeStringPhotos(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && typeof (item as Record<string, unknown>).url === "string") {
        return String((item as Record<string, unknown>).url);
      }
      return "";
    })
    .filter(Boolean);
}

function ImageGalleryModal({ visible, images, initialIndex, onClose }: { visible: boolean; images: string[]; initialIndex: number; onClose: () => void }) {
  const listRef = useRef<FlatList<string>>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  useEffect(() => {
    if (!visible) return;
    setCurrentIndex(initialIndex);
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: initialIndex, animated: false });
    });
  }, [images, initialIndex, visible]);
  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / SW));
  }, []);
  if (!visible || images.length === 0) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.galleryBackdrop}>
        <FlatList
          ref={listRef}
          horizontal
          pagingEnabled
          data={images}
          keyExtractor={(item, i) => `${item}-${i}`}
          renderItem={({ item }) => <Image source={{ uri: item }} style={styles.galleryImage} resizeMode="contain" />}
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({ length: SW, offset: SW * index, index })}
        />
        <Pressable style={styles.galleryCloseBtn} onPress={onClose}>
          <Text style={styles.galleryCloseBtnText}>×</Text>
        </Pressable>
        {images.length > 1 && (
          <View style={styles.galleryCounter}>
            <Text style={styles.galleryCounterText}>{currentIndex + 1} / {images.length}</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

function ResidentRow({ userId, myId, isOwner }: { userId: string; myId: string | undefined; isOwner: boolean }) {
  const { data: profile } = useProfile(userId);
  const { data: mutual = [] } = useMutualFriends(myId, userId);
  const displayName = profile?.full_name ?? "Propietario";
  const mutualPreview = mutual.slice(0, 2).map((f) => (f.full_name ?? "").split(" ")[0]).filter(Boolean).join(", ");
  return (
    <Pressable style={styles.residentRow} onPress={() => router.push(`/profile/${userId}`)}>
      <UserAvatar avatarUrl={profile?.avatar_url} name={displayName} size="sm" verified={!!profile?.verified_at} />
      <View style={styles.residentInfo}>
        <View style={styles.residentNameRow}>
          <Text style={styles.residentName}>{displayName}</Text>
          {isOwner && <View style={styles.ownerBadge}><Text style={styles.ownerBadgeText}>Propietario</Text></View>}
        </View>
        <Text style={styles.residentMutual}>
          {mutual.length > 0 ? `${mutual.length} ${mutual.length === 1 ? "amigo" : "amigos"} en comun${mutualPreview ? ` - ${mutualPreview}` : ""}` : "Sin amigos en comun"}
        </Text>
      </View>
      <Text style={styles.residentArrow}>{">"}</Text>
    </Pressable>
  );
}

function formatPublishedAgo(isoDate: string) {
  const published = new Date(isoDate).getTime();
  if (Number.isNaN(published)) return "Sin dato";
  const diffMs = Date.now() - published;
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Hace 1 dia";
  if (diffDays < 30) return `Hace ${diffDays} dias`;
  const months = Math.floor(diffDays / 30);
  if (months === 1) return "Hace 1 mes";
  if (months < 12) return `Hace ${months} meses`;
  const years = Math.floor(months / 12);
  return years === 1 ? "Hace 1 ano" : `Hace ${years} anos`;
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const myId = session?.user?.id;
  const haptics = useHaptics();
  const { data: listing, isLoading } = useListing(id);
  const { data: property } = useProperty(listing?.property_id ?? undefined);
  const updateStatus = useUpdateListingStatus();
  const deleteListing = useDeleteListing();
  const detail = listing as ListingDetailRow | undefined;
  const isOwner = myId === detail?.owner_id;
  const mapPrivacyLevel: PrivacyLevel = isOwner ? 3 : 1;
  const [photoIndex, setPhotoIndex] = useState(0);
  const [requestSheetOpen, setRequestSheetOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const { data: myRequest } = useMyRequestForListing(id, myId);
  const { data: receivedRequests = [] } = useReceivedRequests(myId);
  const { data: conversations = [] } = useConversations(myId);
  const linkedConversation = conversations.find((c) => c.listing_id === id);
  const listingRequestsCount = receivedRequests.filter((r) => r.listing_id === id).length;
  const pendingRequestsCount = receivedRequests.filter((r) => r.listing_id === id && r.status === "pending").length;
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / SW));
  }, []);

  useEffect(() => {
    if (!id) return;
    getSavedListingIds().then((ids) => setIsSaved(ids.includes(id)));
  }, [id]);

  const openGallery = useCallback((nextImages: string[], index: number) => {
    if (nextImages.length === 0) return;
    setGalleryImages(nextImages);
    setGalleryIndex(index);
    setGalleryVisible(true);
  }, []);

  if (isLoading || !detail) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const propertyPhotos = normalizePropertyPhotos(detail.property_photos ?? property?.images ?? []);
  const roomImages = normalizeStringPhotos(detail.room_photos ?? detail.images ?? []);
  const heroImages = roomImages.length > 0 ? roomImages : propertyPhotos.map((item) => item.url);
  const billStates = (detail.bills_config ?? property?.bills_config) as Record<"agua" | "luz" | "gas" | "internet" | "limpieza" | "comunidad" | "calefaccion", BillState> | null;
  const billItems = [
    { key: "agua", label: "Agua" }, { key: "luz", label: "Luz" }, { key: "gas", label: "Gas" },
    { key: "internet", label: "Internet" }, { key: "limpieza", label: "Limpieza" }, { key: "comunidad", label: "Comunidad" },
    { key: "calefaccion", label: "Calefacción" },
  ] as const;
  const rules: string[] = [];
  if (detail.allows_pets) rules.push("Mascotas permitidas");
  if (detail.allows_smoking) rules.push("Fumadores permitidos");
  if (detail.has_quiet_hours) rules.push("Horas de silencio");
  if (detail.no_parties) rules.push("Sin fiestas");
  const minStayLabel = detail.min_stay_months ? (detail.min_stay_months >= 12 ? "1 ano min." : `${detail.min_stay_months}m min.`) : "Flexible";
  const statusLabel = detail.status === "active" ? "Activo" : detail.status === "paused" ? "Pausado" : "Archivado";
  const locationLabel = [detail.district_name ?? detail.district, detail.city_name ?? detail.city, detail.postal_code].filter(Boolean).join(" · ");

  const handleStatusChange = (status: "active" | "paused" | "rented") => {
    Alert.alert("Cambiar estado", `Marcar como "${status}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Confirmar", onPress: async () => { await updateStatus.mutateAsync({ id: detail.id, status }); router.back(); } },
    ]);
  };

  const handleDelete = () => {
    Alert.alert("Eliminar anuncio", "Esta accion no se puede deshacer.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => { await deleteListing.mutateAsync(detail.id); router.replace("/(tabs)/listings"); } },
    ]);
  };

  const handleToggleSaved = async () => {
    const { saved } = await toggleSavedListing(detail.id);
    setIsSaved(saved);
  };

  const handleShareListing = async () => {
    try {
      const url = `homimatch://listing/${detail.id}`;
      const message = `${detail.title} - ${detail.price} EUR/mes en ${detail.city_name ?? detail.city ?? ""}\n${url}`;
      await Share.share({ message });
    } catch {
      Alert.alert("Error", "No se pudo compartir el anuncio.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        <View style={styles.heroWrap}>
          {heroImages.length > 0 ? (
            <FlatList
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              data={heroImages}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item, index }) => <Pressable onPress={() => openGallery(heroImages, index)}><Image source={{ uri: item }} style={styles.heroImage} /></Pressable>}
              onScroll={onScroll}
              scrollEventThrottle={16}
            />
          ) : (
            <View style={styles.heroPlaceholder}><Text style={{ fontSize: 64 }}>HOME</Text></View>
          )}
          <Pressable style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backBtnText}>{"<"}</Text></Pressable>
          <Pressable style={[styles.heartBtn, isSaved && styles.heartBtnActive]} onPress={handleToggleSaved}>
            <Text style={[styles.heartBtnIcon, isSaved && styles.heartBtnIconActive]}>{isSaved ? "♥" : "♡"}</Text>
          </Pressable>
          {heroImages.length > 1 && <View style={styles.photoCounter}><Text style={styles.photoCounterText}>{photoIndex + 1} / {heroImages.length}</Text></View>}
          <View style={styles.priceOverlay}><View style={styles.priceBadge}><Text style={styles.priceBadgeText}>{detail.price} €/mes</Text></View></View>
        </View>

        <View style={styles.body}>
          <View>
            <Text style={styles.heroSubMeta}>{detail.room_name ?? "Habitación"}{detail.size_m2 ? ` · ${detail.size_m2} m²` : ""}</Text>
            <Text style={styles.title}>{detail.title}</Text>
            <Text style={styles.titleMeta}>📍 {locationLabel}</Text>
            <View style={styles.contextBadges}>
              <View style={[styles.contextBadge, detail.status === "active" ? styles.contextBadgeActive : detail.status === "paused" ? styles.contextBadgePaused : styles.contextBadgeArchived]}>
                <Text style={[styles.contextBadgeText, detail.status === "active" ? styles.contextBadgeTextActive : detail.status === "paused" ? styles.contextBadgeTextPaused : styles.contextBadgeTextArchived]}>{statusLabel}</Text>
              </View>
              {isOwner && <View style={[styles.contextBadge, styles.contextBadgePending]}><Text style={[styles.contextBadgeText, styles.contextBadgeTextPending]}>{pendingRequestsCount} solicitudes pendientes</Text></View>}
              {detail.owner_lives_here && <View style={[styles.contextBadge, styles.contextBadgeOwner]}><Text style={[styles.contextBadgeText, styles.contextBadgeTextOwner]}>El propietario vive aquí</Text></View>}
            </View>
          </View>

          <View style={styles.statsGrid}>
            <StatCell value={detail.size_m2 ? `${detail.size_m2}` : "—"} label="m² hab." />
            <StatCell value={property?.total_m2 ? `${property.total_m2}` : detail.property_total_m2 ? `${detail.property_total_m2}` : "—"} label="m² piso" />
            <StatCell value={detail.property_total_rooms ? String(detail.property_total_rooms) : detail.rooms ? String(detail.rooms) : "—"} label="habitaciones" />
            <StatCell value={minStayLabel} label="mínimo" />
          </View>

          {detail.common_area_types && detail.common_area_types.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ZONAS COMUNES</Text>
              <View style={styles.rulesRow}>
                {detail.common_area_types.map((area) => {
                  const meta = COMMON_AREA_LABELS[area] ?? COMMON_AREA_LABELS.otro;
                  return <RuleTag key={area} label={`${meta.icon} ${meta.label}`} />;
                })}
              </View>
            </View>
          )}

          {propertyPhotos.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>FOTOS DEL PISO</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScrollView}>
                <View style={styles.photosRow}>
                  {propertyPhotos.map((item, i) => (
                    <Pressable key={item.url + i} style={styles.photoThumbWrap} onPress={() => openGallery(propertyPhotos.map((p) => p.url), i)}>
                      <Image source={{ uri: item.url }} style={styles.photoThumbImg} />
                      <View style={styles.photoThumbLabel}><Text style={styles.photoThumbLabelText} numberOfLines={1}>{item.icon} {item.label}</Text></View>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {roomImages.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>FOTOS DE LA HABITACIÓN</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScrollView}>
                <View style={styles.photosRow}>
                  {roomImages.map((uri, i) => (
                    <Pressable key={uri + i} style={styles.photoThumbWrap} onPress={() => openGallery(roomImages, i)}>
                      <Image source={{ uri }} style={styles.photoThumbImg} />
                      <View style={[styles.photoThumbLabel, styles.photoThumbLabelRoom]}><Text style={[styles.photoThumbLabelText, styles.photoThumbLabelTextRoom]}>Habitación</Text></View>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {billStates && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>GASTOS</Text>
              <View style={styles.billsGrid}>
                {billItems.map(({ key, label }) => {
                  const state = billStates[key];
                  if (!state) return null;
                  return <View key={key} style={styles.billRow}><BillDot state={state} /><Text style={styles.billLabel}>{label} {state === "included" ? "incl." : state === "extra" ? "aparte" : "no hay"}</Text></View>;
                })}
              </View>
            </View>
          )}

          {detail.lat != null && detail.lng != null && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ZONA APROXIMADA</Text>
              <MiniMapView lat={detail.lat} lng={detail.lng} privacyLevel={mapPrivacyLevel} height={180} />
            </View>
          )}

          {rules.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>NORMAS</Text>
              <View style={styles.rulesRow}>{rules.map((r) => <RuleTag key={r} label={r} />)}</View>
            </View>
          )}

          {detail.owner_id && !isOwner && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>QUIÉN VIVE AQUÍ</Text>
              <ResidentRow userId={detail.owner_id} myId={myId} isOwner />
            </View>
          )}

          {isOwner && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>MÉTRICAS DEL ANUNCIO</Text>
              <View style={styles.metricsGrid}>
                <MetricCell value="Sin dato" label="Visitas" />
                <MetricCell value={String(listingRequestsCount)} label="Solicitudes" />
                <MetricCell value={formatPublishedAgo(detail.created_at)} label="Publicado" />
              </View>
            </View>
          )}

          {detail.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DESCRIPCIÓN</Text>
              <Text style={styles.description}>{detail.description}</Text>
            </View>
          )}

          {isOwner && (
            <View style={styles.ownerActions}>
              <Pressable style={styles.ownerPrimaryBtn} onPress={() => router.push(`/listing/${detail.id}/candidates`)}>
                <Text style={styles.ownerPrimaryBtnText}>Ver candidatos</Text>
              </Pressable>
              <Pressable style={styles.ownerActionBtn} onPress={() => router.push(`/listing/${detail.id}/edit`)}>
                <Text style={styles.ownerActionText}>Editar</Text>
              </Pressable>
              {detail.status === "active" && <Pressable style={styles.ownerActionBtn} onPress={() => handleStatusChange("paused")}><Text style={styles.ownerActionText}>Pausar</Text></Pressable>}
              {detail.status === "paused" && <Pressable style={styles.ownerActionBtn} onPress={() => handleStatusChange("active")}><Text style={styles.ownerActionText}>Activar</Text></Pressable>}
              <Pressable style={[styles.ownerActionBtn, styles.ownerActionDanger]} onPress={handleDelete}><Text style={[styles.ownerActionText, { color: colors.error }]}>Eliminar</Text></Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {!isOwner && (
        <View style={styles.footer}>
          {!myId ? (
            <Pressable style={styles.ctaBtn} onPress={() => router.push("/login")}><Text style={styles.ctaBtnText}>Solicitar habitación</Text></Pressable>
          ) : !myRequest ? (
            <Pressable style={styles.ctaBtn} onPress={() => { haptics.medium(); setRequestSheetOpen(true); }}><Text style={styles.ctaBtnText}>Solicitar habitación</Text></Pressable>
          ) : null}
          {myRequest?.status === "pending" && <View style={[styles.ctaBtn, { backgroundColor: colors.warningLight }]}><Text style={[styles.ctaBtnText, { color: colors.warning }]}>Solicitud enviada</Text></View>}
          {(myRequest?.status === "offered" || myRequest?.status === "accepted" || myRequest?.status === "assigned") && linkedConversation && (
            <Pressable style={styles.ctaBtn} onPress={() => router.push(`/conversation/${linkedConversation.id}`)}><Text style={styles.ctaBtnText}>Abrir chat</Text></Pressable>
          )}
          {myRequest?.status === "denied" && <View style={[styles.ctaBtn, { backgroundColor: colors.errorLight }]}><Text style={[styles.ctaBtnText, { color: colors.error }]}>Solicitud no aceptada</Text></View>}
          <Pressable style={styles.footerIconBtn} onPress={handleShareListing}><Text style={styles.footerIconText}>⤴</Text></Pressable>
          {myId && (
            <SendRequestSheet
              visible={requestSheetOpen}
              onClose={() => setRequestSheetOpen(false)}
              listingId={detail.id}
              listingTitle={detail.title}
              ownerId={detail.owner_id}
              requesterId={myId}
            />
          )}
        </View>
      )}

      <ImageGalleryModal visible={galleryVisible} images={galleryImages} initialIndex={galleryIndex} onClose={() => setGalleryVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  heroWrap: { width: SW, height: 320, backgroundColor: colors.gray100 },
  heroImage: { width: SW, height: 320, resizeMode: "cover" },
  heroPlaceholder: { width: SW, height: 320, backgroundColor: colors.primaryLight, justifyContent: "center", alignItems: "center" },
  backBtn: { position: "absolute", top: 50, left: spacing[4], width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", alignItems: "center" },
  backBtnText: { color: colors.white, fontSize: 22, fontWeight: "700", lineHeight: 26 },
  heartBtn: { position: "absolute", top: 50, right: spacing[4], width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.9)", justifyContent: "center", alignItems: "center" },
  heartBtnActive: { backgroundColor: colors.errorLight },
  heartBtnIcon: { fontSize: 18, color: colors.textSecondary, lineHeight: 20 },
  heartBtnIconActive: { color: colors.error },
  photoCounter: { position: "absolute", top: 50, right: 60, backgroundColor: "rgba(0,0,0,0.45)", borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  photoCounterText: { color: colors.white, fontSize: fontSize.xs, fontWeight: "600" },
  priceOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, padding: spacing[4], paddingBottom: spacing[4] },
  priceBadge: { alignSelf: "flex-start", backgroundColor: colors.success, borderRadius: radius.full, paddingHorizontal: spacing[4], paddingVertical: spacing[2] },
  priceBadgeText: { fontSize: fontSize.lg, fontWeight: "800", color: colors.white },
  body: { padding: spacing[4], gap: spacing[4] },
  heroSubMeta: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing[1] },
  title: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text },
  titleMeta: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  contextBadges: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2], marginTop: spacing[2] },
  contextBadge: { borderRadius: radius.full, borderWidth: 1, paddingHorizontal: spacing[3], paddingVertical: 4 },
  contextBadgeText: { fontSize: fontSize.xs, fontWeight: "700" },
  contextBadgeActive: { backgroundColor: colors.successLight, borderColor: colors.success + "44" },
  contextBadgeTextActive: { color: colors.success },
  contextBadgePaused: { backgroundColor: colors.warningLight, borderColor: colors.warning + "44" },
  contextBadgeTextPaused: { color: colors.warning },
  contextBadgeArchived: { backgroundColor: colors.gray100, borderColor: colors.gray300 },
  contextBadgeTextArchived: { color: colors.gray600 },
  contextBadgePending: { backgroundColor: colors.primaryLight, borderColor: colors.primary + "44" },
  contextBadgeTextPending: { color: colors.primaryDark },
  contextBadgeOwner: { backgroundColor: colors.verifyLight, borderColor: colors.verify + "44" },
  contextBadgeTextOwner: { color: colors.verify },
  statsGrid: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  statCell: { flex: 1, alignItems: "center", paddingVertical: spacing[3], borderRightWidth: 1, borderRightColor: colors.border },
  statValue: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  statLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  section: { gap: spacing[2] },
  sectionTitle: { fontSize: fontSize.xs, fontWeight: "700", color: colors.textTertiary, letterSpacing: 0.5 },
  billsGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: spacing[3], columnGap: spacing[2] },
  billRow: { flexDirection: "row", alignItems: "center", gap: spacing[2], width: "47%", paddingVertical: 2 },
  billDot: { width: 9, height: 9, borderRadius: 4.5 },
  billDotGreen: { backgroundColor: colors.success },
  billDotAmber: { backgroundColor: colors.warning },
  billDotGray: { backgroundColor: colors.gray300 },
  billLabel: { fontSize: fontSize.sm, color: colors.text },
  rulesRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  ruleTag: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: spacing[3], paddingVertical: 4, backgroundColor: colors.surface },
  ruleTagText: { fontSize: fontSize.sm, color: colors.text },
  residentRow: { flexDirection: "row", alignItems: "center", gap: spacing[3], paddingVertical: spacing[2], borderBottomWidth: 1, borderBottomColor: colors.border },
  residentInfo: { flex: 1 },
  residentNameRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  residentName: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
  ownerBadge: { backgroundColor: colors.primaryLight, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  ownerBadgeText: { fontSize: 10, fontWeight: "700", color: colors.primary },
  residentMutual: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  residentArrow: { fontSize: 20, color: colors.textTertiary },
  metricsGrid: { flexDirection: "row", gap: spacing[2] },
  metricCell: { flex: 1, alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing[3] },
  metricValue: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  metricLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  description: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 22 },
  ownerActions: { gap: spacing[2], marginTop: spacing[2] },
  ownerPrimaryBtn: { backgroundColor: colors.text, borderRadius: radius.md, borderWidth: 1, borderColor: colors.text, paddingVertical: spacing[3], alignItems: "center" },
  ownerPrimaryBtnText: { fontWeight: "700", color: colors.white, fontSize: fontSize.sm },
  ownerActionBtn: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing[3], alignItems: "center" },
  ownerActionDanger: { marginTop: spacing[2], borderColor: colors.errorLight, backgroundColor: colors.errorLight },
  ownerActionText: { fontWeight: "600", color: colors.text, fontSize: fontSize.sm },
  footer: { flexDirection: "row", gap: spacing[2], paddingHorizontal: spacing[4], paddingVertical: spacing[3], backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  ctaBtn: { flex: 1, backgroundColor: colors.text, borderRadius: radius.full, paddingVertical: spacing[4], alignItems: "center" },
  ctaBtnText: { color: colors.white, fontWeight: "700", fontSize: fontSize.md },
  footerIconBtn: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: colors.border, justifyContent: "center", alignItems: "center" },
  footerIconText: { fontSize: 18, color: colors.textSecondary },
  photosScrollView: { marginHorizontal: -spacing[4] },
  photosRow: { flexDirection: "row", gap: spacing[2], paddingHorizontal: spacing[4] },
  photoThumbWrap: { width: 110, height: 110, borderRadius: radius.lg, overflow: "hidden", position: "relative" },
  photoThumbImg: { width: "100%", height: "100%", resizeMode: "cover" },
  photoThumbLabel: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.success + "cc", paddingVertical: 4, paddingHorizontal: 6, alignItems: "center" },
  photoThumbLabelText: { color: colors.white, fontSize: 11, fontWeight: "700" },
  photoThumbLabelRoom: { backgroundColor: colors.purple + "cc" },
  photoThumbLabelTextRoom: { color: colors.white },
  galleryBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.96)", justifyContent: "center" },
  galleryImage: { width: SW, height: "100%" },
  galleryCloseBtn: { position: "absolute", top: 50, right: spacing[4], width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.14)", justifyContent: "center", alignItems: "center" },
  galleryCloseBtnText: { color: colors.white, fontSize: 28, lineHeight: 30 },
  galleryCounter: { position: "absolute", bottom: spacing[6], alignSelf: "center", backgroundColor: "rgba(255,255,255,0.14)", borderRadius: radius.full, paddingHorizontal: spacing[3], paddingVertical: spacing[2] },
  galleryCounterText: { color: colors.white, fontSize: fontSize.sm, fontWeight: "700" },
});
