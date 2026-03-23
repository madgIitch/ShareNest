import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { UserAvatar } from "../../src/components/ui/UserAvatar";
import { TagBadge } from "../../src/components/ui/TagBadge";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { useConversations } from "../../src/hooks/useConversations";
import {
  ACTIVE_REQUEST_STATUSES,
  useReceivedRequests,
  useSentRequests,
  useWithdrawRequest,
} from "../../src/hooks/useRequests";
import { useAuth } from "../../src/providers/AuthProvider";
import { colors, fontSize, radius, spacing } from "../../src/theme";
import type { ConversationWithDetails } from "../../src/hooks/useConversations";
import type { RequestWithDetails } from "../../src/hooks/useRequests";

type Tab = "chats" | "received" | "sent";
const SLOT_LIMIT = 3;

function isActiveRequest(status: string) {
  return ACTIVE_REQUEST_STATUSES.includes(status as (typeof ACTIVE_REQUEST_STATUSES)[number]);
}

function statusMeta(status: RequestWithDetails["status"]) {
  if (status === "assigned") return { label: "Asignada", variant: "success" as const };
  if (status === "offered") return { label: "Ofertada", variant: "primary" as const };
  if (status === "accepted") return { label: "Aceptada", variant: "success" as const };
  if (status === "denied") return { label: "Rechazada", variant: "error" as const };
  if (status === "invited") return { label: "Invitada", variant: "primary" as const };
  return { label: "Pendiente", variant: "warning" as const };
}

