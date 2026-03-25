import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { UserAvatar } from "../../src/components/ui/UserAvatar";
import { TagBadge } from "../../src/components/ui/TagBadge";
import { useAcceptChat, useRequest, useUpdateRequestStatus } from "../../src/hooks/useRequests";
import { useMutualFriends } from "../../src/hooks/useConnections";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/providers/AuthProvider";
import { colors, fontSize, radius, spacing } from "../../src/theme";

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const myId = session?.user?.id;
  const { data: request, isLoading } = useRequest(id);
  const updateStatus = useUpdateRequestStatus();
  const acceptChat = useAcceptChat();
  const { data: mutual = [] } = useMutualFriends(myId, request?.requester_id);

  if (isLoading || !request) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const requester = request.requester;
  const listing = request.listing;
  const canAcceptChat = request.status === "pending";
  const isClosed = request.status === "denied" || request.status === "assigned";
  const age = requester?.birth_year ? Math.max(0, new Date().getFullYear() - requester.birth_year) : null;
  const mutualPreview = mutual
    .slice(0, 3)
    .map((f) => (f.full_name ?? "").split(" ")[0])
    .filter(Boolean)
    .join(", ");

  const openChatForRequest = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("id")
      .eq("request_id", request.id)
      .maybeSingle();
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    const conv = data as { id: string } | null;
    if (!conv?.id) {
      Alert.alert("Chat no disponible", "Aún no hay una conversación vinculada a esta solicitud.");
      return;
    }
    router.push(`/conversation/${conv.id}`);
  };

  const handleAcceptChat = async () => {
    try {
      const convId = await acceptChat.mutateAsync(request);
      if (convId) {
        router.replace(`/conversation/${convId}`);
      } else {
        router.back();
      }
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    }
  };

  const handleDeny = () => {
    Alert.alert("Rechazar solicitud", "Esta acción es irreversible. El solicitante recibirá una actualización.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sí, rechazar",
        style: "destructive",
        onPress: async () => {
          try {
            await updateStatus.mutateAsync({ request, status: "denied" });
            router.back();
          } catch (err) {
            Alert.alert("Error", (err as Error).message);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {request.status !== "pending" && (
        <View style={[styles.statusBanner, request.status === "denied" ? styles.bannerDenied : styles.bannerActive]}>
          <Text style={[styles.statusBannerText, request.status === "denied" ? styles.bannerTextDenied : styles.bannerTextActive]}>
            {request.status === "offered"
              ? "Oferta enviada"
              : request.status === "invited"
                ? "Chat aceptado"
              : request.status === "accepted"
                ? "Chat confirmado"
                : request.status === "assigned"
                  ? "Habitación asignada"
                  : "Solicitud denegada"}
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Solicitante</Text>
        <Pressable style={styles.profileRow} onPress={() => requester && router.push(`/profile/${requester.id}`)}>
          <UserAvatar
            avatarUrl={requester?.avatar_url}
            name={requester?.full_name}
            size="lg"
            verified={!!requester?.verified_at}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{requester?.full_name ?? "Usuario"}</Text>
            {requester?.city && <Text style={styles.profileCity}>{requester.city}</Text>}
            {requester?.verified_at && <TagBadge label="Número verificado" variant="primary" />}
          </View>
        </Pressable>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{age ? `${age} años` : "Edad no indicada"}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{requester?.occupation?.trim() || "Profesión no indicada"}</Text>
        </View>
        {mutual.length > 0 && (
          <View style={styles.mutualBanner}>
            <Text style={styles.mutualTitle}>
              {mutual.length} {mutual.length === 1 ? "conexión en común" : "conexiones en común"}
            </Text>
            <Text style={styles.mutualText} numberOfLines={1}>
              {mutualPreview}
            </Text>
          </View>
        )}
        {requester?.bio && <Text style={styles.bio}>{requester.bio}</Text>}
        <Text style={styles.requestTime}>Recibida {formatRelative(request.created_at)}</Text>
      </View>

      {listing && (
        <Pressable style={styles.listingCard} onPress={() => router.push(`/listing/${listing.id}`)}>
          {(listing.images as string[])[0] ? (
            <Image source={{ uri: (listing.images as string[])[0] }} style={styles.listingThumb} />
          ) : (
            <View style={[styles.listingThumb, styles.listingThumbPlaceholder]}>
              <Text style={{ fontSize: 20 }}>[]</Text>
            </View>
          )}
          <View style={styles.listingInfo}>
            <Text style={styles.listingTitle} numberOfLines={2}>
              {listing.title}
            </Text>
            <Text style={styles.listingCity}>{listing.city}</Text>
            <Text style={styles.listingPrice}>{listing.price} {"\u20AC"}/mes</Text>
          </View>
        </Pressable>
      )}

      {request.message && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Mensaje</Text>
          <Text style={styles.message}>"{request.message}"</Text>
        </View>
      )}

      {canAcceptChat && (
        <View style={styles.actions}>
          <Pressable
            style={[styles.btn, styles.acceptBtn]}
            onPress={() => void handleAcceptChat()}
            disabled={acceptChat.isPending || updateStatus.isPending}
          >
            {acceptChat.isPending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.acceptBtnText}>Iniciar conversación</Text>
            )}
          </Pressable>
          <Pressable
            style={[styles.btn, styles.denyBtn]}
            onPress={handleDeny}
            disabled={acceptChat.isPending || updateStatus.isPending}
          >
            <Text style={styles.denyBtnText}>Rechazar</Text>
          </Pressable>
        </View>
      )}

      {!canAcceptChat && !isClosed && (
        <Pressable style={[styles.btn, styles.acceptBtn]} onPress={() => void openChatForRequest()}>
          <Text style={styles.acceptBtnText}>Ir al chat</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing[4], gap: spacing[3], paddingBottom: spacing[10] },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  statusBanner: {
    borderRadius: radius.xl,
    paddingVertical: spacing[3],
    alignItems: "center",
  },
  bannerActive: { backgroundColor: colors.purpleLight },
  bannerDenied: { backgroundColor: colors.errorLight },
  statusBannerText: { fontWeight: "700", fontSize: fontSize.sm },
  bannerTextActive: { color: colors.purple },
  bannerTextDenied: { color: colors.error },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius["2xl"],
    padding: spacing[4],
    gap: spacing[3],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  profileRow: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  profileInfo: { flex: 1, gap: spacing[1] },
  profileName: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text },
  profileCity: { fontSize: fontSize.sm, color: colors.textSecondary },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
  metaText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: "600" },
  metaDot: { fontSize: fontSize.sm, color: colors.textTertiary },
  mutualBanner: {
    backgroundColor: colors.purple,
    borderRadius: radius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    gap: 2,
  },
  mutualTitle: { color: colors.white, fontSize: fontSize.sm, fontWeight: "700" },
  mutualText: { color: colors.white, opacity: 0.92, fontSize: fontSize.xs },
  bio: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
  requestTime: { fontSize: fontSize.xs, color: colors.textTertiary, fontWeight: "600" },

  listingCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius["2xl"],
    overflow: "hidden",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  listingThumb: { width: 88, height: 88 },
  listingThumbPlaceholder: {
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  listingInfo: { flex: 1, padding: spacing[3], gap: 3 },
  listingTitle: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
  listingCity: { fontSize: fontSize.xs, color: colors.textSecondary },
  listingPrice: { fontSize: fontSize.sm, fontWeight: "700", color: colors.primary },

  message: {
    fontSize: fontSize.md,
    color: colors.text,
    fontStyle: "italic",
    lineHeight: 22,
  },

  actions: { gap: spacing[2] },
  btn: {
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    alignItems: "center",
  },
  acceptBtn: { backgroundColor: colors.text },
  acceptBtnText: { color: colors.white, fontWeight: "700", fontSize: fontSize.md },
  denyBtn: { backgroundColor: colors.errorLight },
  denyBtnText: { color: colors.error, fontWeight: "700", fontSize: fontSize.md },
});




