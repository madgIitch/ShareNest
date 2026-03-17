// src/components/ui/SuperfriEndzGate.tsx
// Wraps a feature behind the Superfriendz paywall.
// Usage:
//   <SuperfriEndzGate>
//     <MyPremiumFeature />
//   </SuperfriEndzGate>
//
// Or as an upsell banner:
//   <SuperfriEndzGate fallback={<View>...</View>} />

import { useState } from "react";
import type { PropsWithChildren, ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useIsSuperfriendz, useInvalidateSubscription } from "../../hooks/useSubscription";
import { subscriptionService, STRIPE_PRICES } from "../../services/subscriptionService";
import { colors, fontSize, radius, spacing } from "../../theme";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  ctaLabel?: string;
}

export function SuperfriEndzGate({ children, fallback, ctaLabel = "Hazte Superfriendz" }: PropsWithChildren<Props>) {
  const { data: isSuper, isLoading } = useIsSuperfriendz();
  const [modalVisible, setModalVisible] = useState(false);

  if (isLoading) {
    return <ActivityIndicator color={colors.primary} style={{ margin: spacing[4] }} />;
  }

  if (isSuper) {
    return <>{children}</>;
  }

  return (
    <>
      {fallback ?? (
        <Pressable
          style={styles.upsellBanner}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
        >
          <Text style={styles.upsellIcon}>⭐</Text>
          <View style={styles.upsellText}>
            <Text style={styles.upsellTitle}>{ctaLabel}</Text>
            <Text style={styles.upsellSubtitle}>Desbloquea todas las funciones premium</Text>
          </View>
          <Text style={styles.upsellArrow}>›</Text>
        </Pressable>
      )}
      <PaywallModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </>
  );
}

export function useSuperfriEndzAccess() {
  const { data: isSuper = false, isLoading } = useIsSuperfriendz();
  return { isSuper, isLoading };
}

function PaywallModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const invalidate = useInvalidateSubscription();
  const [purchasing, setPurchasing] = useState(false);

  const handleSubscribe = async (priceId: string) => {
    try {
      setPurchasing(true);
      const result = await subscriptionService.startCheckout(priceId);
      if (result === "success") {
        await invalidate();
        onClose();
        Alert.alert("¡Bienvenido/a!", "Ya eres Superfriendz. Disfruta de todos los beneficios.");
      } else if (result === "error") {
        Alert.alert("Error", "No se pudo iniciar el pago. Inténtalo de nuevo.");
      }
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
        <Pressable style={styles.closeBtn} onPress={onClose} accessibilityLabel="Cerrar">
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>

        <Text style={styles.paywallBadge}>⭐ SUPERFRIENDZ</Text>
        <Text style={styles.paywallTitle}>Lleva tu piso compartido al siguiente nivel</Text>

        {/* Perks */}
        <View style={styles.perks}>
          {PERKS.map((p) => (
            <View key={p.label} style={styles.perkRow}>
              <Text style={styles.perkIcon}>{p.icon}</Text>
              <View>
                <Text style={styles.perkLabel}>{p.label}</Text>
                <Text style={styles.perkDesc}>{p.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Plans */}
        <View style={styles.packages}>
          {STRIPE_PRICES.annualId ? (
            <Pressable
              style={[styles.packageBtn, styles.packageBtnFeatured]}
              onPress={() => handleSubscribe(STRIPE_PRICES.annualId)}
              disabled={purchasing}
              accessibilityLabel="Suscripción anual"
            >
              <View style={styles.packageBadge}>
                <Text style={styles.packageBadgeText}>MEJOR VALOR</Text>
              </View>
              <Text style={styles.packageTitle}>Anual</Text>
              <Text style={styles.packageSub}>Configura el precio en Stripe Dashboard</Text>
            </Pressable>
          ) : null}

          {STRIPE_PRICES.monthlyId ? (
            <Pressable
              style={styles.packageBtn}
              onPress={() => handleSubscribe(STRIPE_PRICES.monthlyId)}
              disabled={purchasing}
              accessibilityLabel="Suscripción mensual"
            >
              <Text style={styles.packageTitle}>Mensual</Text>
              <Text style={styles.packageSub}>Configura el precio en Stripe Dashboard</Text>
            </Pressable>
          ) : null}

          {!STRIPE_PRICES.annualId && !STRIPE_PRICES.monthlyId && (
            <Text style={styles.noOfferings}>
              Configura EXPO_PUBLIC_STRIPE_PRICE_MONTHLY y EXPO_PUBLIC_STRIPE_PRICE_ANNUAL en .env
            </Text>
          )}
        </View>

        {purchasing && <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing[3] }} />}

        <Pressable
          onPress={() => subscriptionService.openPortal()}
          style={styles.restoreBtn}
          accessibilityLabel="Gestionar suscripción"
        >
          <Text style={styles.restoreBtnText}>Gestionar suscripción existente</Text>
        </Pressable>

        <Text style={styles.legal}>
          El pago se gestiona de forma segura a través de Stripe.
          Puedes cancelar en cualquier momento desde el portal de cliente.
        </Text>
      </ScrollView>
    </Modal>
  );
}

const PERKS = [
  { icon: "📋", label: "Anuncios ilimitados", desc: "Publica sin límite" },
  { icon: "👥", label: "Friendz ilimitados", desc: "Sin tope en tu red" },
  { icon: "📊", label: "Estadísticas avanzadas", desc: "Visitas y contactos por anuncio" },
  { icon: "⭐", label: "Badge Superfriendz", desc: "Destaca en búsquedas" },
];

const styles = StyleSheet.create({
  upsellBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing[4],
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.primary,
  },
  upsellIcon: { fontSize: 24 },
  upsellText: { flex: 1 },
  upsellTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.primary },
  upsellSubtitle: { fontSize: fontSize.xs, color: colors.primaryDark },
  upsellArrow: { fontSize: 22, color: colors.primary },

  modal: { flex: 1, backgroundColor: colors.surface },
  modalContent: { padding: spacing[6], paddingBottom: spacing[10] },
  closeBtn: { alignSelf: "flex-end", padding: spacing[2] },
  closeBtnText: { fontSize: 20, color: colors.textSecondary },

  paywallBadge: {
    fontSize: fontSize.sm,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    marginBottom: spacing[2],
    letterSpacing: 1,
  },
  paywallTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing[6],
  },

  perks: { gap: spacing[4], marginBottom: spacing[6] },
  perkRow: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  perkIcon: { fontSize: 28, width: 36, textAlign: "center" },
  perkLabel: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  perkDesc: { fontSize: fontSize.sm, color: colors.textSecondary },

  packages: { gap: spacing[3], marginBottom: spacing[4] },
  packageBtn: {
    backgroundColor: colors.gray100,
    borderRadius: radius.lg,
    padding: spacing[5],
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  packageBtnFeatured: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  packageBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 2,
    marginBottom: spacing[2],
  },
  packageBadgeText: { fontSize: fontSize.xs, fontWeight: "800", color: colors.white, letterSpacing: 1 },
  packageTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text },
  packageSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  noOfferings: { textAlign: "center", color: colors.textSecondary, fontSize: fontSize.sm, padding: spacing[4] },

  restoreBtn: { alignItems: "center", paddingVertical: spacing[3] },
  restoreBtnText: { fontSize: fontSize.sm, color: colors.textSecondary, textDecorationLine: "underline" },

  legal: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: spacing[4],
    lineHeight: 16,
  },
});
