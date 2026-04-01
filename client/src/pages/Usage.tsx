import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLocation } from "wouter";
import {
  Building2,
  Home,
  Users,
  FileText,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";

interface UsageMetric {
  key: string;
  label: string;
  icon: React.ReactNode;
  current: number;
  limit: number;
  unit?: string;
}

function getStatusColor(percent: number): string {
  if (percent >= 90) return "text-red-500";
  if (percent >= 70) return "text-amber-500";
  return "text-emerald-500";
}

function getProgressColor(percent: number): string {
  if (percent >= 90) return "bg-red-500";
  if (percent >= 70) return "bg-amber-500";
  return "bg-emerald-500";
}

function getStatusBadge(percent: number) {
  if (percent >= 90)
    return (
      <Badge variant="destructive" className="text-xs gap-1">
        <AlertCircle className="w-3 h-3" />
        حرج
      </Badge>
    );
  if (percent >= 70)
    return (
      <Badge className="text-xs gap-1 bg-amber-100 text-amber-800 border-amber-200">
        <AlertTriangle className="w-3 h-3" />
        تحذير
      </Badge>
    );
  return (
    <Badge className="text-xs gap-1 bg-emerald-100 text-emerald-800 border-emerald-200">
      <CheckCircle2 className="w-3 h-3" />
      طبيعي
    </Badge>
  );
}

function UsageCard({ metric }: { metric: UsageMetric }) {
  const isUnlimited = metric.limit === -1 || metric.limit === 0;
  const percent = isUnlimited
    ? 0
    : Math.min(100, Math.round((metric.current / metric.limit) * 100));

  return (
    <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {metric.icon}
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.label}
            </CardTitle>
          </div>
          {!isUnlimited && getStatusBadge(percent)}
          {isUnlimited && (
            <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">
              غير محدود
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <span className={`text-3xl font-bold ${isUnlimited ? "text-foreground" : getStatusColor(percent)}`}>
              {metric.current.toLocaleString("ar-SA")}
            </span>
            {!isUnlimited && (
              <span className="text-sm text-muted-foreground mr-1">
                / {metric.limit.toLocaleString("ar-SA")} {metric.unit ?? ""}
              </span>
            )}
          </div>
          {!isUnlimited && (
            <span className={`text-lg font-semibold ${getStatusColor(percent)}`}>
              {percent}%
            </span>
          )}
        </div>

        {!isUnlimited && (
          <div className="space-y-1">
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full transition-all duration-500 rounded-full ${getProgressColor(percent)}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              متبقي {(metric.limit - metric.current).toLocaleString("ar-SA")} {metric.unit ?? ""}
            </p>
          </div>
        )}

        {isUnlimited && (
          <p className="text-xs text-muted-foreground">
            لا توجد قيود على هذا المورد في باقتك الحالية
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Usage() {
  const [, navigate] = useLocation();

  const { data: usageData, isLoading, refetch } = trpc.billing.getUsage.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  const { data: subStatus } = trpc.subscriptions.getCurrentSubscription.useQuery();

  const metrics: UsageMetric[] = usageData
    ? [
        {
          key: "properties",
          label: "العقارات",
          icon: <Building2 className="w-4 h-4" />,
          current: usageData.properties,
          limit: usageData.limits.maxProperties,
        },
        {
          key: "units",
          label: "الوحدات",
          icon: <Home className="w-4 h-4" />,
          current: usageData.units,
          limit: usageData.limits.maxUnits,
        },
        {
          key: "users",
          label: "المستخدمون",
          icon: <Users className="w-4 h-4" />,
          current: usageData.users,
          limit: usageData.limits.maxUsers,
        },
      ]
    : [];

  // Compute overall alerts
  const criticalMetrics = metrics.filter((m) => {
    const isUnlimited = m.limit === -1 || m.limit === 0;
    if (isUnlimited) return false;
    return Math.round((m.current / m.limit) * 100) >= 90;
  });

  const warningMetrics = metrics.filter((m) => {
    const isUnlimited = m.limit === -1 || m.limit === 0;
    if (isUnlimited) return false;
    const pct = Math.round((m.current / m.limit) * 100);
    return pct >= 70 && pct < 90;
  });

  const planName = (subStatus?.plan?.name ?? "basic").toLowerCase();
  const planDisplayName =
    planName === "starter"
      ? "المبتدئ"
      : planName === "pro"
      ? "الاحترافي"
      : planName === "enterprise"
      ? "المؤسسي"
      : "الأساسي";

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">مراقبة الاستخدام</h1>
            <p className="text-sm text-muted-foreground mt-1">
              تتبع استهلاك مواردك مقارنةً بحدود باقتك الحالية
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-sm px-3 py-1">
              باقة {planDisplayName}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {criticalMetrics.length > 0 && (
          <Alert variant="destructive" className="border-red-300 bg-red-50 dark:bg-red-950/20">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-semibold">تحذير حرج — اقتربت من الحد الأقصى</AlertTitle>
            <AlertDescription className="mt-1">
              {criticalMetrics.map((m) => m.label).join(" و ")} وصلت إلى أكثر من 90% من الحد المسموح به.{" "}
              <button
                onClick={() => navigate("/upgrade")}
                className="underline font-medium hover:no-underline"
              >
                ترقية الباقة الآن
              </button>
            </AlertDescription>
          </Alert>
        )}

        {warningMetrics.length > 0 && criticalMetrics.length === 0 && (
          <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="font-semibold text-amber-800 dark:text-amber-400">
              تنبيه — اقتربت من الحد
            </AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300 mt-1">
              {warningMetrics.map((m) => m.label).join(" و ")} تجاوزت 70% من الحد المسموح به.{" "}
              <button
                onClick={() => navigate("/upgrade")}
                className="underline font-medium hover:no-underline"
              >
                فكّر في ترقية باقتك
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Usage Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-4 bg-muted rounded w-24" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-8 bg-muted rounded w-16" />
                  <div className="h-2 bg-muted rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics.map((metric) => (
              <UsageCard key={metric.key} metric={metric} />
            ))}
          </div>
        )}

        {/* Plan Summary */}
        <Card className="border border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                ملخص الباقة الحالية
              </CardTitle>
              <Button
                size="sm"
                onClick={() => navigate("/upgrade")}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                <ArrowUpRight className="w-4 h-4" />
                ترقية الباقة
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                {
                  label: "العقارات",
                  value: usageData?.limits.maxProperties === -1 ? "∞" : usageData?.limits.maxProperties ?? "—",
                },
                {
                  label: "الوحدات",
                  value: usageData?.limits.maxUnits === -1 ? "∞" : usageData?.limits.maxUnits ?? "—",
                },
                {
                  label: "المستخدمون",
                  value: usageData?.limits.maxUsers === -1 ? "∞" : usageData?.limits.maxUsers ?? "—",
                },
                {
                  label: "التقارير المتقدمة",
                  value: usageData?.limits.hasAdvancedReports ? "✓" : "✗",
                },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-lg bg-muted/40">
                  <p className="text-xl font-bold text-foreground">{item.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info note */}
        <p className="text-xs text-muted-foreground text-center">
          يتم تحديث بيانات الاستخدام تلقائياً كل دقيقة. آخر تحديث: الآن
        </p>
      </div>
    </DashboardLayout>
  );
}
