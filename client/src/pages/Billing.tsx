import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Receipt, Download, CreditCard, Calendar, CheckCircle2,
  Clock, XCircle, AlertTriangle, ChevronLeft, ChevronRight,
  FileText, RefreshCw, Zap, Crown, Building2, Star, Loader2
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const VAT_RATE = 0.15;

const PLAN_FEATURES: Record<string, string[]> = {
  starter: ["حتى 50 وحدة عقارية", "3 مستخدمين", "تقارير أساسية", "دعم بريد إلكتروني", "تخزين 5GB"],
  pro: ["حتى 200 وحدة عقارية", "10 مستخدمين", "تقارير متقدمة + PDF", "دعم أولوية", "تخزين 20GB", "تكامل فال API"],
  enterprise: ["وحدات غير محدودة", "مستخدمون غير محدودون", "جميع التقارير", "دعم مخصص 24/7", "تخزين 100GB", "ZATCA e-invoicing"],
};

const PLAN_ICONS: Record<string, React.ReactNode> = {
  starter: <Zap className="h-5 w-5" />,
  pro: <Crown className="h-5 w-5" />,
  enterprise: <Building2 className="h-5 w-5" />,
};

function getPlanKey(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("starter") || n.includes("مبتدئ")) return "starter";
  if (n.includes("pro") || n.includes("احتراف")) return "pro";
  if (n.includes("enterprise") || n.includes("مؤسسات")) return "enterprise";
  return "starter";
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  paid: { label: "مدفوعة", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle2 },
  pending: { label: "معلقة", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock },
  failed: { label: "فشلت", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: XCircle },
  refunded: { label: "مستردة", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: RefreshCw },
};

const billingCycleLabel: Record<string, string> = {
  monthly: "شهري",
  yearly: "سنوي",
};

function formatDate(ts: number | null | undefined) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatAmount(amount: string | number | null | undefined) {
  const num = parseFloat(String(amount ?? 0));
  return num.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ر.س";
}

