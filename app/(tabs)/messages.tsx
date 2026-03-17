import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { UserAvatar } from "../../src/components/ui/UserAvatar";
import { TagBadge } from "../../src/components/ui/TagBadge";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { useConversations } from "../../src/hooks/useConversations";
import { useReceivedRequests, useSentRequests } from "../../src/hooks/useRequests";
import { useAuth } from "../../src/providers/AuthProvider";
import { colors, fontSize, radius, spacing } from "../../src/theme";
import type { ConversationWithDetails } from "../../src/hooks/useConversations";
import type { RequestWithDetails } from "../../src/hooks/useRequests";

type Tab = "chats" | "received" | "sent";

export default function MessagesScreen() {
  const { session } = useAuth();
  const myId = session?.user?.id;
  const [tab, setTab] = useState<Tab>("chats");

  const { data: conversations = [], isLoading: convLoading } = useConversations(myId);
  const { data: received = [], isLoading: recvLoading } = useReceivedRequests(myId);
  const { data: sent = [], isLoading: sentLoading } = useSentRequests(myId);

  const pendingCount = received.filter((r) => r.status === "pending").length;
  const isLoading = convLoading || recvLoading || sentLoading;

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "chats", label: "Chats" },
    { key: "received", label: "Recibidas", badge: pendingCount || undefined },
    { key: "sent", label: "Enviadas" },
  ];

  return (
    <View style={styles.screen}>
      {/* Tab selector */}
      <View style={styles.tabBar}>
        {tabs.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
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
                  icon="💬"
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
                  icon="📩"
                  title="Sin solicitudes recibidas"
                  subtitle="Cuando alguien esté interesado en tu anuncio, verás su solicitud aquí."
                />
              }
            />
          )}

          {tab === "sent" && (
            <FlatList
              data={sent}
              keyExtractor={(r) => r.id}
              contentContainerStyle={sent.length === 0 ? { flex: 1 } : styles.list}
              renderItem={({ item }) => (
                <RequestItem
                  request={item}
                  role="requester"
                  onPress={() => router.push(`/requests/${item.id}`)}
                />
              )}
              ListEmptyComponent={
                <EmptyState
                  icon="📤"
                  title="Sin solicitudes enviadas"
                  subtitle="Encuentra un anuncio y envía tu primera solicitud."
                  action={{ label: "Explorar", onPress: () => router.push("/(tabs)/explore") }}
                />
              }
            />
          )}
        </>
      )}
    </View>
  );
}

// ─── Conversation list item ────────────────────────────────────────────────────

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
          <Text style={styles.itemSub} numberOfLines={1}>🏠 {conv.listing.title}</Text>
        )}
        {conv.last_message_preview ? (
          <Text style={styles.itemPreview} numberOfLines={1}>
            {conv.last_message_preview}
          </Text>
        ) : (
          <Text style={[styles.itemPreview, { fontStyle: "italic" }]}>Conversación activa</Text>
        )}
      </View>
    </Pressable>
  );
}

// ─── Request list item ─────────────────────────────────────────────────────────

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
    : "warning";

  const label =
    request.status === "accepted" ? "Aceptada"
    : request.status === "denied" ? "Denegada"
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
          <Text style={{ fontSize: 22 }}>🏠</Text>
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
            ? `🏠 ${request.listing?.title ?? ""}`
            : `📍 ${request.listing?.city ?? ""}`}
        </Text>
        {request.message && (
          <Text style={styles.itemPreview} numberOfLines={1}>{request.message}</Text>
        )}
      </View>
    </Pressable>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
});
