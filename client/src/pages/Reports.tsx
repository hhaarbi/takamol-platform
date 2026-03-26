import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useState, useMemo } from "react";
import {
  BarChart3, FileText, Download, TrendingUp, TrendingDown,
  Building2, Users, Wallet, Wrench, Calendar, Search,
  ArrowUpRight, ArrowDownRight, Filter, Printer, PieChart,
  AlertTriangle, CheckCircle2, Clock, DollarSign, Home,
  ChevronRight, ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart
} from "recharts";

const COLORS = ["#D4A853", "#2D5F5D", "#8B6F47", "#4A7C7A", "#C49B3C", "#1D4F4D", "#A68B5B", "#3A6C6A"];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string | Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("ar-SA", { year: "numeric", month: "short", day: "numeric" }).format(new Date(date));
}

export default function Reports() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [period, setPeriod] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const financialSummary = trpc.financial.summary.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" || user?.role === "super_admin" });
  const overdueList = trpc.payments.overdue.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" || user?.role === "super_admin" });
  const propertiesData = trpc.properties.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" || user?.role === "super_admin" });
  const tenantsData = trpc.tenants.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" || user?.role === "super_admin" });
  const maintenanceData = trpc.maintenance.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" || user?.role === "super_admin" });
  const collectionsData = trpc.payments.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" || user?.role === "super_admin" });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin" && user?.role !== "super_admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">غير مصرح</h2>
            <p className="text-muted-foreground mb-4">يجب تسجيل الدخول كمدير للوصول للتقارير</p>
            <Button onClick={() => window.location.href = getLoginUrl()}>تسجيل الدخول</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary = financialSummary.data;
  const overdue = overdueList.data || [];
  const properties = propertiesData.data || [];
  const tenants = tenantsData.data || [];
  const maintenanceList = maintenanceData.data || [];
  const collections = collectionsData.data || [];

  const totalProperties = properties.length;
  const occupiedProperties = properties.filter((p: any) => p.status === "rented").length;
  const vacantProperties = properties.filter((p: any) => p.status === "available").length;
  const occupancyRate = totalProperties > 0 ? Math.round((occupiedProperties / totalProperties) * 100) : 0;

  const totalOverdue = overdue.reduce((sum: number, o: any) => sum + Number(o.amount || 0), 0);
  const totalCollected = collections.filter((c: any) => c.status === "paid").reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
  const totalPending = collections.filter((c: any) => c.status === "pending").reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);

  const maintenancePending = maintenanceList.filter((m: any) => m.status === "pending").length;
  const maintenanceInProgress = maintenanceList.filter((m: any) => m.status === "in_progress").length;
  const maintenanceCompleted = maintenanceList.filter((m: any) => m.status === "completed").length;
  const maintenanceCost = maintenanceList.reduce((sum: number, m: any) => sum + Number(m.actualCost || 0), 0);

  const propertyTypeData = [
    { name: "شقة", value: properties.filter((p: any) => p.type === "apartment").length },
    { name: "فيلا", value: properties.filter((p: any) => p.type === "villa").length },
    { name: "محل تجاري", value: properties.filter((p: any) => p.type === "shop").length },
    { name: "مستودع", value: properties.filter((p: any) => p.type === "warehouse").length },
    { name: "أرض", value: properties.filter((p: any) => p.type === "land").length },
    { name: "أخرى", value: properties.filter((p: any) => !["apartment", "villa", "shop", "warehouse", "land"].includes(p.type)).length },
  ].filter(d => d.value > 0);

  const collectionStatusData = [
    { name: "محصّل", value: totalCollected, color: "#2D5F5D" },
    { name: "معلّق", value: totalPending, color: "#D4A853" },
    { name: "متأخر", value: totalOverdue, color: "#DC2626" },
  ].filter(d => d.value > 0);

  const maintenanceStatusData = [
    { name: "معلّقة", value: maintenancePending, color: "#D4A853" },
    { name: "جارية", value: maintenanceInProgress, color: "#2D5F5D" },
    { name: "مكتملة", value: maintenanceCompleted, color: "#4A7C7A" },
  ].filter(d => d.value > 0);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">التقارير والإحصائيات</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1">
              <Printer className="h-4 w-4" />
              طباعة
            </Button>
            <Button variant="outline" size="sm" className="gap-1">
              <Download className="h-4 w-4" />
              تصدير Excel
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">إجمالي العقارات</p>
                  <p className="text-2xl font-bold">{totalProperties}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Badge variant="secondary" className="text-xs">{occupancyRate}% نسبة الإشغال</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">إجمالي المحصّل</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCollected)}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">المتأخرات</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOverdue)}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Badge variant="destructive" className="text-xs">{overdue.length} دفعة متأخرة</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">تكاليف الصيانة</p>
                  <p className="text-2xl font-bold">{formatCurrency(maintenanceCost)}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-orange-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Badge variant="outline" className="text-xs">{maintenancePending} طلب معلّق</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="financial">المالية</TabsTrigger>
            <TabsTrigger value="properties">العقارات</TabsTrigger>
            <TabsTrigger value="maintenance">الصيانة</TabsTrigger>
            <TabsTrigger value="overdue">المتأخرات</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Collection Status Pie */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    حالة التحصيل
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {collectionStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <RePieChart>
                        <Pie data={collectionStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {collectionStatusData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </RePieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">لا توجد بيانات تحصيل</div>
                  )}
                </CardContent>
              </Card>

              {/* Property Types Pie */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    أنواع العقارات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {propertyTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <RePieChart>
                        <Pie data={propertyTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                          {propertyTypeData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">لا توجد عقارات</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Occupancy Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" />
                  نسبة الإشغال
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">مؤجرة</span>
                    <span className="font-bold text-green-600">{occupiedProperties}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                    <div className="bg-green-600 h-full rounded-full transition-all" style={{ width: `${occupancyRate}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">شاغرة</span>
                    <span className="font-bold text-orange-600">{vacantProperties}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{occupancyRate}%</p>
                      <p className="text-xs text-muted-foreground">نسبة الإشغال</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">{vacantProperties}</p>
                      <p className="text-xs text-muted-foreground">شاغرة</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{totalProperties}</p>
                      <p className="text-xs text-muted-foreground">إجمالي</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6 mt-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/10">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-muted-foreground">إجمالي الإيرادات</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(summary?.totalRevenue || 0)}</p>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/10">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-muted-foreground">إجمالي المصاريف</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(summary?.totalExpenses || 0)}</p>
                </CardContent>
              </Card>
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">صافي الربح</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(summary?.netProfit || 0)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Collections Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">سجل التحصيلات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">العقار</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">المستأجر</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">المبلغ</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">تاريخ الاستحقاق</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collections.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد تحصيلات</td></tr>
                      ) : (
                        collections.slice(0, 20).map((c: any, i: number) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-3 px-2">{c.propertyTitle || "—"}</td>
                            <td className="py-3 px-2">{c.tenantName || "—"}</td>
                            <td className="py-3 px-2 font-medium">{formatCurrency(c.amount)}</td>
                            <td className="py-3 px-2">{formatDate(c.dueDate)}</td>
                            <td className="py-3 px-2">
                              <Badge variant={c.status === "paid" ? "default" : c.status === "overdue" ? "destructive" : "secondary"}>
                                {c.status === "paid" ? "محصّل" : c.status === "overdue" ? "متأخر" : "معلّق"}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-6 mt-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">توزيع العقارات حسب النوع</CardTitle>
                </CardHeader>
                <CardContent>
                  {propertyTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={propertyTypeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#D4A853" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">لا توجد بيانات</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">حالة العقارات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: "مؤجرة", count: occupiedProperties, color: "bg-green-500", pct: totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0 },
                      { label: "شاغرة", count: vacantProperties, color: "bg-orange-500", pct: totalProperties > 0 ? (vacantProperties / totalProperties) * 100 : 0 },
                      { label: "تحت الصيانة", count: properties.filter((p: any) => p.status === "maintenance").length, color: "bg-blue-500", pct: totalProperties > 0 ? (properties.filter((p: any) => p.status === "maintenance").length / totalProperties) * 100 : 0 },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">{item.label}</span>
                          <span className="text-sm font-bold">{item.count} ({item.pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div className={`${item.color} h-full rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Property List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">قائمة العقارات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">العقار</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">النوع</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">الحي</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">السعر</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {properties.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد عقارات</td></tr>
                      ) : (
                        properties.map((p: any) => (
                          <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-3 px-2 font-medium">{p.title}</td>
                            <td className="py-3 px-2">
                              {p.type === "apartment" ? "شقة" : p.type === "villa" ? "فيلا" : p.type === "shop" ? "محل" : p.type === "warehouse" ? "مستودع" : p.type === "land" ? "أرض" : p.type}
                            </td>
                            <td className="py-3 px-2">{p.district || "—"}</td>
                            <td className="py-3 px-2 font-medium">{formatCurrency(p.price)}</td>
                            <td className="py-3 px-2">
                              <Badge variant={p.status === "rented" ? "default" : p.status === "available" ? "secondary" : "outline"}>
                                {p.status === "rented" ? "مؤجر" : p.status === "available" ? "متاح" : p.status === "maintenance" ? "صيانة" : p.status}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-6 mt-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">حالة طلبات الصيانة</CardTitle>
                </CardHeader>
                <CardContent>
                  {maintenanceStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <RePieChart>
                        <Pie data={maintenanceStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                          {maintenanceStatusData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">لا توجد طلبات صيانة</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">ملخص الصيانة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">طلبات معلّقة</span>
                    </div>
                    <span className="font-bold text-yellow-600">{maintenancePending}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">جارية</span>
                    </div>
                    <span className="font-bold text-blue-600">{maintenanceInProgress}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">مكتملة</span>
                    </div>
                    <span className="font-bold text-green-600">{maintenanceCompleted}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">إجمالي التكاليف</span>
                    <span className="font-bold">{formatCurrency(maintenanceCost)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Maintenance List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">سجل الصيانة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">العقار</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">الوصف</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">الأولوية</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">التكلفة</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {maintenanceList.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد طلبات صيانة</td></tr>
                      ) : (
                        maintenanceList.map((m: any) => (
                          <tr key={m.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-3 px-2">{m.propertyTitle || "—"}</td>
                            <td className="py-3 px-2 max-w-[200px] truncate">{m.description}</td>
                            <td className="py-3 px-2">
                              <Badge variant={m.priority === "urgent" ? "destructive" : m.priority === "high" ? "default" : "secondary"}>
                                {m.priority === "urgent" ? "عاجل" : m.priority === "high" ? "مرتفع" : m.priority === "medium" ? "متوسط" : "منخفض"}
                              </Badge>
                            </td>
                            <td className="py-3 px-2">{m.actualCost ? formatCurrency(m.actualCost) : "—"}</td>
                            <td className="py-3 px-2">
                              <Badge variant={m.status === "completed" ? "default" : m.status === "in_progress" ? "secondary" : "outline"}>
                                {m.status === "completed" ? "مكتمل" : m.status === "in_progress" ? "جاري" : "معلّق"}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overdue Tab */}
          <TabsContent value="overdue" className="space-y-6 mt-4">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  الدفعات المتأخرة ({overdue.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">المستأجر</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">العقار</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">المبلغ</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">تاريخ الاستحقاق</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">أيام التأخير</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overdue.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد متأخرات — ممتاز!</td></tr>
                      ) : (
                        overdue.map((o: any, i: number) => {
                          const daysLate = Math.floor((Date.now() - new Date(o.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                          return (
                            <tr key={i} className="border-b last:border-0 hover:bg-red-50/50">
                              <td className="py-3 px-2 font-medium">{o.tenantName || "—"}</td>
                              <td className="py-3 px-2">{o.propertyTitle || "—"}</td>
                              <td className="py-3 px-2 font-bold text-red-600">{formatCurrency(o.amount)}</td>
                              <td className="py-3 px-2">{formatDate(o.dueDate)}</td>
                              <td className="py-3 px-2">
                                <Badge variant="destructive">{daysLate} يوم</Badge>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {overdue.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg flex items-center justify-between">
                    <span className="text-sm font-medium text-red-600">إجمالي المتأخرات</span>
                    <span className="text-lg font-bold text-red-600">{formatCurrency(totalOverdue)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
