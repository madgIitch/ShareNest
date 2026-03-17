import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import type { PropsWithChildren } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { colors, fontSize, radius, spacing } from "../theme";

type ToastType = "success" | "error" | "info";

type ToastContextValue = {
  show: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TYPE_COLORS: Record<ToastType, string> = {
  success: colors.success,
  error: colors.error,
  info: colors.primary,
};

export function ToastProvider({ children }: PropsWithChildren) {
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ToastType>("info");
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string, toastType: ToastType = "info") => {
    if (timerRef.current) clearTimeout(timerRef.current);

    setMessage(msg);
    setType(toastType);

    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2400),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    timerRef.current = setTimeout(() => setMessage(""), 2800);
  }, [opacity]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message ? (
        <Animated.View
          style={[
            styles.toast,
            { backgroundColor: TYPE_COLORS[type], opacity },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 90,
    left: spacing[5],
    right: spacing[5],
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  toastText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: "600",
    textAlign: "center",
  },
});
