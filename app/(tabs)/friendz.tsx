import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { UserAvatar } from "../../src/components/ui/UserAvatar";
import { EmptyState } from "../../src/components/ui/EmptyState";
import {
  useMyFriendz,
  usePendingReceived,
  usePendingSent,
  useRespondConnection,
  useSearchUsers,
  type UserSearchResult,
} from "../../src/hooks/useConnections";
import { useAuth } from "../../src/providers/AuthProvider";
import { colors, fontSize, radius, spacing } from "../../src/theme";

type Tab = "friendz" | "received" | "sent" | "search";

export default function FriEndzScreen() {
  const { session } = useAuth();
  const myId = session?.user?.id;
  const [tab, setTab] = useState<Tab>("friendz");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: friendz = [], isLoading: loadingFriendz } = useMyFriendz(myId);
  const { data: received = [], isLoading: loadingReceived } = usePendingReceived(myId);
  const { data: sent = [], isLoading: loadingSent } = usePendingSent(myId);
  const { data: searchResults = [], isLoading: loadingSearch } = useSearchUsers(searchQuery);

  const pendingCount = received.length;

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "friendz", label: "Mis friendz" },
    { key: "received", label: "Recibidas", badge: pendingCount || undefined },
    { key: "sent", label: "Enviadas" },
    { key: "search", label: "Buscar" },
  ];

  const isLoading =
    tab === "friendz" ? loadingFriendz
    : tab === "received" ? loadingReceived
    : tab === "sent" ? loadingSent
    : false;

  return (
    <View style={styles.screen}>
      {/* Tab bar */}
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

      {/* Search bar (only in search tab) */}
      {tab === "search" && (
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o @usuario…"
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: spacing[8] }} color={colors.primary} />
      ) : (
        <>
          {tab === "friendz" && (
            <FlatList
              data={friendz}
              keyExtractor={(f) => f.connectionId}
              contentContainerStyle={friendz.length === 0 ? { flex: 1 } : styles.list}
              renderItem={({ item }) => (
                <UserRow
                  user={item}
                  onPress={() => router.push(`/profile/${item.id}`)}
                />
              )}
              ListEmptyComponent={
                <EmptyState
                  icon="👥"
                  title="Aún no tienes friendz"
                  subtitle="Busca a personas que conoces y envía solicitudes de conexión."
                  action={{ label: "Buscar personas", onPress: () => setTab("search") }}
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
                <PendingReceivedRow
                  connectionId={item.id}
                  user={item.requester}
                  myId={myId ?? ""}
                />
              )}
              ListEmptyComponent={
                <EmptyState
                  icon="📩"
                  title="Sin solicitudes recibidas"
                  subtitle="Cuando alguien te añada como friendz aparecerá aquí."
                />
              }
            />
          )}

          {tab === "sent" && (
            <FlatList
              data={sent}
              keyExtractor={(s) => s.id}
              contentContainerStyle={sent.length === 0 ? { flex: 1 } : styles.list}
              renderItem={({ item }) => (
                <UserRow
                  user={item.addressee}
                  subtitle="Solicitud pendiente"
                  onPress={() => router.push(`/profile/${item.addressee.id}`)}
                />
              )}
              ListEmptyComponent={
                <EmptyState
                  icon="📤"
                  title="Sin solicitudes enviadas"
                  subtitle="Busca personas y envía tu primera solicitud."
                  action={{ label: "Buscar personas", onPress: () => setTab("search") }}
                />
              }
            />
          )}

          {tab === "search" && (
            <FlatList
              data={searchResults}
              keyExtractor={(u) => u.id}
              contentContainerStyle={
                searchQuery.length < 2 || searchResults.length === 0 ? { flex: 1 } : styles.list
              }
              renderItem={({ item }) => (
                <UserRow
                  user={item}
                  onPress={() => router.push(`/profile/${item.id}`)}
                />
              )}
              ListEmptyComponent={
                loadingSearch ? (
                  <ActivityIndicator style={{ marginTop: spacing[8] }} color={colors.primary} />
                ) : (
                  <EmptyState
                    icon="🔍"
                    title={searchQuery.length < 2 ? "Empieza a escribir" : "Sin resultados"}
                    subtitle={
                      searchQuery.length < 2
                        ? "Escribe al menos 2 caracteres para buscar."
                        : `No encontramos a nadie con "${searchQuery}".`
                    }
                  />
                )
              }
            />
          )}
        </>
      )}
    </View>
  );
}

// ─── User row ──────────────────────────────────────────────────────────────────

function UserRow({
  user,
  subtitle,
  onPress,
}: {
  user: UserSearchResult;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <UserAvatar
        avatarUrl={user.avatar_url}
        name={user.full_name}
        size="md"
        verified={!!user.verified_at}
      />
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {user.full_name ?? user.username ?? "Usuario"}
        </Text>
        {user.username && !subtitle && (
          <Text style={styles.rowSub}>@{user.username}</Text>
        )}
        {user.city && !subtitle && (
          <Text style={styles.rowSub}>📍 {user.city}</Text>
        )}
        {subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

// ─── Pending received row (with accept/reject) ─────────────────────────────────

function PendingReceivedRow({
  connectionId,
  user,
  myId,
}: {
  connectionId: string;
  user: UserSearchResult;
  myId: string;
}) {
  const respond = useRespondConnection();
  return (
    <View style={styles.row}>
      <Pressable
        style={styles.rowLeft}
        onPress={() => router.push(`/profile/${user.id}`)}
      >
        <UserAvatar
          avatarUrl={user.avatar_url}
          name={user.full_name}
          size="md"
          verified={!!user.verified_at}
        />
        <View style={styles.rowBody}>
          <Text style={styles.rowName} numberOfLines={1}>
            {user.full_name ?? user.username ?? "Usuario"}
          </Text>
          {user.city && <Text style={styles.rowSub}>📍 {user.city}</Text>}
        </View>
      </Pressable>
      <View style={styles.rowActions}>
        <Pressable
          style={[styles.actionBtn, styles.actionAccept]}
          onPress={() =>
            respond.mutate({ connectionId, accept: true, myId, otherId: user.id })
          }
          disabled={respond.isPending}
        >
          <Text style={styles.actionAcceptText}>✓</Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, styles.actionReject]}
          onPress={() =>
            respond.mutate({ connectionId, accept: false, myId, otherId: user.id })
          }
          disabled={respond.isPending}
        >
          <Text style={styles.actionRejectText}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
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
  tabText: { fontSize: 11, fontWeight: "600", color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  tabBadge: {
    backgroundColor: colors.error,
    borderRadius: radius.full,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  tabBadgeText: { fontSize: 9, color: colors.white, fontWeight: "700" },

  searchBar: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2] + 2,
    fontSize: fontSize.sm,
    color: colors.text,
  },

  list: { paddingVertical: spacing[1] },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing[3] },
  rowBody: { flex: 1, gap: 2 },
  rowName: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  rowSub: { fontSize: fontSize.xs, color: colors.textSecondary },
  chevron: { fontSize: 20, color: colors.textTertiary, marginLeft: "auto" },

  rowActions: { flexDirection: "row", gap: spacing[2] },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  actionAccept: { backgroundColor: colors.primaryLight },
  actionAcceptText: { color: colors.primaryDark, fontWeight: "700", fontSize: 16 },
  actionReject: { backgroundColor: "#fee2e2" },
  actionRejectText: { color: colors.error, fontWeight: "700", fontSize: 14 },
});
