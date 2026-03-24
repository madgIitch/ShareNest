import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  useMarkRead,
  useSendMessage,
} from "../../src/hooks/useConversations";
import { useListing } from "../../src/hooks/useListings";
import { useProperty } from "../../src/hooks/useProperties";
import { useAcceptOffer, useConfirmAssignment, useRequest, useRollbackOffer, useUpdateRequestStatus } from "../../src/hooks/useRequests";
import type { OfferTerms } from "../../src/hooks/useRequests";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/providers/AuthProvider";
import { colors, fontSize, radius, spacing } from "../../src/theme";
import type { Database } from "../../src/types/database";

type Message = Database["public"]["Tables"]["messages"]["Row"];
type BillsMode = "included" | "separate" | "none";
type BillsKey = "agua" | "luz" | "gas" | "internet" | "limpieza" | "comunidad" | "calefaccion";

const BILL_LABELS: Record<BillsKey, string> = {
  agua: "Agua",
  luz: "Luz",
  gas: "Gas",
  internet: "Internet",
  limpieza: "Limpieza",
  comunidad: "Comunidad",
  calefaccion: "Calefacción",
};

function getBillsLabel(mode: OfferTerms["bills_mode"] | string | null | undefined) {
  if (mode === "included") return "Incluidos";
  if (mode === "none") return "No hay";
  return "Aparte";
}

function parseBillsConfig(raw: Database["public"]["Tables"]["properties"]["Row"]["bills_config"] | null | undefined) {
  const included: string[] = [];
  const separate: string[] = [];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { included, separate };
  }
  for (const key of Object.keys(BILL_LABELS) as BillsKey[]) {
    const value = (raw as Record<string, unknown>)[key];
    const mode: BillsMode =
      value === true ? "included" : value === "included" || value === "separate" || value === "none" ? value : "none";
    if (mode === "included") included.push(BILL_LABELS[key]);
    if (mode === "separate") separate.push(BILL_LABELS[key]);
  }
  return { included, separate };
}

function getStatusLabel(status: string) {
  if (status === "invited") return "Chat aceptado";
  if (status === "offered") return "Oferta enviada";
  if (status === "accepted") return "Oferta aceptada";
  if (status === "assigned") return "Habitacion asignada";
  if (status === "denied") return "Solicitud denegada";
  return "Solicitud pendiente";
}

