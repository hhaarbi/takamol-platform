/**
 * SubscriptionBanner
 * يظهر تلقائياً عند:
 * - اقتراب انتهاء الاشتراك (أقل من 7 أيام)
 * - انتهاء فترة التجربة المجانية
 * - انتهاء الاشتراك (expired / past_due / cancelled)
 * - تعليق الاشتراك (suspended)
 */
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, XCircle, CreditCard, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

type BannerVariant = "warning" | "danger" | "info" | "error";

interface BannerConfig {
  variant: BannerVariant;
  icon: any;
  title: string;
  description: string;
  actionLabel: string;
  actionPath: string;
  dismissible: boolean;
}

const variantStyles: Record<BannerVariant, string> = {
  warning: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400",
  danger: "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400",
  info: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400",
  error: "bg-red-600/15 border-red-600/40 text-red-800 dark:text-red-300",
};

const actionButtonStyles: Record<BannerVariant, string> = {
  warning: "bg-amber-600 hover:bg-amber-700 text-white",
  danger: "bg-red-600 hover:bg-red-700 text-white",
  info: "bg-blue-600 hover:bg-blue-700 text-white",
  error: "bg-red-700 hover:bg-red-800 text-white",
};

export default function SubscriptionBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [, setLocation] = useLocation();

  const { data: sub } = trpc.subscriptions.getCurrentSubscription.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (!sub || dismissed) return null;

  const status = sub.subscription?.computedStatus ?? sub.subscription?.status;
  const daysLeft = sub.daysLeft;
  const trialDaysLeft = sub.trialDaysLeft;
  const isTrialing = sub.isTrialing;
  const isExpiringSoon = sub.isExpiringSoon;

  let config: BannerConfig | null = null;

  if (status === "expired") {
    config = {
      variant: "error",
      icon: XCircle,
      title: "انتهى اشتراكك",
      description: "لقد انتهت صلاحية اشتراكك. جدّد الآن للاستمرار في استخدام جميع المزايا.",
      actionLabel: "تجديد الاشتراك",
      actionPath: "/pricing",
      dismissible: false,
    };
  } else if (status === "past_due") {
    config = {
      variant: "danger",
      icon: AlertTriangle,
      title: "دفعة متأخرة",
      description: "يوجد دفعة متأخرة على حسابك. يرجى تسوية المبلغ لتجنب تعليق الخدمة.",
      actionLabel: "تسوية الدفعة",
      actionPath: "/billing",
      dismissible: true,
    };
  } else if (status === "suspended") {
    config = {
      variant: "error",
      icon: XCircle,
      title: "تم تعليق حسابك",
      description: "تم تعليق حسابك مؤقتاً. يرجى التواصل مع الدعم أو تجديد الاشتراك.",
      actionLabel: "تجديد الاشتراك",
      actionPath: "/pricing",
      dismissible: false,
    };
  } else if (status === "cancelled") {
    config = {
      variant: "danger",
      icon: XCircle,
      title: "تم إلغاء اشتراكك",
      description: "تم إلغاء اشتراكك. يمكنك الاشتراك مجدداً في أي وقت.",
      actionLabel: "اشترك مجدداً",
      actionPath: "/pricing",
      dismissible: true,
    };
  } else if (isTrialing && trialDaysLeft !== null && trialDaysLeft <= 3) {
    config = {
      variant: "warning",
      icon: Clock,
      title: `تنتهي تجربتك المجانية خلال ${trialDaysLeft} ${trialDaysLeft === 1 ? "يوم" : "أيام"}`,
      description: "اشترك الآن لتستمر في الوصول لجميع المزايا دون انقطاع.",
      actionLabel: "اشترك الآن",
      actionPath: "/pricing",
      dismissible: true,
    };
  } else if (isTrialing && trialDaysLeft !== null && trialDaysLeft <= 7) {
    config = {
      variant: "info",
      icon: Clock,
      title: `تجربتك المجانية تنتهي خلال ${trialDaysLeft} أيام`,
      description: "استفد من عرض الاشتراك السنوي بخصم 20% قبل انتهاء التجربة.",
      actionLabel: "عرض الباقات",
      actionPath: "/pricing",
      dismissible: true,
    };
  } else if (isExpiringSoon && daysLeft !== null && daysLeft <= 3) {
    config = {
      variant: "warning",
      icon: AlertTriangle,
      title: `اشتراكك ينتهي خلال ${daysLeft} ${daysLeft === 1 ? "يوم" : "أيام"}`,
      description: "جدّد اشتراكك الآن لتجنب انقطاع الخدمة.",
      actionLabel: "تجديد الاشتراك",
      actionPath: "/subscription",
      dismissible: true,
    };
  } else if (isExpiringSoon && daysLeft !== null && daysLeft <= 7) {
    config = {
      variant: "info",
      icon: Clock,
      title: `اشتراكك ينتهي خلال ${daysLeft} أيام`,
      description: "يمكنك تجديد الاشتراك أو الترقية لباقة أفضل.",
      actionLabel: "إدارة الاشتراك",
      actionPath: "/subscription",
      dismissible: true,
    };
  }

  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      className={`w-full border rounded-lg px-4 py-3 flex items-center justify-between gap-3 mb-4 ${variantStyles[config.variant]}`}
      dir="rtl"
      role="alert"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Icon className="h-5 w-5 shrink-0" />
        <div className="min-w-0">
          <span className="font-semibold text-sm">{config.title}</span>
          <span className="text-sm opacity-80 mr-2 hidden sm:inline">{config.description}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          className={`text-xs h-8 px-3 ${actionButtonStyles[config.variant]}`}
          onClick={() => setLocation(config!.actionPath)}
        >
          <CreditCard className="h-3 w-3 ml-1" />
          {config.actionLabel}
        </Button>
        {config.dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="opacity-60 hover:opacity-100 transition-opacity p-1 rounded"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
