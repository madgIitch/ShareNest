import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
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
import { useMyRequestForListing } from "../../../src/hooks/useRequests";
import { useConversations } from "../../../src/hooks/useConversations";
import { useMutualFriends } from "../../../src/hooks/useConnections";
import { useAuth } from "../../../src/providers/AuthProvider";
import { useHaptics } from "../../../src/hooks/useHaptics";
import { colors, fontSize, radius, spacing } from "../../../src/theme";

const { width: SW } = Dimensions.get("window");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function BillDot({ included }: { included: boolean }) {
  return (
    <View style={[styles.billDot, included ? styles.billDotGreen : styles.billDotGray]} />
  );
}

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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

function ResidentRow({
  userId,
  myId,
  isOwner,
}: {
  userId: string;
  myId: string | undefined;
  isOwner: boolean;
}) {
  const { data: profile } = useProfile(userId);
  const { data: mutual = [] } = useMutualFriends(myId, userId);

  if (!profile) return null;

  return (
    <Pressable
      style={styles.residentRow}
      onPress={() => router.push(`/profile/${userId}`)}
    >
      <View style={{ position: "relative" }}>
        <UserAvatar
          avatarUrl={profile.avatar_url}
          name={profile.full_name}
          size="sm"
          verified={!!profile.verified_at}
        />
      </View>
      <View style={styles.residentInfo}>
        <View style={styles.residentNameRow}>
          <Text style={styles.residentName}>{profile.full_name ?? "Usuario"}</Text>
          {isOwner && (
            <View style={styles.ownerBadge}>
              <Text style={styles.ownerBadgeText}>Propietario</Text>
            </View>
          )}
        </View>
        <Text style={styles.residentMutual}>
          {mutual.length > 0
            ? `${mutual.length} ${mutual.length === 1 ? "amigo" : "amigos"} en común · ${mutual
                .slice(0, 2)
                .map((f) => (f.full_name ?? "").split(" ")[0])
                .join(", ")}`
            : "Sin amigos en común"}
        </Text>
      </View>
      <Text style={styles.residentArrow}>›</Text>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const myId = session?.user?.id;
  const haptics = useHaptics();

  const { data: listing, isLoading } = useListing(id);
  const { data: owner } = useProfile(listing?.owner_id);
  const updateStatus = useUpdateListingStatus();
  const deleteListing = useDeleteListing();

  const isOwner = myId === listing?.owner_id;
  const privacyLevel: PrivacyLevel = isOwner ? 3 : 1;

  const [photoIndex, setPhotoIndex] = useState(0);
  const [requestSheetOpen, setRequestSheetOpen] = useState(false);

  const { data: myRequest } = useMyRequestForListing(id, myId);
  const { data: conversations = [] } = useConversations(myId);
  const linkedConversation = conversations.find((c) => c.listing_id === id);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
      setPhotoIndex(idx);
    },
    [],
  );

  if (isLoading || !listing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const images: string[] = listing.images ?? [];

  // Bills from bills_config or fallback to current schema
  const bills = listing.property_id
    ? {} // will come from property once migration runs
    : {
        Agua: false,
        Luz: false,
        Gas: false,
        Internet: false,
        Limpieza: false,
        Comunidad: false,
      };

  // House rules from listing fields
  const rules: string[] = [];
  if (!listing.smokers_allowed) rules.push("No fumadores");
  if (listing.pets_allowed) rules.push("Mascotas OK");
  if (!listing.pets_allowed) rules.push("Sin mascotas");

  // Min stay label
  const minStayLabel = listing.min_stay_months
    ? listing.min_stay_months >= 12
      ? "1 año mín."
      : `${listing.min_stay_months}m mín.`
    : "Flexible";

  const handleStatusChange = (status: "active" | "paused" | "rented") => {
    Alert.alert("Cambiar estado", `¿Marcar como "${status}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Confirmar",
        onPress: async () => {
          await updateStatus.mutateAsync({ id: listing.id, status });
          router.back();
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert("Eliminar anuncio", "Esta acción no se puede deshacer.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deleteListing.mutateAsync(listing.id);
          router.replace("/(tabs)/listings");
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        {/* ── Hero fotográfico con precio overlay ── */}
        <View style={styles.heroWrap}>
          {images.length > 0 ? (
            <FlatList
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              data={images}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.heroImage} />
              )}
              onScroll={onScroll}
              scrollEventThrottle={16}
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={{ fontSize: 64 }}>🏠</Text>
            </View>
          )}

          {/* Back button */}
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>‹</Text>
          </Pressable>

          {/* Wishlist button */}
          <Pressable style={styles.heartBtn}>
            <Text style={{ fontSize: 20 }}>♡</Text>
          </Pressable>

          {/* Photo counter */}
          {images.length > 1 && (
            <View style={styles.photoCounter}>
              <Text style={styles.photoCounterText}>
                {photoIndex + 1} / {images.length}
              </Text>
            </View>
          )}

          {/* Price + location overlay */}
          <View style={styles.priceOverlay}>
            <Text style={styles.priceOverlayAmount}>
              {listing.price} €/mes
            </Text>
            <Text style={styles.priceOverlayLocation}>
              {listing.street
                ? `${listing.street} · ${listing.city}`
                : `${listing.district ?? listing.city}`}
            </Text>
          </View>
        </View>

        {/* ── Body ── */}
        <View style={styles.body}>
          {/* Title + metadata */}
          <View>
            <Text style={styles.title}>{listing.title}</Text>
            <Text style={styles.titleMeta}>
              {[
                listing.street ? `${listing.street}` : null,
                listing.status === "active" ? "Disponible" : null,
                listing.available_from ? `Desde ${listing.available_from}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </View>

          {/* Stats grid 4 cols */}
          <View style={styles.statsGrid}>
            <StatCell
              value={listing.size_m2 ? `${listing.size_m2} m²` : "—"}
              label="Habitación"
            />
            <StatCell
              value="—"
              label="Piso total"
            />
            <StatCell
              value={listing.rooms ? String(listing.rooms) : "—"}
              label="Compañeros"
            />
            <StatCell value={minStayLabel} label="Estancia" />
          </View>

          {/* Gastos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>GASTOS</Text>
            <View style={styles.billsGrid}>
              {[
                { label: "Agua", included: listing.is_furnished },
                { label: "Luz", included: listing.is_furnished },
                { label: "Internet", included: listing.is_furnished },
                { label: "Gas", included: false },
                { label: "Limpieza", included: false },
                { label: "Comunidad", included: listing.is_furnished },
              ].map(({ label, included }) => (
                <View key={label} style={styles.billRow}>
                  <BillDot included={included} />
                  <Text style={styles.billLabel}>
                    {label} {included ? "incl." : "aparte"}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Zona aproximada — mapa */}
          {listing.lat != null && listing.lng != null && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ZONA APROXIMADA</Text>
              <MiniMapView
                lat={listing.lat}
                lng={listing.lng}
                privacyLevel={privacyLevel}
                height={180}
              />
            </View>
          )}

          {/* Normas */}
          {rules.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>NORMAS</Text>
              <View style={styles.rulesRow}>
                {rules.map((r) => (
                  <RuleTag key={r} label={r} />
                ))}
              </View>
            </View>
          )}

          {/* Quién vive aquí */}
          {listing.owner_id && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>QUIÉN VIVE AQUÍ</Text>
              <ResidentRow
                userId={listing.owner_id}
                myId={myId}
                isOwner={true}
              />
            </View>
          )}

          {/* Description */}
          {listing.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DESCRIPCIÓN</Text>
              <Text style={styles.description}>{listing.description}</Text>
            </View>
          )}

          {/* Owner actions */}
          {isOwner && (
            <View style={styles.ownerActions}>
              <Pressable
                style={styles.ownerActionBtn}
                onPress={() => router.push(`/listing/${listing.id}/edit`)}
              >
                <Text style={styles.ownerActionText}>✏️ Editar</Text>
              </Pressable>
              <Pressable
                style={styles.ownerActionBtn}
                onPress={() => router.push(`/listing/${listing.id}/candidates`)}
              >
                <Text style={styles.ownerActionText}>👥 Ver candidatos</Text>
              </Pressable>
              {listing.status === "active" && (
                <Pressable
                  style={styles.ownerActionBtn}
                  onPress={() => handleStatusChange("paused")}
                >
                  <Text style={styles.ownerActionText}>⏸ Pausar</Text>
                </Pressable>
              )}
              {listing.status === "paused" && (
                <Pressable
                  style={styles.ownerActionBtn}
                  onPress={() => handleStatusChange("active")}
                >
                  <Text style={styles.ownerActionText}>▶ Activar</Text>
                </Pressable>
              )}
              <Pressable style={[styles.ownerActionBtn, styles.ownerActionDanger]} onPress={handleDelete}>
                <Text style={[styles.ownerActionText, { color: colors.error }]}>🗑 Eliminar</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── CTA anclado en footer ── */}
      {!isOwner && myId && (
        <View style={styles.footer}>
          {!myRequest && (
            <Pressable
              style={styles.ctaBtn}
              onPress={() => {
                haptics.medium();
                setRequestSheetOpen(true);
              }}
            >
              <Text style={styles.ctaBtnText}>Solicitar habitación</Text>
            </Pressable>
          )}
          {myRequest?.status === "pending" && (
            <View style={[styles.ctaBtn, { backgroundColor: colors.warningLight }]}>
              <Text style={[styles.ctaBtnText, { color: colors.warning }]}>
                ⏳ Solicitud enviada
              </Text>
            </View>
          )}
          {myRequest?.status === "accepted" && linkedConversation && (
            <Pressable
              style={styles.ctaBtn}
              onPress={() => router.push(`/conversation/${linkedConversation.id}`)}
            >
              <Text style={styles.ctaBtnText}>💬 Abrir chat</Text>
            </Pressable>
          )}
          {myRequest?.status === "denied" && (
            <View style={[styles.ctaBtn, { backgroundColor: colors.errorLight }]}>
              <Text style={[styles.ctaBtnText, { color: colors.error }]}>
                Solicitud no aceptada
              </Text>
            </View>
          )}

          <Pressable style={styles.footerIconBtn}>
            <Text style={styles.footerIconText}>★</Text>
          </Pressable>
          <Pressable style={styles.footerIconBtn}>
            <Text style={styles.footerIconText}>↗</Text>
          </Pressable>

          <SendRequestSheet
            visible={requestSheetOpen}
            onClose={() => setRequestSheetOpen(false)}
            listingId={listing.id}
            listingTitle={listing.title}
            ownerId={listing.owner_id}
            requesterId={myId}
          />
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  // Hero
  heroWrap: { width: SW, height: 320, backgroundColor: colors.gray100 },
  heroImage: { width: SW, height: 320, resizeMode: "cover" },
  heroPlaceholder: {
    width: SW,
    height: 320,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  backBtn: {
    position: "absolute",
    top: 50,
    left: spacing[4],
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  backBtnText: { color: colors.white, fontSize: 22, fontWeight: "700", lineHeight: 26 },
  heartBtn: {
    position: "absolute",
    top: 50,
    right: spacing[4],
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  photoCounter: {
    position: "absolute",
    top: 50,
    right: 60,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  photoCounterText: { color: colors.white, fontSize: fontSize.xs, fontWeight: "600" },
  priceOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing[4],
    paddingBottom: spacing[5],
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  priceOverlayAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.white,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  priceOverlayLocation: {
    fontSize: fontSize.sm,
    color: colors.white,
    opacity: 0.9,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Body
  body: { padding: spacing[4], gap: spacing[4] },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.text,
  },
  titleMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Stats grid
  statsGrid: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[3],
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  statValue: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  statLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },

  // Section
  section: { gap: spacing[2] },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },

  // Bills
  billsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  billRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    width: "47%",
  },
  billDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  billDotGreen: { backgroundColor: colors.success },
  billDotGray: { backgroundColor: colors.gray300 },
  billLabel: { fontSize: fontSize.sm, color: colors.text },

  // Rules
  rulesRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  ruleTag: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
    backgroundColor: colors.surface,
  },
  ruleTagText: { fontSize: fontSize.sm, color: colors.text },

  // Residents
  residentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  residentInfo: { flex: 1 },
  residentNameRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  residentName: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
  ownerBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  ownerBadgeText: { fontSize: 10, fontWeight: "700", color: colors.primary },
  residentMutual: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  residentArrow: { fontSize: 20, color: colors.textTertiary },

  // Description
  description: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 22 },

  // Owner actions
  ownerActions: { gap: spacing[2], marginTop: spacing[2] },
  ownerActionBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing[3],
    alignItems: "center",
  },
  ownerActionDanger: { borderColor: colors.errorLight, backgroundColor: colors.errorLight },
  ownerActionText: { fontWeight: "600", color: colors.text, fontSize: fontSize.sm },

  // Footer
  footer: {
    flexDirection: "row",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ctaBtn: {
    flex: 1,
    backgroundColor: colors.text,
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    alignItems: "center",
  },
  ctaBtnText: { color: colors.white, fontWeight: "700", fontSize: fontSize.md },
  footerIconBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  footerIconText: { fontSize: 18, color: colors.textSecondary },
});
