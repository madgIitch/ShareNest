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
import { useListing } from "../../../src/hooks/useListings";
import {
  useReceivedRequests,
  useUpdateRequestStatus,
  type RequestWithDetails,
} from "../../../src/hooks/useRequests";
import { useMutualFriends } from "../../../src/hooks/useConnections";
import { useIsSuperfriendz } from "../../../src/hooks/useSubscription";
import { useAuth } from "../../../src/providers/AuthProvider";
import { colors, fontSize, radius, spacing } from "../../../src/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortMode = "mutual" | "recent" | "verified";

// ─── Candidate card ───────────────────────────────────────────────────────────

function CandidateCard({
  request,
  myId,
  onAccept,
  onReject,
}: {
  request: RequestWithDetails;
  myId: string | undefined;
  onAccept: (r: RequestWithDetails) => void;
  onReject: (r: RequestWithDetails) => void;
}) {
  const { data: mutual = [] } = useMutualFriends(myId, request.requester_id);
  const { data: isSuper = false } = useIsSuperfriendz();
  const requester = request.requester;
  const isPremium = request.is_boosted;

  // Elapsed time
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
      {/* Header */}
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
          <Text style={styles.cardSub}>
            {requester.city ?? ""}
          </Text>

          {/* Mutual friends */}
          <Text style={[styles.cardMutual, mutual.length === 0 && styles.cardMutualNone]}>
            {mutual.length > 0
              ? `${mutual.length} ${mutual.length === 1 ? "amigo" : "amigos"} · ${
                  isPremium
                    ? mutual.slice(0, 2).map((f) => (f.full_name ?? "").split(" ")[0]).join(", ")
                    : "amigos en común"
                }`
              : "Sin amigos en común"}
          </Text>
        </View>
        <Text style={styles.elapsed}>{elapsed}</Text>
      </View>

      {/* Lifestyle tags (premium only) */}
      {isPremium && (
        <View style={styles.tagsRow}>
          {["Ordenada", "No fuma", "Madrugadora"].map((t) => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Message */}
      <Text
        style={styles.message}
        numberOfLines={isPremium ? 2 : 1}
      >
        {request.presentation_message ?? request.message ?? "Sin mensaje"}
      </Text>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={styles.actionReject}
          onPress={() => onReject(request)}
        >
          <Text style={styles.actionRejectText}>Rechazar</Text>
        </Pressable>
        <Pressable
          style={styles.actionProfile}
          onPress={() => router.push(`/profile/${request.requester_id}`)}
        >
          <Text style={styles.actionProfileText}>Ver perfil</Text>
        </Pressable>
        <Pressable
          style={styles.actionChat}
          onPress={() => router.push(`/profile/${request.requester_id}`)}
        >
          <Text style={styles.actionChatText}>Chat</Text>
        </Pressable>
        <Pressable
          style={styles.actionAccept}
          onPress={() => onAccept(request)}
        >
          <Text style={styles.actionAcceptText}>Aceptar ✓</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function CandidatesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const myId = session?.user?.id;

  const { data: listing } = useListing(id);
  const { data: requests = [], isLoading } = useReceivedRequests(myId);
  const updateRequest = useUpdateRequestStatus();

  const [sort, setSort] = useState<SortMode>("mutual");

  // Filter to this listing only
  const listingRequests = requests.filter(
    (r) => r.listing_id === id && r.status === "pending",
  );

  const premiumCandidates = listingRequests.filter((r) => r.is_boosted);
  const standardCandidates = listingRequests.filter((r) => !r.is_boosted);

  const handleAccept = (request: RequestWithDetails) => {
    Alert.alert(
      "Aceptar candidato",
      `¿Abrir chat con ${request.requester?.full_name ?? "este candidato"}? Podrás confirmar la asignación desde la conversación.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aceptar y abrir chat",
          onPress: async () => {
            const conv = (await updateRequest.mutateAsync({
              request,
              status: "accepted",
            })) as { id: string } | null;
            if (conv) router.push(`/conversation/${conv.id}`);
          },
        },
      ],
    );
  };

  const handleReject = (request: RequestWithDetails) => {
    Alert.alert(
      "Rechazar candidato",
      "El candidato recibirá una notificación educada.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Rechazar",
          style: "destructive",
          onPress: () => updateRequest.mutate({ request, status: "denied" }),
        },
      ],
    );
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
      {/* Listing strip */}
      {listing && (
        <View style={styles.strip}>
          <Text style={styles.stripTitle} numberOfLines={1}>
            {listing.title} · {listing.price} €/mes
          </Text>
          <Text style={styles.stripSub}>
            {listing.city}
            {listing.district ? ` · ${listing.district}` : ""} ·{" "}
            {listingRequests.length} solicitudes
          </Text>
        </View>
      )}

      {/* Sort tabs */}
      <View style={styles.sortTabs}>
        {(
          [
            { key: "mutual", label: "Amigos en común" },
            { key: "recent", label: "Más recientes" },
            { key: "verified", label: "Verificados" },
          ] as { key: SortMode; label: string }[]
        ).map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.sortTab, sort === tab.key && styles.sortTabActive]}
            onPress={() => setSort(tab.key)}
          >
            <Text
              style={[styles.sortTabText, sort === tab.key && styles.sortTabTextActive]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {/* Superfriendz section */}
        {premiumCandidates.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDivider} />
              <Text style={styles.sectionHeaderText}>
                Superfriendz · {premiumCandidates.length} candidatos destacados
              </Text>
              <View style={styles.sectionDivider} />
            </View>
            {premiumCandidates.map((r) => (
              <CandidateCard
                key={r.id}
                request={r}
                myId={myId}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            ))}
          </>
        )}

        {/* Standard candidates */}
        {standardCandidates.length > 0 && (
          <>
            {premiumCandidates.length > 0 && (
              <View style={styles.divider}>
                <Text style={styles.dividerText}>
                  {standardCandidates.length} candidatos más
                </Text>
              </View>
            )}
            {standardCandidates.map((r) => (
              <CandidateCard
                key={r.id}
                request={r}
                myId={myId}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            ))}
          </>
        )}

        {listingRequests.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>Sin solicitudes aún</Text>
            <Text style={styles.emptySub}>
              Cuando alguien solicite tu habitación aparecerá aquí.
            </Text>
          </View>
        )}
      </ScrollView>
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

  // Listing strip
  strip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stripTitle: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
  stripSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },

  // Sort tabs
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

  // List
  list: { padding: spacing[4], gap: spacing[3] },

  // Section header (Superfriendz)
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  sectionDivider: { flex: 1, height: 1, backgroundColor: colors.purpleLight },
  sectionHeaderText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.purple,
    textAlign: "center",
  },

  // Divider
  divider: {
    alignItems: "center",
    paddingVertical: spacing[2],
  },
  dividerText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontWeight: "600",
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[3],
  },
  cardPremium: {
    backgroundColor: colors.purpleLight + "55",
    borderColor: colors.purple + "44",
  },
  cardHeader: { flexDirection: "row", gap: spacing[3], alignItems: "flex-start" },
  cardInfo: { flex: 1 },
  cardNameRow: { flexDirection: "row", alignItems: "center", gap: spacing[2], flexWrap: "wrap" },
  cardName: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  superBadge: {
    backgroundColor: colors.purple,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  superBadgeText: { fontSize: 10, fontWeight: "700", color: colors.white },
  cardSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 1 },
  cardMutual: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  cardMutualNone: { color: colors.textTertiary, fontWeight: "400" },
  elapsed: { fontSize: fontSize.xs, color: colors.textTertiary },

  // Tags
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

  // Message
  message: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },

  // Actions
  actions: {
    flexDirection: "row",
    gap: spacing[2],
    marginTop: spacing[1],
  },
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
    backgroundColor: colors.gray100,
  },
  actionChatText: { fontSize: fontSize.xs, color: colors.text, fontWeight: "600" },
  actionAccept: {
    flex: 1,
    paddingVertical: spacing[2],
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: colors.text,
  },
  actionAcceptText: { fontSize: fontSize.xs, color: colors.white, fontWeight: "700" },

  // Empty
  empty: { alignItems: "center", paddingTop: spacing[10], gap: spacing[3] },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text },
  emptySub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 20,
  },
});
