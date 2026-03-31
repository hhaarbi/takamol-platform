import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Zap, Building2, Crown, ArrowRight, Star } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

const planIcons = [Building2, Zap, Crown];
const planColors = [
  "from-slate-500 to-slate-600",
  "from-blue-500 to-blue-600",
  "from-amber-500 to-amber-600",
];
const planBorderColors = [
  "border-slate-200 dark:border-slate-700",
  "border-blue-400 dark:border-blue-500",
  "border-amber-400 dark:border-amber-500",
];

const featureLabels: Record<string, string> = {
  properties: "إدارة العقارات",
  units: "إدارة الوحدات",
  contracts: "إدارة العقود",
  payments: "تتبع المدفوعات",
  maintenance: "طلبات الصيانة",
  invoices: "فواتير إلكترونية",
  reports_basic: "تقارير أساسية",
  reports_advanced: "تقارير متقدمة",
  tenant_portal: "بوابة المستأجر",
  owner_portal: "بوابة المالك",
  smart_alerts: "تنبيهات ذكية",
  accounting_basic: "محاسبة أساسية",
  accounting_full: "محاسبة متكاملة",
  vouchers: "سندات القبض والصرف",
  api_limited: "وصول API محدود",
  api_full: "وصول API كامل",
  analytics_advanced: "تحليلات متقدمة",
  staff_management: "إدارة الموظفين",
};

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: plans = [], isLoading } = trpc.subscriptions.getPlans.useQuery({ billingCycle });
  const { data: comparison } = trpc.subscriptions.getPlanComparison.useQuery();
  const { data: currentSub } = trpc.subscriptions.getCurrentSubscription.useQuery();

  const subscribeMutation = trpc.subscriptions.subscribeToPlan.useMutation({
    onSuccess: () => setLocation("/subscription"),
  });

  const handleSubscribe = (planId: number, isFree: boolean) => {
    if (!user) {
      setLocation("/onboarding");
      return;
    }
    subscribeMutation.mutate({ planId, billingCycle, startTrial: !isFree });
  };

  const yearlyDiscount = 20;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="text-center py-16 px-4">
        <Badge variant="outline" className="mb-4 text-primary border-primary/30 bg-primary/5">
          <Star className="h-3 w-3 ml-1" />
          باقات تكامل للإدارة العقارية
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          اختر الباقة المناسبة لعملك
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
          منصة متكاملة لإدارة العقارات والمستأجرين والعقود والمدفوعات — كل ما تحتاجه في مكان واحد
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3">
          <Label className={billingCycle === "monthly" ? "font-semibold" : "text-muted-foreground"}>
            شهري
          </Label>
          <Switch
            checked={billingCycle === "yearly"}
            onCheckedChange={(v) => setBillingCycle(v ? "yearly" : "monthly")}
          />
          <Label className={billingCycle === "yearly" ? "font-semibold" : "text-muted-foreground"}>
            سنوي
          </Label>
          {billingCycle === "yearly" && (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
              وفّر {yearlyDiscount}%
            </Badge>
          )}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan, idx) => {
            const Icon = planIcons[idx] ?? Building2;
            const gradient = planColors[idx] ?? planColors[0];
            const borderColor = planBorderColors[idx] ?? planBorderColors[0];
            const isRecommended = plan.isRecommended === 1;
            const isCurrentPlan = currentSub?.plan?.id === plan.id;
            const price = Number(plan.price ?? plan.priceMonthly ?? 0);
            const isFree = price === 0;

            return (
              <Card
                key={plan.id}
                className={`relative border-2 transition-all hover:shadow-lg ${borderColor} ${isRecommended ? "scale-105 shadow-lg" : ""}`}
              >
                {isRecommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white px-4 py-1 text-xs font-semibold shadow-md">
                      ⭐ الأكثر شيوعاً
                    </Badge>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-green-500 text-white px-3 py-1 text-xs">
                      ✓ باقتك الحالية
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{plan.nameAr ?? plan.name}</CardTitle>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                </CardHeader>

                <CardContent>
                  {/* Price */}
                  <div className="mb-6">
                    {isFree ? (
                      <div className="text-3xl font-bold text-green-600">مجاني</div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">{price.toLocaleString("ar-SA")}</span>
                        <span className="text-muted-foreground text-sm">ر.س / {billingCycle === "yearly" ? "سنة" : "شهر"}</span>
                      </div>
                    )}
                    {billingCycle === "yearly" && !isFree && (
                      <p className="text-xs text-green-600 mt-1">
                        = {(price / 12).toFixed(0)} ر.س / شهر
                      </p>
                    )}
                  </div>

                  {/* Limits */}
                  <div className="space-y-2 mb-6 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">العقارات</span>
                      <span className="font-medium">{plan.maxProperties === -1 ? "غير محدود" : plan.maxProperties}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الوحدات</span>
                      <span className="font-medium">{plan.maxUnits === -1 ? "غير محدود" : plan.maxUnits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المستخدمون</span>
                      <span className="font-medium">{plan.maxUsers === -1 ? "غير محدود" : plan.maxUsers}</span>
                    </div>
                    {plan.trialDays && plan.trialDays > 0 && !isFree && (
                      <div className="flex justify-between text-blue-600">
                        <span>تجربة مجانية</span>
                        <span className="font-medium">{plan.trialDays} يوم</span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {Array.isArray(plan.features) && (plan.features as any[])
                      .filter((f: any) => f != null && typeof f === 'object' && f?.enabled === 1)
                      .slice(0, 6)
                      .map((f: any, i: number) => {
                        const key = typeof f?.featureKey === 'string' ? f.featureKey : '';
                        const label = featureLabels[key] ?? key ?? 'ميزة';
                        return (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            <span>{String(label)}</span>
                          </div>
                        );
                      })}
                  </div>

                  {/* CTA */}
                  {isCurrentPlan ? (
                    <Button variant="outline" className="w-full" disabled>
                      ✓ باقتك الحالية
                    </Button>
                  ) : (
                    <Button
                      className={`w-full ${isRecommended ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                      variant={isRecommended ? "default" : "outline"}
                      onClick={() => handleSubscribe(plan.id, isFree)}
                      disabled={subscribeMutation.isPending}
                    >
                      {subscribeMutation.isPending ? "جارٍ الاشتراك..." : isFree ? "ابدأ مجاناً" : `ابدأ تجربة ${plan.trialDays} يوم`}
                      <ArrowRight className="h-4 w-4 mr-2" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        {comparison && comparison.matrix.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-center mb-8">مقارنة تفصيلية للمزايا</h2>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-right p-4 font-semibold min-w-[200px]">الميزة</th>
                    {comparison.plans.map((p) => (
                      <th key={p.id} className="text-center p-4 font-semibold min-w-[120px]">
                        {p.nameAr ?? p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparison.matrix.map((row, i) => (
                    <tr key={row.key} className={`border-b ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                      <td className="p-4 font-medium">{row.label}</td>
                      {row.planAccess.map((access) => (
                        <td key={access.planId} className="p-4 text-center">
                          {access.enabled ? (
                            access.limitValue !== null ? (
                              <span className="text-primary font-semibold">{access.limitValue}</span>
                            ) : (
                              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                            )
                          ) : (
                            <XCircle className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FAQ / Trust */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-sm">
            جميع الباقات تشمل: دعم فني، نسخ احتياطية يومية، تشفير البيانات، وشهادة SSL
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            الأسعار بالريال السعودي وتشمل ضريبة القيمة المضافة
          </p>
        </div>
      </div>
    </div>
  );
}