export default function MessagesScreen() {
  const { session } = useAuth();
  const myId = session?.user?.id;
  const params = useLocalSearchParams<{ tab?: string; upsell?: string; fromListingTitle?: string }>();

  const initialTab: Tab =
    params.tab === "received" ? "received" : params.tab === "sent" ? "sent" : "chats";

  const [tab, setTab] = useState<Tab>(initialTab);
  const [showUpsell, setShowUpsell] = useState(params.upsell === "1");

  const { data: conversations = [], isLoading: convLoading } = useConversations(myId);
  const { data: received = [], isLoading: recvLoading } = useReceivedRequests(myId);
  const { data: sent = [], isLoading: sentLoading } = useSentRequests(myId);
  const withdrawRequest = useWithdrawRequest();

  const pendingCount = received.filter((r) => r.status === "pending").length;
  const isLoading = convLoading || recvLoading || sentLoading;

  const sentActive = sent.filter((r) => isActiveRequest(r.status));
  const usedSlots = sentActive.length;
  const reachedLimit = usedSlots >= SLOT_LIMIT;
  const remainingSlots = Math.max(0, SLOT_LIMIT - usedSlots);

  useEffect(() => {
    if (params.tab === "chats" || params.tab === "received" || params.tab === "sent") {
      setTab(params.tab);
    }
  }, [params.tab]);

  useEffect(() => {
    if (params.upsell === "1" && tab === "sent" && reachedLimit) {
      setShowUpsell(true);
    }
  }, [params.upsell, tab, reachedLimit]);

  const sentSorted = useMemo(() => {
    const priority = (status: RequestWithDetails["status"]) => {
      if (status === "pending" || status === "invited") return 0;
      if (status === "offered") return 1;
      if (status === "accepted") return 2;
      if (status === "assigned") return 3;
      return 4;
    };
    return [...sent].sort((a, b) => {
      const p = priority(a.status) - priority(b.status);
      if (p !== 0) return p;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [sent]);

  const conversationByListingId = useMemo(() => {
    const map = new Map<string, string>();
    for (const conv of conversations) {
      if (conv.listing_id) map.set(conv.listing_id, conv.id);
    }
    return map;
  }, [conversations]);

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "chats", label: "Chats" },
    { key: "received", label: "Recibidas", badge: pendingCount || undefined },
    { key: "sent", label: "Enviadas", badge: usedSlots || undefined },
  ];

  const handleWithdraw = (request: RequestWithDetails) => {
    if (!myId) return;
    Alert.alert(
      "Retirar solicitud",
      "Esta solicitud dejara de estar activa y liberara un slot.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Retirar",
          style: "destructive",
          onPress: () =>
            withdrawRequest.mutate({
              requestId: request.id,
              requesterId: myId,
              ownerId: request.owner_id,
              listingId: request.listing_id,
            }),
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.tabBar}>
        {tabs.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            {(t.badge ?? 0) > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{t.badge}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: spacing[8] }} color={colors.primary} />
      ) : (
        <>
          {tab === "chats" && (
            <FlatList
              data={conversations}
              keyExtractor={(c) => c.id}
              contentContainerStyle={conversations.length === 0 ? { flex: 1 } : styles.list}
              renderItem={({ item }) => (
                <ConversationItem
                  conv={item}
                  myId={myId ?? ""}
                  onPress={() => router.push(`/conversation/${item.id}`)}
                />
              )}
              ListEmptyComponent={
                <EmptyState
                  icon="??"
                  title="Sin conversaciones"
                  subtitle="Las conversaciones aparecen cuando el anunciante acepta tu solicitud."
                />
              }
            />
          )}

          {tab === "received" && (
            <FlatList
              data={received}
              keyExtractor={(r) => r.id}
              contentContainerStyle={received.length === 0 ? { flex: 1 } : styles.list}
              renderItem={({ item }) => (
                <RequestItem
                  request={item}
                  role="owner"
                  onPress={() => router.push(`/requests/${item.id}`)}
                />
              )}
              ListEmptyComponent={
                <EmptyState
                  icon="??"
                  title="Sin solicitudes recibidas"
                  subtitle="Cuando alguien este interesado en tu anuncio, veras su solicitud aqui."
                />
              }
            />
          )}

          {tab === "sent" && (
            <View style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={styles.sentScroll}>
                <View style={[styles.sentHeader, reachedLimit && styles.sentHeaderReached]}>
                  <View style={styles.sentHeaderTop}>
                    <Text style={styles.sentTitle}>Mis solicitudes</Text>
                    <Text style={styles.sentCount}>{usedSlots} activas</Text>
                  </View>
                  <Text style={styles.sentSub}>Solicitudes activas</Text>
                  <View style={styles.slotsRow}>
                    {Array.from({ length: SLOT_LIMIT }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.slotBar,
                          i < usedSlots && (reachedLimit ? styles.slotBarReached : styles.slotBarActive),
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.slotLabel, reachedLimit && styles.slotLabelReached]}>
                    {usedSlots} de {SLOT_LIMIT}
                    {reachedLimit ? " (limite alcanzado)" : ""}
                  </Text>
                </View>

                <View style={[showUpsell ? styles.dimmed : undefined]}>
                  {sentSorted.map((item) => {
                    const status = statusMeta(item.status);
                    const linkedConversationId = conversationByListingId.get(item.listing_id);
                    return (
                      <View key={item.id} style={styles.sentCard}>
                        <View style={styles.sentCardTop}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.sentCardTitle} numberOfLines={2}>
                              {item.listing?.title ?? "Anuncio"}
                            </Text>
                            <Text style={styles.sentCardMeta} numberOfLines={1}>
                              {item.listing?.city ?? ""}
                              {item.listing?.price ? ` · ${item.listing.price} €/mes` : ""}
                            </Text>
                          </View>
                          <TagBadge label={status.label} variant={status.variant} />
                        </View>
                        <Text style={styles.sentCardTime}>{formatRelative(item.created_at)}</Text>
                        <View style={styles.sentActions}>
                          {isActiveRequest(item.status) && (
                            <Pressable style={styles.sentActionGhost} onPress={() => handleWithdraw(item)}>
                              <Text style={styles.sentActionGhostText}>Retirar</Text>
                            </Pressable>
                          )}
                          {(item.status === "offered" || item.status === "accepted" || item.status === "assigned") && linkedConversationId && (
                            <Pressable
                              style={styles.sentActionPrimary}
                              onPress={() => router.push(`/conversation/${linkedConversationId}`)}
                            >
                              <Text style={styles.sentActionPrimaryText}>Chat abierto</Text>
                            </Pressable>
                          )}
                        </View>
                      </View>
                    );
                  })}

                  {remainingSlots > 0 && (
                    <View style={styles.slotAvailableCard}>
                      <Text style={styles.slotAvailableTitle}>Slot disponible</Text>
                      <Text style={styles.slotAvailableText}>
                        Puedes enviar {remainingSlots} solicitud{remainingSlots > 1 ? "es" : ""} mas.
                      </Text>
                    </View>
                  )}
                </View>

                {reachedLimit && (
                  <View style={styles.limitBanner}>
                    <Text style={styles.limitBannerTitle}>Has alcanzado el limite de solicitudes</Text>
                    <Text style={styles.limitBannerText}>
                      Retira una solicitud para liberar un slot, o pasa a Superfriendz para solicitudes ilimitadas.
                    </Text>
                  </View>
                )}

                {!reachedLimit ? (
                  <Pressable style={styles.exploreBtn} onPress={() => router.push("/(tabs)/explore") }>
                    <Text style={styles.exploreBtnText}>+ Explorar mas pisos</Text>
                  </Pressable>
                ) : (
                  <Pressable style={styles.blockedBtn} onPress={() => setShowUpsell(true)}>
                    <Text style={styles.blockedBtnText}>?? Nueva solicitud · Limite alcanzado</Text>
                  </Pressable>
                )}

                {sent.length === 0 && (
                  <EmptyState
                    icon="??"
                    title="Sin solicitudes enviadas"
                    subtitle="Encuentra un anuncio y envia tu primera solicitud."
                    action={{ label: "Explorar", onPress: () => router.push("/(tabs)/explore") }}
                  />
                )}
              </ScrollView>

              {showUpsell && reachedLimit && (
                <View style={styles.upsellOverlay}>
                  <View style={styles.upsellCard}>
                    <Text style={styles.upsellTitle}>Solicitudes ilimitadas con Superfriendz</Text>
                    <Text style={styles.upsellSub}>
                      {params.fromListingTitle
                        ? `Estas intentando solicitar: ${params.fromListingTitle}`
                        : "Estas en el momento perfecto para desbloquear mas solicitudes."}
                    </Text>
                    <Text style={styles.upsellFeature}>• Solicitudes activas ilimitadas</Text>
                    <Text style={styles.upsellFeature}>• Candidatos en orden de prioridad</Text>
                    <Text style={styles.upsellFeature}>• Ver quien visita tu perfil</Text>
                    <Text style={styles.upsellFeature}>• Estilo destacado visible en tu tarjeta</Text>

                    <Pressable
                      style={styles.upsellPrimary}
                      onPress={() => Alert.alert("Superfriendz", "Abrimos checkout en el siguiente paso.")}
                    >
                      <Text style={styles.upsellPrimaryText}>Activar Superfriendz</Text>
                    </Pressable>

                    <Pressable style={styles.upsellSecondary} onPress={() => setShowUpsell(false)}>
                      <Text style={styles.upsellSecondaryText}>Mejor retiro una solicitud existente</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
}

function ConversationItem({
  conv,
  myId,
  onPress,
}: {
  conv: ConversationWithDetails;
  myId: string;
  onPress: () => void;
}) {
  const other = conv.participant_a === myId ? conv.profile_b : conv.profile_a;

  return (
    <Pressable style={styles.item} onPress={onPress}>
      <UserAvatar
        avatarUrl={other?.avatar_url}
        name={other?.full_name}
        size="md"
        verified={!!other?.verified_at}
      />
      <View style={styles.itemBody}>
        <View style={styles.itemRow}>
          <Text style={styles.itemName} numberOfLines={1}>
            {other?.full_name ?? "Usuario"}
          </Text>
          {conv.last_message_at && (
            <Text style={styles.itemTime}>{formatRelative(conv.last_message_at)}</Text>
          )}
        </View>
        {conv.listing && (
          <Text style={styles.itemSub} numberOfLines={1}>?? {conv.listing.title}</Text>
        )}
        {conv.last_message_preview ? (
          <Text style={styles.itemPreview} numberOfLines={1}>
            {conv.last_message_preview}
          </Text>
        ) : (
          <Text style={[styles.itemPreview, { fontStyle: "italic" }]}>Conversacion activa</Text>
        )}
      </View>
    </Pressable>
  );
}

function RequestItem({
  request,
  role,
  onPress,
}: {
  request: RequestWithDetails;
  role: "owner" | "requester";
  onPress: () => void;
}) {
  const variant =
    request.status === "accepted" ? "success"
      : request.status === "denied" ? "error"
        : request.status === "invited" ? "primary"
          : "warning";

  const label =
    request.status === "accepted" ? "Aceptada"
      : request.status === "denied" ? "Rechazada"
        : request.status === "invited" ? "Invitada"
          : "Pendiente";

  return (
    <Pressable style={styles.item} onPress={onPress}>
      {role === "owner" && request.requester ? (
        <UserAvatar
          avatarUrl={request.requester.avatar_url}
          name={request.requester.full_name}
          size="md"
          verified={!!request.requester.verified_at}
        />
      ) : (
        <View style={styles.iconWrap}>
          <Text style={{ fontSize: 22 }}>??</Text>
        </View>
      )}

      <View style={styles.itemBody}>
        <View style={styles.itemRow}>
          <Text style={[styles.itemName, { flex: 1 }]} numberOfLines={1}>
            {role === "owner"
              ? request.requester?.full_name ?? "Usuario"
              : request.listing?.title ?? "Anuncio"}
          </Text>
          <TagBadge label={label} variant={variant} />
        </View>
        <Text style={styles.itemSub} numberOfLines={1}>
          {role === "owner"
            ? `?? ${request.listing?.title ?? ""}`
            : `?? ${request.listing?.city ?? ""}`}
        </Text>
        {request.message && (
          <Text style={styles.itemPreview} numberOfLines={1}>{request.message}</Text>
        )}
      </View>
    </Pressable>
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

  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing[3],
    borderBottomWidth: 2,
    borderBottomColor: colors.transparent,
    gap: spacing[1],
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  tabBadge: {
    backgroundColor: colors.error,
    borderRadius: radius.full,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  tabBadgeText: { fontSize: 10, color: colors.white, fontWeight: "700" },

  list: { paddingVertical: spacing[1] },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3] + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  itemBody: { flex: 1, gap: 2 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[2],
  },
  itemName: { fontSize: fontSize.md, fontWeight: "700", color: colors.text, flex: 1 },
  itemTime: { fontSize: fontSize.xs, color: colors.textTertiary },
  itemSub: { fontSize: fontSize.xs, color: colors.textSecondary },
  itemPreview: { fontSize: fontSize.sm, color: colors.textSecondary },

  sentScroll: { padding: spacing[4], gap: spacing[3] },
  sentHeader: {
    backgroundColor: colors.text,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.gray700,
    gap: spacing[2],
  },
  sentHeaderReached: { borderColor: colors.warning },
  sentHeaderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sentTitle: { color: colors.white, fontSize: fontSize.lg, fontWeight: "700" },
  sentCount: { color: colors.gray300, fontSize: fontSize.sm, fontWeight: "600" },
  sentSub: { color: colors.gray300, fontSize: fontSize.xs, fontWeight: "600" },
  slotsRow: { flexDirection: "row", gap: spacing[1] },
  slotBar: {
    flex: 1,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.gray700,
  },
  slotBarActive: { backgroundColor: colors.white },
  slotBarReached: { backgroundColor: colors.warning },
  slotLabel: { color: colors.gray300, fontSize: fontSize.xs, fontWeight: "700", textAlign: "right" },
  slotLabelReached: { color: colors.warning },

  sentCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
    gap: spacing[2],
    marginTop: spacing[2],
  },
  sentCardTop: { flexDirection: "row", gap: spacing[2], alignItems: "flex-start" },
  sentCardTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  sentCardMeta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  sentCardTime: { fontSize: fontSize.xs, color: colors.textTertiary },
  sentActions: { flexDirection: "row", gap: spacing[2], marginTop: spacing[1] },
  sentActionGhost: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  sentActionGhostText: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: "600" },
  sentActionPrimary: {
    backgroundColor: colors.verify,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  sentActionPrimaryText: { color: colors.white, fontSize: fontSize.xs, fontWeight: "700" },

  slotAvailableCard: {
    marginTop: spacing[2],
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing[3],
    backgroundColor: colors.surface,
    gap: 2,
  },
  slotAvailableTitle: { fontSize: fontSize.sm, fontWeight: "700", color: colors.textSecondary },
  slotAvailableText: { fontSize: fontSize.xs, color: colors.textTertiary },

  limitBanner: {
    marginTop: spacing[3],
    backgroundColor: colors.warningLight,
    borderColor: colors.warning + "44",
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing[3],
    gap: spacing[1],
  },
  limitBannerTitle: { color: colors.warning, fontWeight: "700", fontSize: fontSize.sm },
  limitBannerText: { color: colors.warning, fontSize: fontSize.xs, lineHeight: 18 },

  blockedBtn: {
    marginTop: spacing[3],
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.warning,
    backgroundColor: colors.warningLight,
    paddingVertical: spacing[4],
    alignItems: "center",
  },
  blockedBtnText: { color: colors.warning, fontWeight: "700", fontSize: fontSize.md },
  exploreBtn: {
    marginTop: spacing[3],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing[4],
    alignItems: "center",
  },
  exploreBtnText: { color: colors.textSecondary, fontWeight: "700", fontSize: fontSize.md },

  dimmed: { opacity: 0.3 },
  upsellOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: spacing[4],
  },
  upsellCard: {
    backgroundColor: colors.surface,
    borderRadius: radius["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    gap: spacing[2],
  },
  upsellTitle: { fontSize: fontSize.lg, fontWeight: "800", color: colors.text },
  upsellSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: spacing[1] },
  upsellFeature: { fontSize: fontSize.sm, color: colors.text },
  upsellPrimary: {
    marginTop: spacing[2],
    backgroundColor: colors.text,
    borderRadius: radius.full,
    paddingVertical: spacing[3],
    alignItems: "center",
  },
  upsellPrimaryText: { color: colors.white, fontWeight: "700", fontSize: fontSize.md },
  upsellSecondary: { alignItems: "center", paddingVertical: spacing[2] },
  upsellSecondaryText: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: "600" },
});


