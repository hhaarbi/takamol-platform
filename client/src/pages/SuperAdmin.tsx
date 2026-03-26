import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Building2, Users, CreditCard, TrendingUp, AlertTriangle,
  Search, RefreshCw, CheckCircle, XCircle, Clock, BarChart3,
  DollarSign, Activity, Shield
} from "lucide-react";
import { toast } from "sonner";

// ─── Status badge helper ──────────────────────────────────────────────────────
function SubStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    active: { label: "نشط", variant: "default" },
    trialing: { label: "تجريبي", variant: "secondary" },
    cancelled: { label: "ملغي", variant: "destructive" },
    expired: { label: "منتهي", variant: "outline" },
    suspended: { label: "موقوف", variant: "destructive" },
  };
  const cfg = map[status] ?? { label: status, variant: "outline" };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ title, value, sub, icon: Icon, color }: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SuperAdmin() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // ── Data queries ──────────────────────────────────────────────────────────
  const { data: companies = [], refetch: refetchCompanies, isLoading: loadingCompanies } =
    trpc.companies.listAll.useQuery(undefined, { retry: 1 });

  const { data: allSubs = [], refetch: refetchSubs, isLoading: loadingSubs } =
    trpc.subscriptions.listAll.useQuery(undefined, { retry: 1 });

  const { data: plans = [] } = trpc.subscriptions.getPlans.useQuery(undefined, { retry: 1 });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const cancelMut = trpc.subscriptions.cancelSubscription.useMutation({
    onSuccess: () => { toast.success("تم إلغاء الاشتراك"); refetchSubs(); },
    onError: (e) => toast.error(e.message),
  });

  // ── Derived KPIs ──────────────────────────────────────────────────────────
  const totalCompanies = companies.length;
  const activeCompanies = allSubs.filter((s: any) => s.status === "active").length;
  const trialingCompanies = allSubs.filter((s: any) => s.status === "trialing").length;
  const cancelledSubs = allSubs.filter((s: any) => s.status === "cancelled").length;

  // MRR calculation
  const mrr = allSubs
    .filter((s: any) => s.status === "active")
    .reduce((acc: number, s: any) => {
      const amount = Number(s.amount ?? 0);
      return acc + (s.billingCycle === "yearly" ? amount / 12 : amount);
    }, 0);

  const arr = mrr * 12;

  // Plan distribution
  const planDist = plans.map((p: any) => ({
    name: p.nameAr ?? p.name,
    count: allSubs.filter((s: any) => s.planId === p.id && s.status === "active").length,
  }));

  // Filter companies
  const filteredCompanies = companies.filter((c: any) =>
    !search || c.name?.includes(search) || c.email?.includes(search) || c.phone?.includes(search)
  );

  // Match subscription to company
  const getCompanySub = (companyId: number): any =>
    allSubs.find((s: any) => s.companyId === companyId && (s.status === "active" || s.status === "trialing"));

  const getPlanName = (planId: number | null) => {
    if (!planId) return "—";
    const p = plans.find((pl: any) => pl.id === planId);
    return p ? (p.nameAr ?? p.name) : "—";
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              لوحة تحكم Super Admin
            </h1>
            <p className="text-muted-foreground text-sm mt-1">إدارة جميع الشركات والاشتراكات والإيرادات</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { refetchCompanies(); refetchSubs(); }}>
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard title="إجمالي الشركات" value={totalCompanies} icon={Building2} color="bg-blue-500" />
          <KpiCard title="اشتراكات نشطة" value={activeCompanies} sub={`${trialingCompanies} تجريبي`} icon={CheckCircle} color="bg-green-500" />
          <KpiCard
            title="MRR"
            value={`${mrr.toLocaleString("ar-SA", { maximumFractionDigits: 0 })} ر.س`}
            sub={`ARR: ${arr.toLocaleString("ar-SA", { maximumFractionDigits: 0 })} ر.س`}
            icon={DollarSign}
            color="bg-amber-500"
          />
          <KpiCard title="اشتراكات ملغاة" value={cancelledSubs} icon={XCircle} color="bg-red-500" />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 ml-2" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="companies">
              <Building2 className="h-4 w-4 ml-2" />
              الشركات ({totalCompanies})
            </TabsTrigger>
            <TabsTrigger value="subscriptions">
              <CreditCard className="h-4 w-4 ml-2" />
              الاشتراكات ({allSubs.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Plan Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">توزيع الباقات</CardTitle>
                  <CardDescription>عدد الشركات النشطة لكل باقة</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {planDist.map((p: any) => (
                    <div key={p.name} className="flex items-center justify-between">
                      <span className="text-sm">{p.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${activeCompanies > 0 ? (p.count / activeCompanies) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-6 text-center">{p.count}</span>
                      </div>
                    </div>
                  ))}
                  {planDist.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
                  )}
                </CardContent>
              </Card>

              {/* Revenue Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">ملخص الإيرادات</CardTitle>
                  <CardDescription>الإيرادات المتكررة الشهرية والسنوية</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">MRR (شهري)</span>
                    <span className="font-bold text-green-600">
                      {mrr.toLocaleString("ar-SA", { maximumFractionDigits: 0 })} ر.س
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">ARR (سنوي)</span>
                    <span className="font-bold text-blue-600">
                      {arr.toLocaleString("ar-SA", { maximumFractionDigits: 0 })} ر.س
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">متوسط ARPU</span>
                    <span className="font-bold">
                      {activeCompanies > 0
                        ? (mrr / activeCompanies).toLocaleString("ar-SA", { maximumFractionDigits: 0 })
                        : 0} ر.س
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">معدل التحويل (تجريبي → مدفوع)</span>
                    <span className="font-bold">
                      {trialingCompanies + activeCompanies > 0
                        ? Math.round((activeCompanies / (trialingCompanies + activeCompanies)) * 100)
                        : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">حالة الاشتراكات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { label: "نشط", status: "active", icon: CheckCircle, color: "text-green-500" },
                    { label: "تجريبي", status: "trialing", icon: Clock, color: "text-blue-500" },
                    { label: "ملغي", status: "cancelled", icon: XCircle, color: "text-red-500" },
                    { label: "منتهي", status: "expired", icon: AlertTriangle, color: "text-orange-500" },
                    { label: "موقوف", status: "suspended", icon: Activity, color: "text-gray-500" },
                  ].map((item) => {
                    const count = allSubs.filter((s: any) => s.status === item.status).length;
                    return (
                      <div key={item.status} className="flex flex-col items-center p-3 rounded-lg border">
                        <item.icon className={`h-5 w-5 ${item.color} mb-1`} />
                        <span className="text-lg font-bold">{count}</span>
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">قائمة الشركات</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث بالاسم أو الإيميل..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pr-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingCompanies ? (
                  <div className="text-center py-8 text-muted-foreground">جارٍ التحميل...</div>
                ) : filteredCompanies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">لا توجد شركات مسجّلة</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الشركة</TableHead>
                        <TableHead className="text-right">الباقة</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">تاريخ التسجيل</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompanies.map((company: any) => {
                        const sub = getCompanySub(company.id);
                        return (
                          <TableRow key={company.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{company.name}</p>
                                <p className="text-xs text-muted-foreground">{company.email ?? "—"}</p>
                              </div>
                            </TableCell>
                            <TableCell>{getPlanName(sub?.planId ?? null)}</TableCell>
                            <TableCell>
                              {sub ? <SubStatusBadge status={sub.status} /> : <Badge variant="outline">بدون اشتراك</Badge>}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {company.createdAt
                                ? new Date(company.createdAt).toLocaleDateString("ar-SA")
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {sub && sub.status === "active" && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => cancelMut.mutate({ reason: "إلغاء من Super Admin" })}
                                    disabled={cancelMut.isPending}
                                  >
                                    إلغاء
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">جميع الاشتراكات</CardTitle>
                <CardDescription>سجل كامل لجميع اشتراكات الشركات</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSubs ? (
                  <div className="text-center py-8 text-muted-foreground">جارٍ التحميل...</div>
                ) : allSubs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">لا توجد اشتراكات</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الشركة</TableHead>
                        <TableHead className="text-right">الباقة</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">المبلغ</TableHead>
                        <TableHead className="text-right">الدورة</TableHead>
                        <TableHead className="text-right">تاريخ الانتهاء</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allSubs.map((sub: any) => {
                        const company = companies.find((c: any) => c.id === sub.companyId);
                        return (
                          <TableRow key={sub.id}>
                            <TableCell className="font-medium">{company?.name ?? `شركة #${sub.companyId}`}</TableCell>
                            <TableCell>{getPlanName(sub.planId)}</TableCell>
                            <TableCell><SubStatusBadge status={sub.status} /></TableCell>
                            <TableCell>
                              {Number(sub.amount ?? 0).toLocaleString("ar-SA")} ر.س
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {sub.billingCycle === "yearly" ? "سنوي" : "شهري"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {sub.endDate
                                ? new Date(sub.endDate).toLocaleDateString("ar-SA")
                                : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
