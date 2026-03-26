/**
 * useFeatureAccess — Frontend Feature Gating Hook
 * Checks if the current company's subscription allows access to a specific feature.
 */
import { trpc } from "@/lib/trpc";

export type FeatureKey =
  | "properties"
  | "units"
  | "contracts"
  | "payments"
  | "maintenance"
  | "invoices"
  | "reports_basic"
  | "reports_advanced"
  | "tenant_portal"
  | "owner_portal"
  | "smart_alerts"
  | "accounting_basic"
  | "accounting_full"
  | "vouchers"
  | "api_limited"
  | "api_full"
  | "analytics_advanced"
  | "staff_management";

interface FeatureAccessResult {
  allowed: boolean;
  isLoading: boolean;
  reason?: string;
  /** True if the user has no subscription at all */
  noSubscription: boolean;
  /** True if the subscription is inactive (expired/cancelled) */
  inactive: boolean;
}

export function useFeatureAccess(featureKey: FeatureKey): FeatureAccessResult {
  const { data, isLoading } = trpc.subscriptions.checkFeatureAccess.useQuery(
    { featureKey },
    { retry: 1, staleTime: 60_000 }
  );

  if (isLoading) {
    return { allowed: false, isLoading: true, noSubscription: false, inactive: false };
  }

  const allowed = data?.allowed ?? false;
  const reason = data?.reason;

  return {
    allowed,
    isLoading: false,
    reason,
    noSubscription: reason === "no_subscription",
    inactive: reason === "subscription_inactive",
  };
}

/**
 * useSubscriptionStatus — returns the current subscription status summary
 */
export function useSubscriptionStatus() {
  const { data, isLoading } = trpc.subscriptions.getCurrentSubscription.useQuery(undefined, {
    retry: 1,
    staleTime: 30_000,
  });

  return {
    isLoading,
    subscription: data?.subscription ?? null,
    plan: data?.plan ?? null,
    daysLeft: data?.daysLeft ?? null,
    trialDaysLeft: data?.trialDaysLeft ?? null,
    isExpiringSoon: data?.isExpiringSoon ?? false,
    isTrialing: data?.isTrialing ?? false,
    isActive: data?.subscription?.computedStatus === "active" || data?.subscription?.computedStatus === "trialing",
    status: data?.subscription?.computedStatus ?? null,
  };
}
