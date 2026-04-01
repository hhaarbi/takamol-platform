import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2, Crown, Zap, Building2, Star, Loader2, ArrowRight
} from "lucide-react";
import { toast } from "sonner";

const VAT_RATE = 0.15;

const PLAN_FEATURES: Record<string, string[]> = {
  starter: ["حتى 50 وحدة عقارية", "3 مستخدمين", "تقارير أساسية", "دعم بريد إلكتروني", "تخزين 5GB"],
  pro: ["حتى 200 وحدة عقارية", "10 مستخدمين", "تقارير متقدمة + PDF", "دعم أولوية", "تخزين 20GB", "تكامل فال API"],
  enterprise: ["وحدات غير محدودة", "مستخدمون غير محدودون", "جميع التقارير", "دعم مخصص 24/7", "تخزين 100GB", "ZATCA e-invoicing"],
};

const PLAN_ICONS: Record<string, React.ReactNode> = {
  starter: <Zap className="h-6 w-6" />,
  pro: <Crown className="h-6 w-6" />,
  enterprise: <Building2 className="h-6 w-6" />,
};

function getPlanKey(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("starter") || n.includes("مبتدئ")) return "starter";
  if (n.includes("pro") || n.includes("احتراف")) return "pro";
  if (n.includes("enterprise") || n.includes("مؤسسات")) return "enterprise";
  return "starter";
}

export default function Upgrade() {
  const [, setLocation] = useLocation();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlanId, setLoadingPlanId] = useState<number | null>(null);

  const { data: plans, isLoading } = trpc.stripe.getPlans.useQuery();
  const { data: subStatus } = trpc.stripe.getSubscriptionStatus.useQuery();

  const upgradeMutation = trpc.stripe.upgradeSubscription.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.success("جاري تحويلك إلى صفحة الترقية...");
      }
      setLoadingPlanId(null);
    },
    onError: (err) => {
      toast.error(err.message || "حدث خطأ أثناء الترقية");
      setLoadingPlanId(null);
    },
  });

  const checkoutMutation = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.success("جاري تحويلك إلى صفحة الدفع...");
      }
      setLoadingPlanId(null);
    },
    onError: (err) => {
      toast.error(err.message || "حدث خطأ");
      setLoadingPlanId(null);
    },
  });

  const handleSelect = (planId: number) => {
    setLoadingPlanId(planId);
    if (subStatus?.hasSubscription) {
      upgradeMutation.mutate({ newPlanId: planId, origin: window.location.origin });
    } else {
      checkoutMutation.mutate({ planId, billingCycle, origin: window.location.origin });
    }
  };

  const currentPlanId = subStatus?.subscription?.planId;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto" dir="rtl">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Crown className="h-3 w-3 ml-1" />
            ترقية الباقة
          </Badge>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            اختر الباقة المناسبة لأعمالك
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            جميع الباقات تشمل ضريبة القيمة المضافة 15% وفقاً لأنظمة المملكة العربية السعودية
          </p>

          {/* Billing Cycle Toggle */}
          <div className="flex justify-center mt-6">
            <div className="bg-muted rounded-xl p-1 flex gap-1">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                  billingCycle === "monthly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                شهري
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  billingCycle === "yearly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                سنوي
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">وفر 20%</Badge>
              </button>
            </div>
          </div>
        </div>

        {/* Plans */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans?.map((plan) => {
              const planKey = getPlanKey(plan.name ?? "");
              const isCurrentPlan = currentPlanId === plan.id;
              const price = billingCycle === "yearly" && plan.priceYearly
                ? Number(plan.priceYearly) / 12
                : Number(plan.priceMonthly ?? 0);
              const priceWithVat = price * (1 + VAT_RATE);
              const isRecommended = plan.isRecommended === 1;

              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col transition-all duration-200 ${
                    isRecommended
                      ? "border-primary shadow-lg shadow-primary/10 scale-[1.02]"
                      : "border-border hover:border-primary/50"
                  } ${isCurrentPlan ? "ring-2 ring-primary" : ""}`}
                >
                  {isRecommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1 flex items-center gap-1">
                        <Star className="h-3 w-3" /> الأكثر شيوعاً
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                      isRecommended ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {PLAN_ICONS[planKey]}
                    </div>
                    <CardTitle className="text-xl">{plan.nameAr ?? plan.name}</CardTitle>

                    <div className="mt-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-foreground">
                          {price.toFixed(0)}
                        </span>
                        <span className="text-muted-foreground text-sm">ر.س / شهر</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        شامل VAT 15%: {priceWithVat.toFixed(0)} ر.س
                      </p>
                      {billingCycle === "yearly" && plan.priceYearly && (
                        <p className="text-xs text-primary mt-1">
                          يُدفع سنوياً: {(Number(plan.priceYearly) * (1 + VAT_RATE)).toFixed(0)} ر.س
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-2 flex-1">
                      {(PLAN_FEATURES[planKey] ?? []).map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6">
                      {isCurrentPlan ? (
                        <Button className="w-full" variant="outline" disabled>
                          <CheckCircle2 className="h-4 w-4 ml-2" />
                          باقتك الحالية
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          variant={isRecommended ? "default" : "outline"}
                          onClick={() => handleSelect(plan.id)}
                          disabled={loadingPlanId === plan.id}
                        >
                          {loadingPlanId === plan.id ? (
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                          ) : (
                            <ArrowRight className="h-4 w-4 ml-2" />
                          )}
                          {subStatus?.hasSubscription ? "ترقية إلى هذه الباقة" : "اشترك الآن"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Back Button */}
        <div className="text-center mt-8">
          <Button variant="ghost" onClick={() => setLocation("/billing")}>
            العودة إلى الفواتير
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
