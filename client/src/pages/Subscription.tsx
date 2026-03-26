import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Crown, Zap, CheckCircle2, Building2, Users, FileText,
  CreditCard, Calendar, TrendingUp, AlertTriangle, RefreshCw,
  XCircle, Receipt, ArrowUpCircle, Clock
} from "lucide-react";
import { useLocation } from "wouter";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: "نشط", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle2 },
  trialing: { label: "تجربة مجانية", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Zap },
  past_due: { label: "متأخر السداد", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: AlertTriangle },
  cancelled: { label: "ملغي", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: XCircle },
  expired: { label: "منتهي", color: "bg-gray-500/10 text-gray-600 border-gray-500/20", icon: Clock },
  suspended: { label: "موقوف", color: "bg-orange-500/10 text-orange-600 border-orange-500/20", icon: AlertTriangle },
};

function UsageBar({ label, current, limit, icon: Icon }: { label: string; current: number; limit: number | null; icon: any }) {
  const isUnlimited = !limit || limit === -1;
  const pct = !isUnlimited && limit! > 0 ? Math.min(100, (current / limit!) * 100) : 0;
  const isWarning = pct >= 80;
  const isDanger = pct >= 95;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{label}</span>
        </div>
        <span className={`font-semibold ${isDanger ? "text-red-500" : isWarning ? "text-amber-500" : ""}`}>
          {current}{isUnlimited ? "" : ` / ${limit}`}
          {isUnlimited && <span className="text-muted-foreground font-normal mr-1">(غير محدود)</span>}
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={pct}
          className={`h-2 ${isDanger ? "[&>div]:bg-red-500" : isWarning ? "[&>div]:bg-amber-500" : ""}`}
        />
      )}
      {isDanger && <p className="text-xs text-red-500">⚠ وصلت إلى الحد الأقصى. يُنصح بالترقية.</p>}
    </div>
  );
}

