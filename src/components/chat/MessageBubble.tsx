import { StyleSheet, Text, View } from "react-native";

import { colors, fontSize, radius, spacing } from "../../theme";

type Props = {
  content: string;
  createdAt: string;
  isMine: boolean;
  readAt?: string | null;
};

export function MessageBubble({ content, createdAt, isMine, readAt }: Props) {
  return (
    <View style={[styles.row, isMine && styles.rowMine]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text style={[styles.text, isMine && styles.textMine]}>{content}</Text>
        <View style={styles.meta}>
          <Text style={[styles.time, isMine && styles.timeMine]}>
            {formatTime(createdAt)}
          </Text>
          {isMine && (
            <Text style={[styles.read, readAt && styles.readDone]}>
              {readAt ? " ✓✓" : " ✓"}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) {
    return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginBottom: spacing[1] + 2,
    paddingHorizontal: spacing[3],
  },
  rowMine: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: radius["2xl"],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2] + 2,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm,
  },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  textMine: {
    color: colors.white,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 3,
    gap: 1,
  },
  time: {
    fontSize: 10,
    color: colors.textTertiary,
  },
  timeMine: {
    color: "rgba(255,255,255,0.7)",
  },
  read: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
  },
  readDone: {
    color: "rgba(255,255,255,0.9)",
  },
});
