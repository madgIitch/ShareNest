// src/services/subscriptionService.ts
// Stripe subscription integration
// Requires: npx expo install expo-web-browser expo-linking
// Note: Apple/Google require IAP for in-app digital goods in App Store / Play Store.
// This Stripe flow works for direct APK distribution or web. For store submission,
// consider using StoreKit2 / BillingClient (or wrapping with RevenueCat + Stripe backend).

import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";

const SUPABASE_FUNCTIONS_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`;

export const subscriptionService = {
  /**
   * Open Stripe Checkout in a browser tab.
   * The Edge Function creates a Checkout Session and returns the URL.
   * On success, Stripe redirects to sharenest://subscription/success
   */
  async startCheckout(priceId: string): Promise<"success" | "cancelled" | "error"> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Not authenticated");

      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-stripe-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          price_id: priceId,
          success_url: "sharenest://subscription/success",
          cancel_url: "sharenest://subscription/cancel",
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { url } = (await res.json()) as { url: string };

      const result = await WebBrowser.openAuthSessionAsync(url, "sharenest://subscription");
      if (result.type === "success") {
        const parsed = Linking.parse(result.url);
        if (parsed.path?.includes("success")) return "success";
      }
      return "cancelled";
    } catch (err) {
      console.log("[subscriptionService.startCheckout] error:", err);
      return "error";
    }
  },

  /**
   * Open Stripe Customer Portal to manage/cancel subscription.
   */
  async openPortal(): Promise<void> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;

      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-stripe-portal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ return_url: "sharenest://subscription/portal-return" }),
      });

      if (!res.ok) return;
      const { url } = (await res.json()) as { url: string };
      await WebBrowser.openBrowserAsync(url);
    } catch (err) {
      console.log("[subscriptionService.openPortal] error:", err);
    }
  },

  /**
   * Fetch active subscription status from Supabase (updated by webhook).
   */
  async getStatus(): Promise<boolean> {
    const { data } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("status", "active")
      .maybeSingle();
    return !!data;
  },
};

// Stripe price IDs — set these from your Stripe Dashboard
export const STRIPE_PRICES = {
  monthlyId: process.env.EXPO_PUBLIC_STRIPE_PRICE_MONTHLY ?? "",
  annualId: process.env.EXPO_PUBLIC_STRIPE_PRICE_ANNUAL ?? "",
};
