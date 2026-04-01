/**
 * Stripe Client — Centralized Stripe SDK instance
 * Uses STRIPE_SECRET_KEY from environment
 */
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";

if (!STRIPE_SECRET_KEY) {
  console.warn("[Stripe] STRIPE_SECRET_KEY not found in environment — Stripe features will be disabled");
}

export const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia",
      typescript: true,
    })
  : null;

/**
 * Stripe Price IDs for subscription plans
 * These are created in Stripe Dashboard → Products
 */
export const STRIPE_PRICE_IDS = {
  STARTER: process.env.STRIPE_PRICE_ID_STARTER ?? "price_1THKYAHf1Olb1MIWTuDzSsC9",
  PRO: process.env.STRIPE_PRICE_ID_PRO ?? "price_1THKYBHf1Olb1MIWoNnejnOY",
  ENTERPRISE: process.env.STRIPE_PRICE_ID_ENTERPRISE ?? "price_1THKYDHf1Olb1MIWNPiwqag3",
} as const;

/**
 * Map plan names to Stripe Price IDs
 */
export function getPriceIdForPlan(planName: string): string | null {
  const normalized = planName.toLowerCase();
  if (normalized.includes("starter") || normalized.includes("مبتدئ")) return STRIPE_PRICE_IDS.STARTER;
  if (normalized.includes("pro") || normalized.includes("احتراف")) return STRIPE_PRICE_IDS.PRO;
  if (normalized.includes("enterprise") || normalized.includes("مؤسسات")) return STRIPE_PRICE_IDS.ENTERPRISE;
  return null;
}
