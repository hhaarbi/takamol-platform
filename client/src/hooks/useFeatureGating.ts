/**
 * Feature Gating Hook
 * Controls access to features based on subscription plan
 * 
 * Plan hierarchy: none < starter < pro < enterprise
 */
import { trpc } from "@/lib/trpc";

export type PlanTier = "none" | "starter" | "pro" | "enterprise";

export interface FeatureAccess {
  // Property limits
  maxProperties: number;
  maxUsers: number;
  maxStorage: number; // GB
  // Features
  canExportPDF: boolean;
  canAccessAnalytics: boolean;
  canAccessFalAPI: boolean;
  canAccessZATCA: boolean;
  canAccessAPIIntegration: boolean;
  canAccessAdvancedReports: boolean;
  canAccessMarketComparison: boolean;
  canAccessCashflowForecast: boolean;
  canAccessGeoStats: boolean;
  // Support
  prioritySupport: boolean;
  dedicatedSupport: boolean;
  // Current tier
  tier: PlanTier;
  isActive: boolean;
  daysLeft: number | null;
}

const PLAN_LIMITS: Record<PlanTier, FeatureAccess> = {
  none: {
    maxProperties: 5,
    maxUsers: 1,
    maxStorage: 1,
    canExportPDF: false,
    canAccessAnalytics: false,
    canAccessFalAPI: false,
    canAccessZATCA: false,
    canAccessAPIIntegration: false,
    canAccessAdvancedReports: false,
    canAccessMarketComparison: false,
    canAccessCashflowForecast: false,
    canAccessGeoStats: false,
    prioritySupport: false,
    dedicatedSupport: false,
    tier: "none",
    isActive: false,
    daysLeft: null,
  },
  starter: {
    maxProperties: 50,
    maxUsers: 3,
    maxStorage: 5,
    canExportPDF: false,
    canAccessAnalytics: true,
    canAccessFalAPI: false,
    canAccessZATCA: false,
    canAccessAPIIntegration: false,
    canAccessAdvancedReports: false,
    canAccessMarketComparison: false,
    canAccessCashflowForecast: false,
    canAccessGeoStats: false,
    prioritySupport: false,
    dedicatedSupport: false,
    tier: "starter",
    isActive: true,
    daysLeft: null,
  },
  pro: {
    maxProperties: 200,
    maxUsers: 10,
    maxStorage: 20,
    canExportPDF: true,
    canAccessAnalytics: true,
    canAccessFalAPI: true,
    canAccessZATCA: false,
    canAccessAPIIntegration: false,
    canAccessAdvancedReports: true,
    canAccessMarketComparison: true,
    canAccessCashflowForecast: true,
    canAccessGeoStats: true,
    prioritySupport: true,
    dedicatedSupport: false,
    tier: "pro",
    isActive: true,
    daysLeft: null,
  },
  enterprise: {
    maxProperties: Infinity,
    maxUsers: Infinity,
    maxStorage: 100,
    canExportPDF: true,
    canAccessAnalytics: true,
    canAccessFalAPI: true,
    canAccessZATCA: true,
    canAccessAPIIntegration: true,
    canAccessAdvancedReports: true,
    canAccessMarketComparison: true,
    canAccessCashflowForecast: true,
    canAccessGeoStats: true,
    prioritySupport: true,
    dedicatedSupport: true,
    tier: "enterprise",
    isActive: true,
    daysLeft: null,
  },
};

function getPlanTier(planName: string | null | undefined): PlanTier {
  if (!planName) return "none";
  const n = planName.toLowerCase();
  if (n.includes("enterprise") || n.includes("مؤسسات")) return "enterprise";
  if (n.includes("pro") || n.includes("احتراف")) return "pro";
  if (n.includes("starter") || n.includes("مبتدئ")) return "starter";
  return "none";
}

/**
 * Main feature gating hook
 * Returns feature access based on current subscription
 */
export function useFeatureGating(): FeatureAccess & { isLoading: boolean } {
  const { data: subStatus, isLoading } = trpc.stripe.getSubscriptionStatus.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (isLoading) {
    return { ...PLAN_LIMITS.none, isLoading: true };
  }

  if (!subStatus?.hasSubscription || subStatus.status === "expired" || subStatus.status === "cancelled") {
    return { ...PLAN_LIMITS.none, isLoading: false };
  }

  const tier = getPlanTier(subStatus.plan?.name);
  const limits = PLAN_LIMITS[tier];

  return {
    ...limits,
    tier,
    isActive: subStatus.status === "active" || subStatus.status === "trialing",
    daysLeft: subStatus.daysLeft ?? null,
    isLoading: false,
  };
}

/**
 * Check if a specific feature is accessible
 */
export function useCanAccess(feature: keyof Omit<FeatureAccess, "tier" | "isActive" | "daysLeft" | "maxProperties" | "maxUsers" | "maxStorage">): {
  canAccess: boolean;
  isLoading: boolean;
  tier: PlanTier;
} {
  const access = useFeatureGating();
  return {
    canAccess: Boolean(access[feature]),
    isLoading: access.isLoading,
    tier: access.tier,
  };
}
