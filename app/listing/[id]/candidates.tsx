import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { UserAvatar } from "../../../src/components/ui/UserAvatar";
import { useConversations } from "../../../src/hooks/useConversations";
import { useListing } from "../../../src/hooks/useListings";
import {
  useReceivedRequests,
  useUpdateRequestStatus,
  type OfferTerms,
  type RequestWithDetails,
} from "../../../src/hooks/useRequests";
import { useMutualFriends } from "../../../src/hooks/useConnections";
import { useIsSuperfriendz } from "../../../src/hooks/useSubscription";
import { useAuth } from "../../../src/providers/AuthProvider";
import { colors, fontSize, radius, spacing } from "../../../src/theme";

type SortMode = "mutual" | "recent" | "verified";

function CandidateCard({
  request,
  myId,
  onOffer,
  onReject,
  onOpenChat,
}: {
  request: RequestWithDetails;
  myId: string | undefined;
  onOffer: (r: RequestWithDetails) => void;
  onReject: (r: RequestWithDetails) => void;
  onOpenChat: (r: RequestWithDetails) => void;
}) {
  const { data: mutual = [] } = useMutualFriends(myId, request.requester_id);
  const { data: isSuper = false } = useIsSuperfriendz();
  const requester = request.requester;
  const isPremium = request.is_boosted;

  const elapsed = (() => {
    const diff = Date.now() - new Date(request.created_at).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  })();

  if (!requester) return null;

  return (
    <View style={[styles.card, isPremium && styles.cardPremium]}>
      <View style={styles.cardHeader}>
        <UserAvatar
          avatarUrl={requester.avatar_url}
          name={requester.full_name}
          size="md"
          verified={!!requester.verified_at}
        />
        <View style={styles.cardInfo}>
          <View style={styles.cardNameRow}>
            <Text style={styles.cardName}>{requester.full_name ?? "Usuario"}</Text>
            {isPremium && (
              <View style={styles.superBadge}>
                <Text style={styles.superBadgeText}>Superfriendz</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardSub}>{requester.city ?? ""}</Text>
          <Text style={[styles.cardMutual, mutual.length === 0 && styles.cardMutualNone]}>
            {mutual.length > 0
              ? `${mutual.length} ${mutual.length === 1 ? "amigo" : "amigos"} · ${
                  isSuper
                    ? mutual.slice(0, 2).map((f) => (f.full_name ?? "").split(" ")[0]).join(", ")
                    : "en comun"
                }`
              : "Sin amigos en comun"}
          </Text>
        </View>
        <Text style={styles.elapsed}>{elapsed}</Text>
      </View>

      {isPremium && (
        <View style={styles.tagsRow}>
          {["Ordenada", "No fuma", "Madrugadora"].map((t) => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.message} numberOfLines={isPremium ? 2 : 1}>
        {request.presentation_message ?? request.message ?? "Sin mensaje"}
      </Text>

      <View style={styles.actions}>
        <Pressable style={styles.actionReject} onPress={() => onReject(request)}>
          <Text style={styles.actionRejectText}>Rechazar</Text>
        </Pressable>
        <Pressable style={styles.actionProfile} onPress={() => router.push(`/profile/${request.requester_id}`)}>
          <Text style={styles.actionProfileText}>Ver perfil</Text>
        </Pressable>
        {request.status === "offered" || request.status === "accepted" || request.status === "assigned" ? (
          <Pressable style={styles.actionChat} onPress={() => onOpenChat(request)}>
            <Text style={styles.actionChatText}>Chat</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.actionOffer} onPress={() => onOffer(request)}>
            <Text style={styles.actionOfferText}>Ofrecer</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function CandidatesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const myId = session?.user?.id;

  const { data: listing } = useListing(id);
  const { data: requests = [], isLoading } = useReceivedRequests(myId);
  const { data: conversations = [] } = useConversations(myId);
  const updateRequest = useUpdateRequestStatus();

  const [sort, setSort] = useState<SortMode>("mutual");

  const listingRequests = requests.filter(
    (r) => r.listing_id === id && (r.status === "pending" || r.status === "offered" || r.status === "accepted"),
  );

  const premiumCandidates = listingRequests.filter((r) => r.is_boosted);
  const standardCandidates = listingRequests.filter((r) => !r.is_boosted);

  const buildOfferTerms = (request: RequestWithDetails): OfferTerms => ({
    price: request.listing?.price ?? null,
    available_from: request.listing?.available_from ?? null,
    min_stay_months: request.listing?.min_stay_months ?? null,
    bills_mode: "extra",
  });

  const openChatByRequest = (request: RequestWithDetails) => {
    const conv = conversations.find((c) => c.request_id === request.id);
    if (!conv?.id) {
      Alert.alert("Chat no disponible", "Esta solicitud aun no tiene chat asociado.");
      return;
    }
    router.push(`/conversation/${conv.id}`);
  };

  const handleOffer = (request: RequestWithDetails) => {
    Alert.alert(
      "Ofrecer habitacion",
      `Enviar oferta formal a ${request.requester?.full_name ?? "este candidato"} para continuar en chat.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Enviar oferta",
          onPress: async () => {
            const conv = (await updateRequest.mutateAsync({
              request,
              status: "offered",
              offerTerms: buildOfferTerms(request),
            })) as { id: string } | null;
            if (conv?.id) router.push(`/conversation/${conv.id}`);
          },
        },
      ],
    );
  };

  const handleReject = (request: RequestWithDetails) => {
    Alert.alert("Rechazar candidato", "El candidato recibira una notificacion.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Rechazar",
        style: "destructive",
        onPress: () => updateRequest.mutate({ request, status: "denied" }),
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {listing && (
        <View style={styles.strip}>
          <Text style={styles.stripTitle} numberOfLines={1}>
            {listing.title} · {listing.price} €/mes
          </Text>
          <Text style={styles.stripSub}>
            {listing.city}
            {listing.district ? ` · ${listing.district}` : ""} · {listingRequests.length} solicitudes
          </Text>
        </View>
      )}

      <View style={styles.sortTabs}>
        {(
          [
            { key: "mutual", label: "Amigos en comun" },
            { key: "recent", label: "Mas recientes" },
            { key: "verified", label: "Verificados" },
          ] as { key: SortMode; label: string }[]
        ).map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.sortTab, sort === tab.key && styles.sortTabActive]}
            onPress={() => setSort(tab.key)}
          >
            <Text style={[styles.sortTabText, sort === tab.key && styles.sortTabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {premiumCandidates.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDivider} />
              <Text style={styles.sectionHeaderText}>Superfriendz · {premiumCandidates.length} destacados</Text>
              <View style={styles.sectionDivider} />
            </View>
            {premiumCandidates.map((r) => (
              <CandidateCard
                key={r.id}
                request={r}
                myId={myId}
                onOffer={handleOffer}
                onReject={handleReject}
                onOpenChat={openChatByRequest}
              />
            ))}
          </>
        )}

        {standardCandidates.length > 0 && (
          <>
            {premiumCandidates.length > 0 && (
              <View style={styles.divider}>
                <Text style={styles.dividerText}>{standardCandidates.length} candidatos mas</Text>
              </View>
            )}
            {standardCandidates.map((r) => (
              <CandidateCard
                key={r.id}
                request={r}
                myId={myId}
                onOffer={handleOffer}
                onReject={handleReject}
                onOpenChat={openChatByRequest}
              />
            ))}
          </>
        )}

        {listingRequests.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Sin solicitudes aun</Text>
            <Text style={styles.emptySub}>Cuando alguien solicite tu habitacion aparecera aqui.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  strip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stripTitle: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
  stripSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },

  sortTabs: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing[2],
  },
  sortTab: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderBottomWidth: 2,
    borderBottomColor: colors.transparent,
    marginRight: spacing[1],
  },
  sortTabActive: { borderBottomColor: colors.purple },
  sortTabText: { fontSize: fontSize.xs, fontWeight: "600", color: colors.textSecondary },
  sortTabTextActive: { color: colors.purple },

  list: { padding: spacing[4], gap: spacing[3] },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: spacing[2], marginBottom: spacing[1] },
  sectionDivider: { flex: 1, height: 1, backgroundColor: colors.purpleLight },
  sectionHeaderText: { fontSize: fontSize.xs, fontWeight: "700", color: colors.purple, textAlign: "center" },

  divider: { alignItems: "center", paddingVertical: spacing[2] },
  dividerText: { fontSize: fontSize.xs, color: colors.textTertiary, fontWeight: "600" },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[3],
  },
  cardPremium: { backgroundColor: colors.purpleLight + "55", borderColor: colors.purple + "44" },
  cardHeader: { flexDirection: "row", gap: spacing[3], alignItems: "flex-start" },
  cardInfo: { flex: 1 },
  cardNameRow: { flexDirection: "row", alignItems: "center", gap: spacing[2], flexWrap: "wrap" },
  cardName: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  superBadge: { backgroundColor: colors.purple, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  superBadgeText: { fontSize: 10, fontWeight: "700", color: colors.white },
  cardSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 1 },
  cardMutual: { fontSize: fontSize.xs, color: colors.primary, fontWeight: "600", marginTop: 2 },
  cardMutualNone: { color: colors.textTertiary, fontWeight: "400" },
  elapsed: { fontSize: fontSize.xs, color: colors.textTertiary },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing[1] },
  tag: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    backgroundColor: colors.surface,
  },
  tagText: { fontSize: 11, color: colors.textSecondary },

  message: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },

  actions: { flexDirection: "row", gap: spacing[2], marginTop: spacing[1] },
  actionReject: {
    flex: 1,
    paddingVertical: spacing[2],
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionRejectText: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: "600" },
  actionProfile: {
    flex: 1,
    paddingVertical: spacing[2],
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: colors.gray100,
  },
  actionProfileText: { fontSize: fontSize.xs, color: colors.text, fontWeight: "600" },
  actionChat: {
    flex: 1,
    paddingVertical: spacing[2],
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: colors.verify,
  },
  actionChatText: { fontSize: fontSize.xs, color: colors.white, fontWeight: "700" },
  actionOffer: {
    flex: 1,
    paddingVertical: spacing[2],
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: colors.text,
  },
  actionOfferText: { fontSize: fontSize.xs, color: colors.white, fontWeight: "700" },

  empty: { alignItems: "center", paddingTop: spacing[10], gap: spacing[3] },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text },
  emptySub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 20,
  },
});