function handlePrintInvoice(inv: any, planName: string) {
  const win = window.open("", "_blank");
  if (!win) return;
  const statusLabel = statusConfig[inv.inv?.status ?? "pending"]?.label ?? "—";
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>فاتورة اشتراك ${inv.inv?.invoiceNumber ?? ""}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 40px; color: #1a1a1a; direction: rtl; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a1a1a; padding-bottom: 20px; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; }
        .invoice-title { font-size: 20px; color: #555; margin-top: 4px; }
        .invoice-number { font-size: 13px; color: #888; margin-top: 6px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .badge.pending { background: #fffbeb; color: #d97706; border-color: #fde68a; }
        .badge.failed { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
        .section { margin-bottom: 24px; }
        .section-title { font-size: 14px; font-weight: bold; color: #555; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .field { padding: 10px; background: #f9fafb; border-radius: 6px; }
        .field-label { font-size: 11px; color: #888; margin-bottom: 4px; }
        .field-value { font-size: 14px; font-weight: 600; }
        .amount-box { background: #f0fdf4; border: 2px solid #16a34a; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0; }
        .amount-label { font-size: 13px; color: #555; }
        .amount-value { font-size: 36px; font-weight: bold; color: #16a34a; margin-top: 4px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="company-name">تكامل لإدارة الأملاك</div>
          <div class="invoice-title">فاتورة اشتراك</div>
          <div class="invoice-number">رقم الفاتورة: ${inv.inv?.invoiceNumber ?? "—"}</div>
        </div>
        <div>
          <span class="badge ${inv.inv?.status === "pending" ? "pending" : inv.inv?.status === "failed" ? "failed" : ""}">${statusLabel}</span>
        </div>
      </div>

      <div class="amount-box">
        <div class="amount-label">المبلغ الإجمالي</div>
        <div class="amount-value">${formatAmount(inv.inv?.amount)}</div>
      </div>

      <div class="section">
        <div class="section-title">تفاصيل الاشتراك</div>
        <div class="grid-2">
          <div class="field">
            <div class="field-label">الباقة</div>
            <div class="field-value">${planName}</div>
          </div>
          <div class="field">
            <div class="field-label">دورة الفوترة</div>
            <div class="field-value">${billingCycleLabel[inv.inv?.billingCycle ?? "monthly"] ?? "—"}</div>
          </div>
          <div class="field">
            <div class="field-label">بداية الفترة</div>
            <div class="field-value">${formatDate(inv.inv?.periodStart)}</div>
          </div>
          <div class="field">
            <div class="field-label">نهاية الفترة</div>
            <div class="field-value">${formatDate(inv.inv?.periodEnd)}</div>
          </div>
          <div class="field">
            <div class="field-label">تاريخ الإصدار</div>
            <div class="field-value">${formatDate(inv.inv?.createdAt)}</div>
          </div>
          <div class="field">
            <div class="field-label">تاريخ الدفع</div>
            <div class="field-value">${formatDate(inv.inv?.paidAt)}</div>
          </div>
        </div>
      </div>

      ${inv.inv?.notes ? `<div class="section"><div class="section-title">ملاحظات</div><p style="font-size:13px;color:#555;">${inv.inv.notes}</p></div>` : ""}

      <div class="footer">
        <p>تكامل لإدارة الأملاك — المملكة العربية السعودية</p>
        <p style="margin-top:4px;">جميع الأسعار بالريال السعودي وتشمل ضريبة القيمة المضافة (15%)</p>
      </div>
      <script>window.onload = () => { window.print(); }</script>
    </body>
    </html>
  `;
  win.document.write(html);
  win.document.close();
}

export default function Billing() {
  const [page, setPage] = useState(1);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlanId, setLoadingPlanId] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  const limit = 10;

  const { data, isLoading, refetch } = trpc.subscriptions.getBillingHistory.useQuery(
    { page, limit },
    { refetchOnWindowFocus: false }
  );
  const { data: currentSub } = trpc.subscriptions.getCurrentSubscription.useQuery();
  const { data: stripePlans, isLoading: plansLoading } = trpc.stripe.getPlans.useQuery();
  const { data: stripeSubStatus } = trpc.stripe.getSubscriptionStatus.useQuery();

  const checkoutMutation = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.success("جاري تحويلك إلى صفحة الدفع...");
      }
      setLoadingPlanId(null);
    },
    onError: (err) => {
      toast.error(err.message || "حدث خطأ أثناء إنشاء جلسة الدفع");
      setLoadingPlanId(null);
    },
  });

  const portalMutation = trpc.stripe.createPortalSession.useMutation({
    onSuccess: (data) => { if (data.url) window.open(data.url, "_blank"); },
    onError: (err) => toast.error(err.message),
  });

  const handleSubscribe = (planId: number) => {
    setLoadingPlanId(planId);
    checkoutMutation.mutate({ planId, billingCycle, origin: window.location.origin });
  };

  const currentPlanId = stripeSubStatus?.subscription?.planId;

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">سجل الفواتير</h1>
            <p className="text-muted-foreground text-sm mt-1">
              جميع فواتير اشتراكك في منصة تكامل
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 ml-1" />
              تحديث
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/subscription")}>
              <CreditCard className="h-4 w-4 ml-1" />
              إدارة الاشتراك
            </Button>
          </div>
        </div>

        {/* Stripe Plans Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">الباقات المتاحة</h2>
            <div className="flex items-center gap-2">
              {stripeSubStatus?.hasSubscription && (
                <Button variant="outline" size="sm" onClick={() => portalMutation.mutate({ origin: window.location.origin })} disabled={portalMutation.isPending}>
                  {portalMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <CreditCard className="h-4 w-4 ml-1" />}
                  إدارة الفوترة
                </Button>
              )}
              <div className="bg-muted rounded-lg p-0.5 flex">
                <button onClick={() => setBillingCycle("monthly")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${billingCycle === "monthly" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>شهري</button>
                <button onClick={() => setBillingCycle("yearly")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${billingCycle === "yearly" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>سنوي <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary px-1">وفر 20%</Badge></button>
              </div>
            </div>
          </div>
          {plansLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stripePlans?.map((plan) => {
                const planKey = getPlanKey(plan.name ?? "");
                const isCurrentPlan = currentPlanId === plan.id;
                const price = billingCycle === "yearly" && plan.priceYearly ? Number(plan.priceYearly) / 12 : Number(plan.priceMonthly ?? 0);
                const priceWithVat = price * (1 + VAT_RATE);
                const isRecommended = plan.isRecommended === 1;
                return (
                  <Card key={plan.id} className={`relative flex flex-col ${isRecommended ? "border-primary shadow-md" : ""} ${isCurrentPlan ? "ring-2 ring-primary" : ""}`}>
                    {isRecommended && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground px-3 text-[11px] flex items-center gap-1"><Star className="h-3 w-3" />الأكثر شيوعاً</Badge>
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${isRecommended ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{PLAN_ICONS[planKey]}</div>
                      <CardTitle className="text-base">{plan.nameAr ?? plan.name}</CardTitle>
                      <div className="mt-2">
                        <span className="text-3xl font-bold">{price.toFixed(0)}</span>
                        <span className="text-muted-foreground text-xs mr-1">ر.س / شهر</span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">شامل VAT: {priceWithVat.toFixed(0)} ر.س</p>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <ul className="space-y-1.5 flex-1 mb-4">
                        {(PLAN_FEATURES[planKey] ?? []).map((f, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-xs"><CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />{f}</li>
                        ))}
                      </ul>
                      {isCurrentPlan ? (
                        <Button className="w-full" variant="outline" size="sm" disabled><CheckCircle2 className="h-4 w-4 ml-1" />باقتك الحالية</Button>
                      ) : (
                        <Button className="w-full" size="sm" variant={isRecommended ? "default" : "outline"} onClick={() => handleSubscribe(plan.id)} disabled={loadingPlanId === plan.id}>
                          {loadingPlanId === plan.id ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : null}
                          {stripeSubStatus?.hasSubscription ? "ترقية" : "اشترك الآن"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Current Plan Summary */}
        {currentSub && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      الباقة الحالية: {currentSub.plan?.nameAr ?? currentSub.plan?.name ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      تنتهي في: {formatDate(currentSub.subscription?.endDate ?? null)}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    currentSub.subscription?.status === "active"
                      ? "bg-green-500/10 text-green-600 border-green-500/20"
                      : currentSub.subscription?.status === "trialing"
                      ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  }
                >
                  {currentSub.subscription?.status === "active"
                    ? "نشط"
                    : currentSub.subscription?.status === "trialing"
                    ? "تجربة مجانية"
                    : currentSub.subscription?.status ?? "—"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoices Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              الفواتير ({total})
            </CardTitle>
            <CardDescription>
              سجل كامل بجميع فواتير الاشتراك
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">لا توجد فواتير بعد</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  ستظهر فواتير اشتراكك هنا بعد أول عملية دفع
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-right">رقم الفاتورة</TableHead>
                        <TableHead className="text-right">الباقة</TableHead>
                        <TableHead className="text-right">المبلغ</TableHead>
                        <TableHead className="text-right">الفترة</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">تاريخ الإصدار</TableHead>
                        <TableHead className="text-center">طباعة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item: any) => {
                        const status = statusConfig[item.inv?.status ?? "pending"];
                        const StatusIcon = status?.icon ?? Clock;
                        const planName = item.plan?.nameAr ?? item.plan?.name ?? "—";
                        return (
                          <TableRow key={item.inv?.id} className="hover:bg-muted/30">
                            <TableCell className="font-mono text-sm font-medium">
                              {item.inv?.invoiceNumber ?? `INV-${item.inv?.id}`}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{planName}</span>
                              <span className="text-xs text-muted-foreground block">
                                {billingCycleLabel[item.inv?.billingCycle ?? "monthly"]}
                              </span>
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatAmount(item.inv?.amount)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {formatDate(item.inv?.periodStart)} — {formatDate(item.inv?.periodEnd)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={status?.color ?? ""}>
                                <StatusIcon className="h-3 w-3 ml-1" />
                                {status?.label ?? "—"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(item.inv?.createdAt)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handlePrintInvoice(item, planName)}
                                title="طباعة / تنزيل"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      عرض {(page - 1) * limit + 1} — {Math.min(page * limit, total)} من {total} فاتورة
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                        السابق
                      </Button>
                      <span className="flex items-center px-3 text-sm font-medium">
                        {page} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                      >
                        التالي
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">ملاحظة حول الفواتير</p>
                <p className="text-muted-foreground">
                  جميع الفواتير بالريال السعودي وتشمل ضريبة القيمة المضافة (15%). 
                  للاستفسار عن أي فاتورة أو طلب استرداد، يرجى التواصل مع فريق الدعم.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
