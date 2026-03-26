import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Crown, Zap, Rocket, CheckCircle2, Building2, Users, Home,
  CreditCard, Calendar, TrendingUp, AlertTriangle, RefreshCw
} from "lucide-react";

const planIcons = [Zap, Rocket, Crown];
const planColors = [
  "from-blue-500 to-blue-600",
  "from-purple-500 to-purple-600",
  "from-amber-500 to-amber-600",
];

export default function Subscription() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [upgrading, setUpgrading] = useState(false);

  const { data: plans = [] } = trpc.plans.list.useQuery();
  const { data: myCompany, refetch: refetchCompany } = trpc.companies.getMine.useQuery();
  const { data: mySub, refetch: refetchSub } = trpc.subscriptions.getMine.useQuery();

  const upgradeSub = trpc.subscriptions.upgrade.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الاشتراك بنجاح");
      setUpgrading(false);
      refetchSub();
      refetchCompany();
    },
    onError: (err) => {
      toast.error(err.message || "حدث خطأ أثناء التحديث");
      setUpgrading(false);
    },
  });

  const currentPlan = plans.find((p) => p.id === mySub?.planId);
  const daysLeft = mySub?.trialEndDate
    ? Math.max(0, Math.ceil((mySub.trialEndDate - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  const isOnTrial = mySub?.status === "trialing" && daysLeft !== null && daysLeft > 0;

  const usagePercent = (used: number, max: number) =>
    max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto" dir="rtl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">إدارة الاشتراك</h1>
          <p className="text-slate-500 mt-1">عرض وإدارة اشتراكك في منصة تكامل</p>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-amber-700 font-medium">الباقة الحالية</p>
                  <p className="text-lg font-bold text-amber-900">
                    {currentPlan?.nameAr ?? currentPlan?.name ?? "غير مشترك"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-blue-700 font-medium">حالة الاشتراك</p>
                  <div className="flex items-center gap-2">
                    {isOnTrial ? (
                      <Badge className="bg-blue-200 text-blue-800 border-0">
                        تجريبي — {daysLeft} {daysLeft === 1 ? "يوم" : "أيام"} متبقية
                      </Badge>
                    ) : mySub?.status === "active" ? (
                      <Badge className="bg-green-200 text-green-800 border-0">نشط</Badge>
                    ) : mySub?.status === "expired" ? (
                      <Badge className="bg-red-200 text-red-800 border-0">منتهي</Badge>
                    ) : (
                      <Badge className="bg-slate-200 text-slate-700 border-0">غير مفعّل</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-green-700 font-medium">تاريخ التجديد</p>
                  <p className="text-lg font-bold text-green-900">
                    {mySub?.endDate
                      ? new Date(mySub.endDate).toLocaleDateString("ar-SA")
                      : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trial Warning */}
        {isOnTrial && daysLeft <= 1 && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800">فترتك التجريبية تنتهي قريباً</p>
              <p className="text-amber-700 text-sm mt-1">
                اشترك الآن للاستمرار في استخدام جميع الميزات دون انقطاع.
              </p>
            </div>
          </div>
        )}

        {/* Usage Stats */}
        {myCompany && currentPlan && (
          <Card className="mb-8 border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">استخدام الباقة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Building2 className="w-4 h-4" /> العقارات
                  </span>
                  <span className="text-slate-500">
                    0 / {currentPlan.maxProperties}
                  </span>
                </div>
                <Progress value={0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Home className="w-4 h-4" /> الوحدات
                  </span>
                  <span className="text-slate-500">
                    0 / {currentPlan.maxUnits}
                  </span>
                </div>
                <Progress value={0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Users className="w-4 h-4" /> المستخدمون
                  </span>
                  <span className="text-slate-500">
                    0 / {currentPlan.maxUsers}
                  </span>
                </div>
                <Progress value={0} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan Selection */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-800 mb-1">الباقات المتاحة</h2>
          <p className="text-slate-500 text-sm mb-4">اختر الباقة المناسبة لحجم أعمالك</p>

          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                billingCycle === "monthly" ? "bg-amber-500 text-black" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              شهري
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                billingCycle === "yearly" ? "bg-amber-500 text-black" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              سنوي
              <Badge className="mr-2 bg-green-100 text-green-700 border-0 text-xs">وفر 17%</Badge>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => {
            const Icon = planIcons[i] ?? Zap;
            const price = billingCycle === "yearly"
              ? (parseFloat(plan.priceYearly ?? plan.priceMonthly) / 12).toFixed(0)
              : parseFloat(plan.priceMonthly).toFixed(0);
            const features = (() => {
              try { return JSON.parse(plan.features ?? "[]") as string[]; }
              catch { return []; }
            })();
            const isCurrent = mySub?.planId === plan.id;

            return (
              <Card
                key={plan.id}
                className={`border-2 transition-all ${
                  isCurrent
                    ? "border-amber-500 shadow-lg shadow-amber-500/10"
                    : "border-slate-200 hover:border-slate-300"
                } ${i === 1 ? "relative" : ""}`}
              >
                {i === 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-amber-500 text-black font-bold px-3">الأكثر شيوعاً</Badge>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${planColors[i]} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-slate-800">{plan.nameAr ?? plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-slate-800">{price}</span>
                    <span className="text-slate-500 text-sm"> ريال/شهر</span>
                    {billingCycle === "yearly" && (
                      <p className="text-green-600 text-xs mt-1">يُدفع سنوياً</p>
                    )}
                  </div>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-slate-600 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      <span>حتى {plan.maxProperties} عقار</span>
                    </li>
                    <li className="flex items-center gap-2 text-slate-600 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      <span>حتى {plan.maxUnits} وحدة</span>
                    </li>
                    <li className="flex items-center gap-2 text-slate-600 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      <span>حتى {plan.maxUsers} مستخدمين</span>
                    </li>
                    {features.map((f: string, fi: number) => (
                      <li key={fi} className="flex items-center gap-2 text-slate-600 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <div className="flex items-center gap-2 text-amber-600 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>باقتك الحالية</span>
                    </div>
                  ) : (
                    <Button
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white"
                      onClick={() => {
                        setUpgrading(true);
                        upgradeSub.mutate({ planId: plan.id, billingCycle });
                      }}
                      disabled={upgradeSub.isPending}
                    >
                      {upgradeSub.isPending && upgrading ? (
                        <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                      ) : (
                        <TrendingUp className="w-4 h-4 ml-2" />
                      )}
                      {(mySub?.planId ?? 0) < plan.id ? "ترقية" : "تخفيض"} إلى هذه الباقة
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
