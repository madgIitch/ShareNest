import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { BottomSheet } from "../ui/BottomSheet";
import { colors, fontSize, radius, spacing } from "../../theme";
import { useSendRequest } from "../../hooks/useRequests";

type Props = {
  visible: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  ownerId: string;
  requesterId: string;
};

export function SendRequestSheet({
  visible,
  onClose,
  listingId,
  listingTitle,
  ownerId,
  requesterId,
}: Props) {
  const [message, setMessage] = useState("");
  const sendRequest = useSendRequest();

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert("Mensaje requerido", "Escribe un mensaje de presentacion.");
      return;
    }
    try {
      await sendRequest.mutateAsync({ listingId, requesterId, ownerId, message: message.trim() });
      setMessage("");
      onClose();
      Alert.alert("Solicitud enviada", "El anunciante recibira tu solicitud pronto.");
    } catch (err) {
      const errorWithCode = err as Error & { code?: string };
      if (errorWithCode.code === "LIMIT_REACHED") {
        onClose();
        router.push({
          pathname: "/(tabs)/messages",
          params: {
            tab: "sent",
            upsell: "1",
            fromListingId: listingId,
            fromListingTitle: listingTitle,
          },
        });
        return;
      }
      Alert.alert("Error", errorWithCode.message);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} snapPoint={420}>
      <View style={styles.container}>
        <Text style={styles.title}>Solicitar habitacion</Text>
        <Text style={styles.listing} numberOfLines={2}>?? {listingTitle}</Text>

        <Text style={styles.label}>Mensaje de presentacion</Text>
        <Text style={styles.hint}>
          Cuentale al anunciante quien eres, cuando necesitas la habitacion y por que encajarias.
        </Text>

        <TextInput
          style={styles.textarea}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          placeholder="Hola, me llamo... Busco habitacion desde... Soy..."
          placeholderTextColor={colors.textTertiary}
          value={message}
          onChangeText={setMessage}
          maxLength={500}
        />
        <Text style={styles.counter}>{message.length}/500</Text>

        <Pressable
          style={[styles.btn, sendRequest.isPending && styles.btnDisabled]}
          onPress={handleSend}
          disabled={sendRequest.isPending}
        >
          {sendRequest.isPending
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.btnText}>Enviar solicitud</Text>
          }
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[1],
    gap: spacing[3],
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
  },
  listing: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    backgroundColor: colors.gray100,
    borderRadius: radius.xl,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: -spacing[2],
    lineHeight: 18,
  },
  textarea: {
    backgroundColor: colors.gray100,
    borderRadius: radius.xl,
    padding: spacing[4],
    fontSize: fontSize.sm,
    color: colors.text,
    minHeight: 120,
  },
  counter: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: "right",
    marginTop: -spacing[2],
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: fontSize.md,
  },
});