export default function Subscription() {
  const [, setLocation] = useLocation();
  const [cancelReason, setCancelReason] = useState("");

  const { data: sub, isLoading, refetch } = trpc.subscriptions.getCurrentSubscription.useQuery();
  const { data: usage } = trpc.subscriptions.getUsageStats.useQuery();
  const { data: billing } = trpc.subscriptions.getBillingHistory.useQuery({ page: 1, limit: 10 });
  const { data: plans = [] } = trpc.subscriptions.getPlans.useQuery({ billingCycle: "monthly" });

  const cancelMutation = trpc.subscriptions.cancelSubscription.useMutation({ onSuccess: () => refetch() });
  const renewMutation = trpc.subscriptions.renewSubscription.useMutation({ onSuccess: () => refetch() });
  const upgradeMutation = trpc.subscriptions.upgradePlan.useMutation({ onSuccess: () => refetch() });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!sub) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-16 text-center" dir="rtl">
          <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">لا يوجد اشتراك نشط</h2>
          <p className="text-muted-foreground mb-6">اختر الباقة المناسبة لبدء استخدام المنصة</p>
          <Button onClick={() => setLocation("/pricing")} size="lg">
            عرض الباقات
            <ArrowUpCircle className="h-4 w-4 mr-2" />
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const status = sub.subscription.computedStatus;
  const statusInfo = statusConfig[status] ?? statusConfig.active;
  const StatusIcon = statusInfo.icon;
  const currentPlanIdx = plans.findIndex((p: any) => p.id === sub.plan?.id);
  const upgradablePlans = plans.filter((_: any, i: number) => i > currentPlanIdx);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">الاشتراك والباقات</h1>
            <p className="text-muted-foreground text-sm mt-1">إدارة اشتراكك وتتبع الاستخدام</p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/pricing")}>عرض جميع الباقات</Button>
        </div>

        {/* Alerts */}
        {(status === "past_due" || status === "expired") && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  {status === "expired" ? "انتهى اشتراكك" : "اشتراكك متأخر السداد"}
                </p>
                <p className="text-sm text-muted-foreground">جدّد اشتراكك للاستمرار في الوصول إلى جميع المزايا</p>
              </div>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => renewMutation.mutate({ billingCycle: (sub.subscription.billingCycle as any) ?? "monthly" })}
                disabled={renewMutation.isPending}>
                <RefreshCw className="h-4 w-4 ml-1" /> تجديد الآن
              </Button>
            </CardContent>
          </Card>
        )}

        {status === "trialing" && sub.trialDaysLeft !== null && (
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="flex items-center gap-3 py-4">
              <Zap className="h-5 w-5 text-blue-500 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-blue-700 dark:text-blue-400">أنت في فترة التجربة المجانية</p>
                <p className="text-sm text-muted-foreground">تبقّى <strong>{sub.trialDaysLeft} يوم</strong> من تجربتك المجانية</p>
              </div>
              <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => setLocation("/pricing")}>
                اشترك الآن
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" dir="rtl">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="usage">الاستخدام</TabsTrigger>
            <TabsTrigger value="billing">الفواتير</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-500" /> الباقة الحالية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{sub.plan?.nameAr ?? sub.plan?.name ?? "—"}</span>
                    <Badge className={statusInfo.color}>
                      <StatusIcon className="h-3 w-3 ml-1" />{statusInfo.label}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>دورة الفوترة</span>
                      <span className="font-medium">{sub.subscription.billingCycle === "yearly" ? "سنوية" : "شهرية"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>المبلغ</span>
                      <span className="font-medium">{Number(sub.subscription.amount ?? 0).toLocaleString("ar-SA")} ر.س</span>
                    </div>
                    {sub.subscription.endDate && (
                      <div className="flex justify-between">
                        <span>تاريخ الانتهاء</span>
                        <span className={`font-medium ${sub.isExpiringSoon ? "text-amber-500" : ""}`}>
                          {new Date(sub.subscription.endDate).toLocaleDateString("ar-SA")}
                          {sub.isExpiringSoon && ` (${sub.daysLeft} يوم)`}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> ملخص الاستخدام
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {usage ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" /> العقارات</span>
                        <span className="font-medium">{usage.properties.current} / {usage.properties.limit === -1 ? "∞" : usage.properties.limit}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1"><FileText className="h-3 w-3" /> العقود</span>
                        <span className="font-medium">{usage.contracts.current}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> المستخدمون</span>
                        <span className="font-medium">{usage.users.current} / {usage.users.limit === -1 ? "∞" : usage.users.limit}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">لا توجد بيانات</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {upgradablePlans.length > 0 && status !== "cancelled" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ArrowUpCircle className="h-4 w-4 text-primary" /> ترقية الباقة
                  </CardTitle>
                  <CardDescription>احصل على مزايا أكثر بترقية باقتك</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {upgradablePlans.map((plan) => (
                      <div key={plan.id} className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 transition-colors">
                        <div>
                          <p className="font-medium">{plan.nameAr ?? plan.name}</p>
                          <p className="text-sm text-muted-foreground">{Number(plan.priceMonthly).toLocaleString("ar-SA")} ر.س / شهر</p>
                        </div>
                        <Button size="sm"
                          onClick={() => upgradeMutation.mutate({ newPlanId: plan.id, billingCycle: "monthly" })}
                          disabled={upgradeMutation.isPending}>
                          ترقية
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3 justify-end">
              {(status === "active" || status === "trialing") && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5">
                      <XCircle className="h-4 w-4 ml-1" /> إلغاء الاشتراك
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>تأكيد إلغاء الاشتراك</AlertDialogTitle>
                      <AlertDialogDescription>سيستمر وصولك حتى نهاية الفترة الحالية. هل أنت متأكد؟</AlertDialogDescription>
                    </AlertDialogHeader>
                    <textarea className="w-full border rounded-lg p-2 text-sm resize-none mt-2" rows={3}
                      placeholder="سبب الإلغاء (اختياري)" value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)} />
                    <AlertDialogFooter>
                      <AlertDialogCancel>تراجع</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive hover:bg-destructive/90"
                        onClick={() => cancelMutation.mutate({ reason: cancelReason })}>
                        تأكيد الإلغاء
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {(status === "cancelled" || status === "expired") && (
                <Button onClick={() => renewMutation.mutate({ billingCycle: "monthly" })} disabled={renewMutation.isPending}>
                  <RefreshCw className="h-4 w-4 ml-1" /> تجديد الاشتراك
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="usage" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">تفاصيل الاستخدام</CardTitle>
                <CardDescription>مقارنة استخدامك الحالي بحدود باقتك</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {usage ? (
                  <>
                    <UsageBar label="العقارات" current={usage.properties.current} limit={usage.properties.limit} icon={Building2} />
                    <UsageBar label="الوحدات" current={usage.units.current} limit={usage.units.limit} icon={Building2} />
                    <UsageBar label="العقود النشطة" current={usage.contracts.current} limit={usage.contracts.limit} icon={FileText} />
                    <UsageBar label="المستخدمون" current={usage.users.current} limit={usage.users.limit} icon={Users} />
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p>لا توجد بيانات استخدام متاحة</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4" /> سجل الفواتير
                </CardTitle>
              </CardHeader>
              <CardContent>
                {billing && billing.items.length > 0 ? (
                  <div className="space-y-2">
                    {billing.items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Receipt className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.inv?.invoiceNumber ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.plan?.nameAr ?? item.plan?.name ?? "—"} •{" "}
                              {item.inv?.createdAt ? new Date(item.inv.createdAt).toLocaleDateString("ar-SA") : "—"}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-sm">{Number(item.inv?.amount ?? 0).toLocaleString("ar-SA")} ر.س</p>
                          <Badge variant="outline" className={item.inv?.status === "paid" ? "text-green-600 border-green-500/30 text-xs" : "text-amber-600 border-amber-500/30 text-xs"}>
                            {item.inv?.status === "paid" ? "مدفوع" : "معلق"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p>لا توجد فواتير بعد</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