function getStatusSubLabel(
  status: string,
  isOwnerInRequest: boolean,
  requesterConfirmedAt: string | null,
  ownerConfirmedAt: string | null,
) {
  if (status === "pending") {
    return isOwnerInRequest
      ? "Revisa el perfil y decide si quieres iniciar la conversación."
      : "Tu solicitud está pendiente de revisión por el propietario.";
  }
  if (status === "invited") {
    return isOwnerInRequest
      ? "Chat activo · Envía la oferta cuando estés listo."
      : "Chat activo · El propietario te enviará una oferta cuando esté listo.";
  }
  if (status === "offered") {
    return isOwnerInRequest
      ? "Oferta enviada. Esperando respuesta del buscador."
      : "Tienes una oferta pendiente. Revísala y decide si la aceptas.";
  }
  if (status === "accepted") {
    return `Confirmaciones: buscador ${requesterConfirmedAt ? "ok" : "pendiente"} · propietario ${ownerConfirmedAt ? "ok" : "pendiente"}`;
  }
  if (status === "assigned") {
    return "Asignación completada.";
  }
  if (status === "denied") {
    return "Esta solicitud se cerró.";
  }
  return "";
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const myId = session?.user?.id ?? "";

  const { data: conv } = useConversation(id);
  const { data: messages = [], isLoading } = useConversationMessages(id);
  const { data: request } = useRequest(conv?.request_id ?? undefined);
  const { data: listing } = useListing(conv?.listing_id ?? undefined);
  const { data: property } = useProperty(listing?.property_id ?? undefined);

  const sendMessage = useSendMessage();
  const markRead = useMarkRead();
  const updateRequest = useUpdateRequestStatus();
  const rollbackOffer = useRollbackOffer();
  const acceptOffer = useAcceptOffer();
  const confirmAssignment = useConfirmAssignment();

  const [input, setInput] = useState("");
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const flatListRef = useRef<FlatList<Message>>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const other = conv ? (conv.participant_a === myId ? conv.profile_b : conv.profile_a) : null;
  const isOwnerInRequest = request?.owner_id === myId;
  const isRequesterInRequest = request?.requester_id === myId;

  const offerTerms = (request?.offer_terms ?? null) as OfferTerms | null;

  const hasConfirmed = request
    ? isOwnerInRequest
      ? !!request.owner_confirmed_at
      : isRequesterInRequest
        ? !!request.requester_confirmed_at
        : false
    : false;

  const canAcceptOffer = !!request
    && request.status === "offered"
    && isRequesterInRequest
    && listing?.status !== "rented";
  const canWithdrawOffer = !!request
    && request.status === "offered"
    && isOwnerInRequest
    && !request.requester_confirmed_at
    && !request.owner_confirmed_at
    && listing?.status !== "rented";

  const canConfirmAssignment = !!request
    && (request.status === "accepted" || request.status === "assigned")
    && (isOwnerInRequest || isRequesterInRequest)
    && !hasConfirmed
    && listing?.status !== "rented";

  const canSendOfferFromChat = !!request
    && (request.status === "pending" || request.status === "invited")
    && isOwnerInRequest
    && listing?.status !== "rented";

  const isReadOnly = listing?.status === "rented";
  const billBreakdown = parseBillsConfig(property?.bills_config);

  useEffect(() => {
    if (id && myId) void markRead.mutateAsync({ conversationId: id, myId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, myId]);

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
      void markRead.mutateAsync({ conversationId: id, myId });
    } catch {
      setInput(content);
    }
  };

  const handleAcceptOffer = async () => {
    if (!request) return;
    try {
      const convId = await acceptOffer.mutateAsync(request.id);
      if (convId && convId !== id) {
        router.replace(`/conversation/${convId}`);
      }
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    }
  };

  const buildDefaultTerms = (): OfferTerms => ({
    price: listing?.price ?? null,
    available_from: listing?.available_from ?? null,
    min_stay_months: listing?.min_stay_months ?? null,
    bills_mode: "extra",
  });

  const handleSendOfferFromChat = async () => {
    if (!request) return;
    const terms = buildDefaultTerms();
    if (!terms.price || terms.price <= 0) {
      Alert.alert("Completa la oferta", "Define un precio válido antes de enviar la oferta formal.");
      return;
    }
    if (!terms.available_from) {
      Alert.alert("Completa la oferta", "Indica la fecha de disponibilidad antes de enviar la oferta formal.");
      return;
    }
    try {
      await updateRequest.mutateAsync({
        request,
        status: "offered",
        offerTerms: terms,
      });
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    }
  };

  const handleWithdrawOffer = async () => {
    if (!request) return;
    Alert.alert("Retirar oferta", "Puedes retirarla ahora y volver a enviarla con nuevos términos.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Retirar",
        style: "destructive",
        onPress: async () => {
          try {
            await rollbackOffer.mutateAsync(request);
          } catch (err) {
            Alert.alert("Error", (err as Error).message);
          }
        },
      },
    ]);
  };

  const handleConfirmAssignment = async () => {
    if (!request) return;
    try {
      const result = await confirmAssignment.mutateAsync(request.id);
      if (result?.assignment_completed) {
        Alert.alert("Asignacion completada", "La habitacion ha quedado asignada y el piso ya esta creado.", [
          {
            text: "Ir al piso",
            onPress: () => router.push("/(tabs)/household"),
          },
          { text: "Cerrar", style: "cancel" },
        ]);
      } else {
        Alert.alert("Confirmacion registrada", "Falta la confirmacion de la otra parte.");
      }
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    }
  };

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
      {other && (
        <Pressable
          style={styles.header}
          onPress={() => router.push(`/profile/${other.id}`)}
          accessibilityRole="button"
        >
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
                {conv.listing.title}
              </Text>
            )}
          </View>
        </Pressable>
      )}

      {request && (
        <View style={styles.statusBanner}>
          <Text style={styles.statusBannerText}>{getStatusLabel(request.status)}</Text>
          <Text style={styles.statusBannerSub}>
            {getStatusSubLabel(request.status, isOwnerInRequest, request.requester_confirmed_at, request.owner_confirmed_at)}
          </Text>
        </View>
      )}

      {canSendOfferFromChat && (
        <View style={styles.preOfferCard}>
          <Text style={styles.preOfferTitle}>Ya puedes enviar oferta</Text>
          <Text style={styles.preOfferText}>
            El chat esta abierto. Cuando quieras, envia la oferta formal con precio y condiciones.
          </Text>
          <Pressable
            style={[styles.preOfferBtn, updateRequest.isPending && styles.btnDisabled]}
            onPress={handleSendOfferFromChat}
            disabled={updateRequest.isPending || rollbackOffer.isPending}
          >
            {updateRequest.isPending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.preOfferBtnText}>Enviar oferta</Text>
            )}
          </Pressable>
        </View>
      )}

      {!!request && !!offerTerms && (
        <View style={styles.offerCard}>
          <Text style={styles.offerCardTitle}>Oferta de habitación</Text>
          <View style={styles.offerGrid}>
            <View style={styles.offerCell}>
              <Text style={styles.offerKey}>Precio</Text>
              <Text style={styles.offerVal}>{offerTerms.price ? `${offerTerms.price} \u20AC/mes` : "-"}</Text>
            </View>
            <View style={styles.offerCell}>
              <Text style={styles.offerKey}>Disponible desde</Text>
              <Text style={styles.offerVal}>{offerTerms.available_from ?? "-"}</Text>
            </View>
            <View style={styles.offerCell}>
              <Text style={styles.offerKey}>Estancia mínima</Text>
              <Text style={styles.offerVal}>
                {offerTerms.min_stay_months ? `${offerTerms.min_stay_months} meses` : "Flexible"}
              </Text>
            </View>
            <View style={styles.offerCell}>
              <Text style={styles.offerKey}>Gastos</Text>
              <Text style={styles.offerVal}>{getBillsLabel(offerTerms.bills_mode)}</Text>
            </View>
          </View>

          <View style={styles.billsDetail}>
            <Text style={styles.billsDetailLabel}>
              Incluidos: {billBreakdown.included.length > 0 ? billBreakdown.included.join(", ") : "ninguno"}
            </Text>
            <Text style={styles.billsDetailLabel}>
              Aparte: {billBreakdown.separate.length > 0 ? billBreakdown.separate.join(", ") : "ninguno"}
            </Text>
          </View>

          <View style={styles.offerActions}>
            {canAcceptOffer && (
              <Pressable
                style={[styles.primaryBtn, acceptOffer.isPending && styles.btnDisabled]}
                onPress={handleAcceptOffer}
                disabled={acceptOffer.isPending}
              >
                <Text style={styles.primaryBtnText}>Aceptar oferta</Text>
              </Pressable>
            )}

            {canWithdrawOffer && (
              <>
                <View style={styles.offerPendingPill}>
                  <Text style={styles.offerPendingText}>Oferta enviada · pendiente de aceptación</Text>
                </View>
                <Pressable
                  style={[styles.outlineBtn, (updateRequest.isPending || rollbackOffer.isPending) && styles.btnDisabled]}
                  onPress={handleWithdrawOffer}
                  disabled={updateRequest.isPending || rollbackOffer.isPending}
                >
                  <Text style={styles.outlineBtnText}>Retirar oferta</Text>
                </Pressable>
              </>
            )}

            {canConfirmAssignment && (
              <Pressable
                style={[styles.secondaryBtn, confirmAssignment.isPending && styles.btnDisabled]}
                onPress={handleConfirmAssignment}
                disabled={confirmAssignment.isPending}
              >
                <Text style={styles.secondaryBtnText}>Confirmar asignación</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

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
            isSystem={item.is_system}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatText}>Este chat aun no tiene mensajes.</Text>
          </View>
        }
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {otherIsTyping && (
        <View style={styles.typingRow}>
          <Text style={styles.typingText}>{other?.full_name ?? "El otro usuario"} esta escribiendo...</Text>
        </View>
      )}

      {isReadOnly && (
        <View style={styles.readOnlyBar}>
          <Text style={styles.readOnlyText}>
            Conversacion en solo lectura: esta habitacion ya esta alquilada.
          </Text>
        </View>
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={[styles.input, isReadOnly && styles.inputDisabled]}
          placeholder={isReadOnly ? "Chat bloqueado por asignacion confirmada" : "Escribe un mensaje..."}
          placeholderTextColor={colors.textTertiary}
          value={input}
          onChangeText={(t) => {
            setInput(t);
            broadcastTyping();
          }}
          multiline
          maxLength={1000}
          returnKeyType="default"
          editable={!isReadOnly}
        />
        <Pressable
          style={[styles.sendBtn, (!input.trim() || isReadOnly) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={isReadOnly || !input.trim() || sendMessage.isPending}
        >
          {sendMessage.isPending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.sendBtnText}>+</Text>
          )}
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

  statusBanner: {
    backgroundColor: colors.purpleLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.purple + "33",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: 2,
  },
  statusBannerText: { color: colors.purple, fontSize: fontSize.sm, fontWeight: "700" },
  statusBannerSub: { color: colors.textSecondary, fontSize: fontSize.xs },
  preOfferCard: {
    margin: spacing[3],
    marginBottom: spacing[2],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing[3],
    gap: spacing[2],
  },
  preOfferTitle: { color: colors.text, fontWeight: "800", fontSize: fontSize.md },
  preOfferText: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },
  preOfferBtn: {
    alignSelf: "flex-start",
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  preOfferBtnText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: "700" },

  offerCard: {
    margin: spacing[3],
    marginBottom: spacing[2],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.purple + "55",
    borderRadius: radius.xl,
    padding: spacing[3],
    gap: spacing[2],
  },
  offerCardTitle: { color: colors.text, fontWeight: "800", fontSize: fontSize.md },
  offerGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  offerCell: {
    width: "48%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing[2],
    gap: 2,
  },
  offerKey: { color: colors.textTertiary, fontSize: fontSize.xs, fontWeight: "600" },
  offerVal: { color: colors.text, fontSize: fontSize.sm, fontWeight: "700" },
  billsDetail: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing[2],
    gap: 4,
    backgroundColor: colors.gray100,
  },
  billsDetailLabel: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: "600" },
  offerActions: { gap: spacing[2], marginTop: spacing[1] },
  primaryBtn: {
    backgroundColor: colors.verify,
    borderRadius: radius.full,
    paddingVertical: spacing[2],
    alignItems: "center",
  },
  primaryBtnText: { color: colors.white, fontSize: fontSize.sm, fontWeight: "700" },
  secondaryBtn: {
    backgroundColor: colors.text,
    borderRadius: radius.full,
    paddingVertical: spacing[2],
    alignItems: "center",
  },
  secondaryBtnText: { color: colors.white, fontSize: fontSize.sm, fontWeight: "700" },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: colors.text,
    borderRadius: radius.full,
    paddingVertical: spacing[2],
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  outlineBtnText: { color: colors.text, fontSize: fontSize.sm, fontWeight: "700" },
  offerPendingPill: {
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  offerPendingText: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: "700" },
  btnDisabled: { opacity: 0.6 },

  messageList: { flexGrow: 1, paddingVertical: spacing[2] },
  emptyChat: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[8],
  },
  emptyChatText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },

  typingRow: { paddingHorizontal: spacing[4], paddingBottom: spacing[1] },
  typingText: { fontSize: fontSize.xs, color: colors.textTertiary, fontStyle: "italic" },

  readOnlyBar: {
    backgroundColor: colors.warningLight,
    borderTopWidth: 1,
    borderTopColor: colors.warning + "66",
    borderBottomWidth: 1,
    borderBottomColor: colors.warning + "66",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  readOnlyText: { fontSize: fontSize.xs, color: colors.warning, fontWeight: "700" },

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
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius["2xl"],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2] + 2,
    fontSize: fontSize.sm,
    color: colors.text,
    maxHeight: 120,
  },
  inputDisabled: {
    backgroundColor: colors.gray100,
    color: colors.textTertiary,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { backgroundColor: colors.gray300 },
  sendBtnText: { color: colors.white, fontSize: 18, fontWeight: "700", lineHeight: 22 },
});


