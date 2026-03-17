import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Sharing from "expo-sharing";
import { shareService } from "../../../src/services/shareService";

import { UserAvatar } from "../../../src/components/ui/UserAvatar";
import { TagBadge } from "../../../src/components/ui/TagBadge";
import { PriceTag } from "../../../src/components/ui/PriceTag";
import { SendRequestSheet } from "../../../src/components/requests/SendRequestSheet";
import { useListing, useUpdateListingStatus, useDeleteListing } from "../../../src/hooks/useListings";
import { useProfile } from "../../../src/hooks/useProfile";
import { useMyRequestForListing } from "../../../src/hooks/useRequests";
import { useConversations } from "../../../src/hooks/useConversations";
import { useAuth } from "../../../src/providers/AuthProvider";
import { useHaptics } from "../../../src/hooks/useHaptics";
import { colors, fontSize, radius, spacing } from "../../../src/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const myId = session?.user?.id;

  const { data: listing, isLoading } = useListing(id);
  const { data: owner } = useProfile(listing?.owner_id);
  const updateStatus = useUpdateListingStatus();
  const deleteListing = useDeleteListing();

  const isOwner = myId === listing?.owner_id;
  const [sharing, setSharing] = useState(false);
  const haptics = useHaptics();

  const handleShare = async () => {
    if (!listing) return;
    setSharing(true);
    try {
      const path = await shareService.getListingShareImageFile(listing.id);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, { mimeType: "image/png", dialogTitle: "Compartir en Instagram" });
      }
    } catch {
      Alert.alert("Error", "No se pudo generar la imagen. Inténtalo de nuevo.");
    } finally {
      setSharing(false);
    }
  };

  // Request state (for non-owners)
  const { data: myRequest } = useMyRequestForListing(id, myId);
  const { data: conversations = [] } = useConversations(myId);
  const [requestSheetOpen, setRequestSheetOpen] = useState(false);

  // Find conversation linked to this listing (if request accepted)
  const linkedConversation = conversations.find((c) => c.listing_id === id);

  if (isLoading || !listing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const images: string[] = listing.images ?? [];

  const handleStatusChange = (status: "active" | "paused" | "rented") => {
    Alert.alert(
      "Cambiar estado",
      `¿Marcar como "${status}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            await updateStatus.mutateAsync({ id: listing.id, status });
            router.back();
          },
        },
      ],
    );
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Carrusel de fotos */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.carousel}
      >
        {images.length > 0 ? (
          images.map((url, i) => (
            <Image key={i} source={{ uri: url }} style={styles.carouselImage} />
          ))
        ) : (
          <View style={styles.carouselPlaceholder}>
            <Text style={{ fontSize: 48 }}>🏠</Text>
          </View>
        )}
      </ScrollView>

      {/* Indicador de fotos */}
      {images.length > 1 && (
        <View style={styles.dots}>
          {images.map((_, i) => (
            <View key={i} style={styles.dot} />
          ))}
        </View>
      )}

      <View style={styles.body}>
        {/* Status badge */}
        {listing.status !== "active" && (
          <TagBadge
            label={listing.status === "paused" ? "Pausado" : "Alquilado"}
            variant={listing.status === "paused" ? "warning" : "success"}
          />
        )}

        {/* Tipo */}
        <TagBadge
          label={listing.type === "offer" ? "Ofrezco habitación" : "Busco habitación"}
          variant="primary"
        />

        <Text style={styles.title}>{listing.title}</Text>

        <View style={styles.locationRow}>
          <Text style={styles.location}>
            📍 {listing.city}{listing.district ? `, ${listing.district}` : ""}
          </Text>
        </View>

        <PriceTag amount={listing.price} size="lg" />

        {/* Detalles */}
        <View style={styles.details}>
          {listing.rooms && (
            <View style={styles.detailItem}>
              <Text style={styles.detailValue}>{listing.rooms}</Text>
              <Text style={styles.detailLabel}>habitaciones</Text>
            </View>
          )}
          {listing.size_m2 && (
            <View style={styles.detailItem}>
              <Text style={styles.detailValue}>{listing.size_m2}</Text>
              <Text style={styles.detailLabel}>m²</Text>
            </View>
          )}
          {listing.available_from && (
            <View style={styles.detailItem}>
              <Text style={styles.detailValue}>{listing.available_from}</Text>
              <Text style={styles.detailLabel}>disponible</Text>
            </View>
          )}
        </View>

        {/* Tags de preferencias */}
        <View style={styles.tags}>
          {listing.is_furnished && <TagBadge label="🛋️ Amueblado" variant="primary" />}
          {listing.pets_allowed && <TagBadge label="🐾 Mascotas OK" variant="success" />}
          {listing.smokers_allowed && <TagBadge label="🚬 Fumadores OK" variant="warning" />}
          {!listing.is_furnished && <TagBadge label="Sin amueblar" />}
          {!listing.pets_allowed && <TagBadge label="Sin mascotas" variant="error" />}
        </View>

        {/* Descripción */}
        {listing.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>
        )}

        {/* Owner */}
        {owner && (
          <Pressable
            style={styles.ownerCard}
            onPress={() => router.push(`/profile/${owner.id}`)}
          >
            <UserAvatar
              avatarUrl={owner.avatar_url}
              name={owner.full_name}
              size="md"
              verified={!!owner.verified_at}
            />
            <View style={styles.ownerInfo}>
              <Text style={styles.ownerName}>{owner.full_name ?? "Usuario"}</Text>
              {owner.verified_at && (
                <Text style={styles.ownerVerified}>✓ Número verificado</Text>
              )}
            </View>
            <Text style={styles.ownerArrow}>›</Text>
          </Pressable>
        )}

        {/* Acción de contacto */}
        {!isOwner && listing && myId && (
          <>
            {!myRequest && (
              <Pressable
                style={styles.contactBtn}
                onPress={() => { haptics.medium(); setRequestSheetOpen(true); }}
                accessibilityLabel="Solicitar habitación"
              >
                <Text style={styles.contactBtnText}>💬 Solicitar habitación</Text>
              </Pressable>
            )}

            {myRequest?.status === "pending" && (
              <View style={[styles.contactBtn, styles.contactBtnPending]}>
                <Text style={styles.contactBtnPendingText}>⏳ Solicitud enviada — esperando respuesta</Text>
              </View>
            )}

            {myRequest?.status === "accepted" && linkedConversation && (
              <Pressable
                style={styles.contactBtn}
                onPress={() => router.push(`/conversation/${linkedConversation.id}`)}
              >
                <Text style={styles.contactBtnText}>💬 Abrir chat</Text>
              </Pressable>
            )}

            {myRequest?.status === "denied" && (
              <View style={[styles.contactBtn, styles.contactBtnDenied]}>
                <Text style={styles.contactBtnDeniedText}>Tu solicitud no fue aceptada</Text>
              </View>
            )}

            <SendRequestSheet
              visible={requestSheetOpen}
              onClose={() => setRequestSheetOpen(false)}
              listingId={listing.id}
              listingTitle={listing.title}
              ownerId={listing.owner_id}
              requesterId={myId}
            />
          </>
        )}

        {/* Share template */}
        <Pressable
          style={[styles.shareBtn, sharing && styles.shareBtnDisabled]}
          onPress={handleShare}
          disabled={sharing}
        >
          {sharing
            ? <ActivityIndicator color={colors.primary} />
            : <Text style={styles.shareBtnText}>📸 Compartir en Instagram</Text>
          }
        </Pressable>

        {/* Acciones del owner */}
        {isOwner && (
          <View style={styles.ownerActions}>
            <Pressable
              style={styles.editBtn}
              onPress={() => router.push(`/listing/${listing.id}/edit`)}
            >
              <Text style={styles.editBtnText}>✏️ Editar</Text>
            </Pressable>

            {listing.status === "active" && (
              <Pressable style={styles.pauseBtn} onPress={() => handleStatusChange("paused")}>
                <Text style={styles.pauseBtnText}>⏸ Pausar</Text>
              </Pressable>
            )}
            {listing.status === "paused" && (
              <Pressable style={styles.activateBtn} onPress={() => handleStatusChange("active")}>
                <Text style={styles.activateBtnText}>▶ Activar</Text>
              </Pressable>
            )}
            {listing.status !== "rented" && (
              <Pressable style={styles.rentedBtn} onPress={() => handleStatusChange("rented")}>
                <Text style={styles.rentedBtnText}>🏠 Marcar alquilado</Text>
              </Pressable>
            )}

            <Pressable style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>🗑 Eliminar</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing[10] },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  carousel: { height: 260, backgroundColor: colors.gray100 },
  carouselImage: { width: SCREEN_WIDTH, height: 260 },
  carouselPlaceholder: {
    width: SCREEN_WIDTH,
    height: 260,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing[1],
    marginTop: spacing[2],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.gray300,
  },
  body: { padding: spacing[4], gap: spacing[3] },
  title: { fontSize: fontSize["2xl"], fontWeight: "700", color: colors.text },
  locationRow: { flexDirection: "row" },
  location: { fontSize: fontSize.sm, color: colors.textSecondary },
  details: {
    flexDirection: "row",
    gap: spacing[4],
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailItem: { alignItems: "center" },
  detailValue: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text },
  detailLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  section: { gap: spacing[2] },
  sectionTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  description: { fontSize: fontSize.md, color: colors.textSecondary, lineHeight: 22 },
  ownerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius["2xl"],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[3],
  },
  ownerInfo: { flex: 1 },
  ownerName: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  ownerVerified: { fontSize: fontSize.xs, color: colors.verify, fontWeight: "600" },
  ownerArrow: { fontSize: 22, color: colors.textTertiary },
  contactBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    alignItems: "center",
  },
  contactBtnText: { color: colors.white, fontWeight: "700", fontSize: fontSize.md },
  contactBtnPending: { backgroundColor: colors.warningLight },
  contactBtnPendingText: { color: colors.warning, fontWeight: "600", fontSize: fontSize.sm },
  contactBtnDenied: { backgroundColor: colors.errorLight },
  contactBtnDeniedText: { color: colors.error, fontWeight: "600", fontSize: fontSize.sm },
  ownerActions: { gap: spacing[2] },
  editBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing[3],
    alignItems: "center",
  },
  editBtnText: { fontWeight: "600", color: colors.text },
  pauseBtn: {
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    paddingVertical: spacing[3],
    alignItems: "center",
  },
  pauseBtnText: { fontWeight: "600", color: colors.warning },
  activateBtn: {
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    paddingVertical: spacing[3],
    alignItems: "center",
  },
  activateBtnText: { fontWeight: "600", color: colors.success },
  rentedBtn: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingVertical: spacing[3],
    alignItems: "center",
  },
  rentedBtnText: { fontWeight: "600", color: colors.primary },
  deleteBtn: {
    backgroundColor: colors.errorLight,
    borderRadius: radius.md,
    paddingVertical: spacing[3],
    alignItems: "center",
  },
  deleteBtnText: { fontWeight: "600", color: colors.error },
  shareBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: spacing[3] + 2,
    gap: spacing[2],
  },
  shareBtnDisabled: { opacity: 0.5 },
  shareBtnText: { color: colors.primary, fontWeight: "700", fontSize: fontSize.md },
});
