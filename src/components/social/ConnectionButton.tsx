import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import {
  useConnectionRelation,
  useRemoveConnection,
  useRespondConnection,
  useSendConnection,
} from "../../hooks/useConnections";
import { colors, fontSize, radius, spacing } from "../../theme";

type Props = {
  myId: string;
  otherId: string;
};

export function ConnectionButton({ myId, otherId }: Props) {
  const { data, isLoading } = useConnectionRelation(myId, otherId);
  const sendConnection = useSendConnection();
  const respondConnection = useRespondConnection();
  const removeConnection = useRemoveConnection();

  const isPending =
    sendConnection.isPending || respondConnection.isPending || removeConnection.isPending;

  if (isLoading) return <ActivityIndicator color={colors.primary} />;

  const relation = data?.relation ?? "none";
  const connectionId = data?.connectionId ?? null;

  if (relation === "accepted") {
    return (
      <Pressable
        style={[styles.btn, styles.btnOutline]}
        onPress={() => connectionId && removeConnection.mutate({ connectionId })}
        disabled={isPending}
      >
        <Text style={[styles.btnText, styles.btnOutlineText]}>✓ Friendz</Text>
      </Pressable>
    );
  }

  if (relation === "pending_sent") {
    return (
      <Pressable style={[styles.btn, styles.btnMuted]} disabled>
        <Text style={[styles.btnText, styles.btnMutedText]}>Solicitud enviada</Text>
      </Pressable>
    );
  }

  if (relation === "pending_received") {
    return (
      <>
        <Pressable
          style={[styles.btn, styles.btnPrimary]}
          onPress={() =>
            connectionId &&
            respondConnection.mutate({ connectionId, accept: true, myId, otherId })
          }
          disabled={isPending}
        >
          <Text style={[styles.btnText, styles.btnPrimaryText]}>Aceptar</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.btnOutline]}
          onPress={() =>
            connectionId &&
            respondConnection.mutate({ connectionId, accept: false, myId, otherId })
          }
          disabled={isPending}
        >
          <Text style={[styles.btnText, styles.btnOutlineText]}>Rechazar</Text>
        </Pressable>
      </>
    );
  }

  // none
  return (
    <Pressable
      style={[styles.btn, styles.btnPrimary]}
      onPress={() => sendConnection.mutate({ requesterId: myId, addresseeId: otherId })}
      disabled={isPending}
    >
      <Text style={[styles.btnText, styles.btnPrimaryText]}>+ Añadir friendz</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2] + 2,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 140,
  },
  btnText: {
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnPrimaryText: {
    color: colors.white,
  },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  btnOutlineText: {
    color: colors.primary,
  },
  btnMuted: {
    backgroundColor: colors.gray100,
  },
  btnMutedText: {
    color: colors.textSecondary,
  },
});
