import { Component } from "react";
import type { PropsWithChildren, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fontSize, radius, spacing } from "../theme";

type State = { hasError: boolean; error: Error | null };

type Props = PropsWithChildren<{
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}>;

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={styles.container}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Algo ha fallado</Text>
          <Text style={styles.message} numberOfLines={3}>
            {this.state.error?.message ?? "Error desconocido"}
          </Text>
          <Pressable style={styles.button} onPress={this.reset}>
            <Text style={styles.buttonText}>Reintentar</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[8],
    backgroundColor: colors.background,
    gap: spacing[3],
  },
  icon: {
    fontSize: 44,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.text,
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  button: {
    marginTop: spacing[2],
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  buttonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: fontSize.md,
  },
});
