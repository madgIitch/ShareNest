import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { MessageBubble } from "../../src/components/chat/MessageBubble";
import { UserAvatar } from "../../src/components/ui/UserAvatar";
import {
  useConversation,
  useConversationMessages,
  useSendMessage,
  useMarkRead,
} from "../../src/hooks/useConversations";
import { useAuth } from "../../src/providers/AuthProvider";
import { supabase } from "../../src/lib/supabase";
import { colors, fontSize, radius, spacing } from "../../src/theme";
import type { Database } from "../../src/types/database";

type Message = Database["public"]["Tables"]["messages"]["Row"];

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const myId = session?.user?.id ?? "";

  const { data: conv } = useConversation(id);
  const { data: messages = [], isLoading } = useConversationMessages(id);
  const sendMessage = useSendMessage();
  const markRead = useMarkRead();

  const [input, setInput] = useState("");
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const flatListRef = useRef<FlatList<Message>>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Determine the other participant
  const other = conv
    ? conv.participant_a === myId
      ? conv.profile_b
      : conv.profile_a
    : null;

  // Mark messages as read on open
  useEffect(() => {
    if (id && myId) {
      void markRead.mutateAsync({ conversationId: id, myId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, myId]);

  // Typing indicator via broadcast
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`typing:${id}`)
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.userId !== myId) {
          setOtherIsTyping(true);
          if (typingTimeout.current) clearTimeout(typingTimeout.current);
          typingTimeout.current = setTimeout(() => setOtherIsTyping(false), 2500);
        }
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [id, myId]);

  const broadcastTyping = () => {
    if (!id) return;
    supabase.channel(`typing:${id}`).send({
      type: "broadcast",
      event: "typing",
      payload: { userId: myId },
    });
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || !id) return;
    setInput("");
    try {
      await sendMessage.mutateAsync({ conversationId: id, senderId: myId, content });
      // Mark own sent message as triggering a read refresh
      void markRead.mutateAsync({ conversationId: id, myId });
    } catch {
      setInput(content); // restore on error
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={88}
    >
      {/* Other user header */}
      {other && (
        <View style={styles.header}>
          <UserAvatar
            avatarUrl={other.avatar_url}
            name={other.full_name}
            size="sm"
            verified={!!other.verified_at}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{other.full_name ?? "Usuario"}</Text>
            {conv?.listing && (
              <Text style={styles.headerListing} numberOfLines={1}>
                🏠 {conv.listing.title}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => (
          <MessageBubble
            content={item.content}
            createdAt={item.created_at}
            isMine={item.sender_id === myId}
            readAt={item.read_at}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatText}>
              ¡Solicitud aceptada! Empieza la conversación.
            </Text>
          </View>
        }
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
      />

      {/* Typing indicator */}
      {otherIsTyping && (
        <View style={styles.typingRow}>
          <Text style={styles.typingText}>
            {other?.full_name ?? "El otro usuario"} está escribiendo...
          </Text>
        </View>
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          placeholderTextColor={colors.textTertiary}
          value={input}
          onChangeText={(t) => {
            setInput(t);
            broadcastTyping();
          }}
          multiline
          maxLength={1000}
          returnKeyType="default"
        />
        <Pressable
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || sendMessage.isPending}
        >
          {sendMessage.isPending
            ? <ActivityIndicator size="small" color={colors.white} />
            : <Text style={styles.sendBtnText}>↑</Text>
          }
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  headerListing: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 1 },

  messageList: {
    flexGrow: 1,
    paddingVertical: spacing[3],
  },

  emptyChat: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[8],
    gap: spacing[2],
  },
  emptyChatText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },

  typingRow: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[1],
  },
  typingText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontStyle: "italic",
  },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.gray100,
    borderRadius: radius["2xl"],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2] + 2,
    fontSize: fontSize.sm,
    color: colors.text,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    backgroundColor: colors.gray300,
  },
  sendBtnText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
  },
});
