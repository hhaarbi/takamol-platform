import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
// useAuth not needed here
// import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, CheckCircle2, ArrowRight, ArrowLeft, Crown, Zap, Rocket } from "lucide-react";

type Step = "plan" | "company" | "done";

export default function Onboarding() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("plan");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [form, setForm] = useState({
    name: "",
    nameEn: "",
    crNumber: "",
    vatNumber: "",
    phone: "",
    email: "",
    city: "المدينة المنورة",
    address: "",
    website: "",
  });

  const { data: plans = [] } = trpc.plans.list.useQuery();
  const createCompany = trpc.companies.create.useMutation({
    onSuccess: () => {
      setStep("done");
    },
    onError: (err) => {
      toast.error(err.message || "حدث خطأ أثناء إنشاء الشركة");
    },
  });

  const planIcons = [Zap, Rocket, Crown];
  const planColors = [
    "from-blue-500 to-blue-600",
    "from-purple-500 to-purple-600",
    "from-amber-500 to-amber-600",
  ];

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("اسم الشركة مطلوب");
      return;
    }
    createCompany.mutate({
      ...form,
      planId: selectedPlanId ?? undefined,
    });
  };

  if (step === "done") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full text-center bg-slate-800 border-slate-700">
          <CardContent className="pt-10 pb-8">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">تم إنشاء شركتك بنجاح!</h2>
            <p className="text-slate-400 mb-2">مرحباً بك في منصة تكامل</p>
            <p className="text-slate-500 text-sm mb-8">
              تمتع بتجربة مجانية لمدة يومين كاملين. بعدها يمكنك الاشتراك في الباقة المناسبة.
            </p>
            <Button
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
              onClick={() => navigate("/dashboard")}
            >
              الانتقال للوحة التحكم
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-white">تكامل</h1>
          </div>
          <p className="text-slate-400 text-lg">منصة إدارة الأملاك الاحترافية</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {[
            { key: "plan", label: "اختر الباقة" },
            { key: "company", label: "بيانات الشركة" },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step === s.key
                  ? "bg-amber-500 text-black"
                  : (s.key === "plan" && step === "company")
                  ? "bg-green-500 text-white"
                  : "bg-slate-700 text-slate-400"
              }`}>
                {(s.key === "plan" && step === "company") ? "✓" : i + 1}
              </div>
              <span className={`text-sm ${step === s.key ? "text-white font-semibold" : "text-slate-500"}`}>
                {s.label}
              </span>
              {i < 1 && <div className="w-12 h-px bg-slate-700 mx-2" />}
            </div>
          ))}
        </div>

        {/* Step 1: Plan Selection */}
        {step === "plan" && (
          <div>
            <h2 className="text-xl font-bold text-white text-center mb-2">اختر الباقة المناسبة</h2>
            <p className="text-slate-400 text-center mb-2">جميع الباقات تشمل تجربة مجانية لمدة يومين</p>

            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  billingCycle === "monthly" ? "bg-amber-500 text-black" : "bg-slate-700 text-slate-300"
                }`}
              >
                شهري
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  billingCycle === "yearly" ? "bg-amber-500 text-black" : "bg-slate-700 text-slate-300"
                }`}
              >
                سنوي
                <Badge className="mr-2 bg-green-500/20 text-green-400 border-0 text-xs">وفر 17%</Badge>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {plans.map((plan, i) => {
                const Icon = planIcons[i] ?? Zap;
                const price = billingCycle === "yearly"
                  ? (parseFloat(plan.priceYearly ?? plan.priceMonthly) / 12).toFixed(0)
                  : parseFloat(plan.priceMonthly).toFixed(0);
                const features = (() => {
                  try { return JSON.parse(plan.features ?? "[]") as string[]; }
                  catch { return []; }
                })();

                return (
                  <Card
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`cursor-pointer transition-all border-2 bg-slate-800 ${
                      selectedPlanId === plan.id
                        ? "border-amber-500 shadow-lg shadow-amber-500/20"
                        : "border-slate-700 hover:border-slate-500"
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
                      <CardTitle className="text-white">{plan.nameAr ?? plan.name}</CardTitle>
                      <CardDescription className="text-slate-400">{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-white">{price}</span>
                        <span className="text-slate-400 text-sm"> ريال/شهر</span>
                        {billingCycle === "yearly" && (
                          <p className="text-green-400 text-xs mt-1">يُدفع سنوياً</p>
                        )}
                      </div>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-slate-300 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                          <span>حتى {plan.maxProperties} عقار</span>
                        </li>
                        <li className="flex items-center gap-2 text-slate-300 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                          <span>حتى {plan.maxUnits} وحدة</span>
                        </li>
                        <li className="flex items-center gap-2 text-slate-300 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                          <span>حتى {plan.maxUsers} مستخدمين</span>
                        </li>
                        {features.map((f: string, fi: number) => (
                          <li key={fi} className="flex items-center gap-2 text-slate-300 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      {selectedPlanId === plan.id && (
                        <div className="mt-4 flex items-center gap-2 text-amber-400 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>محدد</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => setStep("company")}
              >
                تخطي — سأختار لاحقاً
              </Button>
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8"
                onClick={() => setStep("company")}
                disabled={!selectedPlanId}
              >
                التالي
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Company Info */}
        {step === "company" && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-xl">بيانات الشركة</CardTitle>
              <CardDescription className="text-slate-400">
                أدخل معلومات شركتك أو مكتبك العقاري
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">اسم الشركة بالعربي *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="مكتب تكامل للعقارات"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">اسم الشركة بالإنجليزي</Label>
                  <Input
                    value={form.nameEn}
                    onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                    placeholder="Takamol Real Estate"
                    className="bg-slate-700 border-slate-600 text-white"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">رقم السجل التجاري</Label>
                  <Input
                    value={form.crNumber}
                    onChange={(e) => setForm({ ...form, crNumber: e.target.value })}
                    placeholder="1234567890"
                    className="bg-slate-700 border-slate-600 text-white"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">الرقم الضريبي (VAT)</Label>
                  <Input
                    value={form.vatNumber}
                    onChange={(e) => setForm({ ...form, vatNumber: e.target.value })}
                    placeholder="300000000000003"
                    className="bg-slate-700 border-slate-600 text-white"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">رقم الجوال</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="0500000000"
                    className="bg-slate-700 border-slate-600 text-white"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">البريد الإلكتروني</Label>
                  <Input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="info@company.com"
                    className="bg-slate-700 border-slate-600 text-white"
                    dir="ltr"
                    type="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">المدينة</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="المدينة المنورة"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">الموقع الإلكتروني</Label>
                  <Input
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://company.com"
                    className="bg-slate-700 border-slate-600 text-white"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">العنوان</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="حي العزيزية، شارع الملك فهد"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  onClick={() => setStep("plan")}
                >
                  <ArrowRight className="w-4 h-4 ml-2" />
                  السابق
                </Button>
                <Button
                  className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8"
                  onClick={handleSubmit}
                  disabled={createCompany.isPending}
                >
                  {createCompany.isPending ? "جارٍ الإنشاء..." : "إنشاء الشركة"}
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
