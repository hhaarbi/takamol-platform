/**
 * FeatureGate — wraps content that requires a specific subscription feature.
 * Shows a locked overlay if the feature is not available in the current plan.
 */
import { ReactNode } from "react";
import { Link } from "wouter";
import { Lock, Zap, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFeatureAccess, type FeatureKey } from "@/hooks/useFeatureAccess";

interface FeatureGateProps {
  feature: FeatureKey;
  children: ReactNode;
  /** Custom message shown when locked */
  lockedMessage?: string;
  /** Show a compact inline badge instead of full overlay */
  inline?: boolean;
  /** Fallback UI when locked (overrides default locked card) */
  fallback?: ReactNode;
}

export function FeatureGate({
  feature,
  children,
  lockedMessage,
  inline = false,
  fallback,
}: FeatureGateProps) {
  const { allowed, isLoading, noSubscription, inactive } = useFeatureAccess(feature);

  if (isLoading) {
    return <div className="animate-pulse h-8 bg-muted rounded" />;
  }

  if (allowed) {
    return <>{children}</>;
  }

  // Custom fallback
  if (fallback) return <>{fallback}</>;

  // Inline badge
  if (inline) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
        <Lock className="h-3 w-3" />
        مقفل
      </span>
    );
  }

  // Full locked card
  const title = noSubscription
    ? "يتطلب اشتراكاً"
    : inactive
    ? "اشتراكك منتهٍ"
    : "غير متاح في باقتك";

  const description =
    lockedMessage ??
    (noSubscription
      ? "يرجى الاشتراك في إحدى الباقات للوصول لهذه الميزة."
      : inactive
      ? "اشتراكك غير نشط. يرجى تجديد الاشتراك للمتابعة."
      : "هذه الميزة متاحة في باقة أعلى. قم بالترقية للوصول إليها.");

  const Icon = inactive ? AlertTriangle : Lock;

  return (
    <Card className="border-dashed border-2 border-muted-foreground/20">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-4">
        <div className="p-4 rounded-full bg-muted">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>
        </div>
        <Button asChild size="sm" className="gap-2">
          <Link href="/subscription">
            <Zap className="h-4 w-4" />
            {inactive ? "تجديد الاشتراك" : "ترقية الباقة"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * LockedOverlay — wraps existing content with a semi-transparent lock overlay.
 * Useful for previewing locked content without hiding it completely.
 */
export function LockedOverlay({
  feature,
  children,
}: {
  feature: FeatureKey;
  children: ReactNode;
}) {
  const { allowed, isLoading } = useFeatureAccess(feature);

  if (isLoading || allowed) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm opacity-40">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 rounded-lg backdrop-blur-sm">
        <div className="p-3 rounded-full bg-muted border">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">غير متاح في باقتك</p>
        <Button asChild size="sm" variant="outline" className="gap-2">
          <Link href="/subscription">
            <Zap className="h-3 w-3" />
            ترقية
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default FeatureGate;
