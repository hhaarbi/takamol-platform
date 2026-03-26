import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Building2, FileText, CreditCard, TrendingUp, LogOut,
  Home, BarChart3, DollarSign, AlertCircle, CheckCircle,
  ChevronRight, Calendar, Menu, X, Wrench, Download,
  ArrowUpRight, ArrowDownRight, Clock, Wallet, Eye
} from "lucide-react";

const NAV_ITEMS = [
  { id: "overview", label: "نظرة عامة", icon: BarChart3 },
  { id: "properties", label: "عقاراتي", icon: Building2 },
  { id: "contracts", label: "العقود", icon: FileText },
  { id: "payments", label: "الدفعات", icon: CreditCard },
  { id: "maintenance", label: "الصيانة", icon: Wrench },
  { id: "statements", label: "كشف الحساب", icon: TrendingUp },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(amount);
}
function formatDate(date: string | Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("ar-SA", { year: "numeric", month: "short", day: "numeric" }).format(new Date(date));
}

const PROPERTY_TYPES: Record<string, string> = { apartment: "شقة", villa: "فيلا", land: "أرض", commercial: "تجاري", office: "مكتب", warehouse: "مستودع", building: "عمارة", farm: "مزرعة" };
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  paid: { label: "مدفوع", color: "bg-green-100 text-green-700" },
  pending: { label: "معلق", color: "bg-yellow-100 text-yellow-700" },
  overdue: { label: "متأخر", color: "bg-red-100 text-red-700" },
  partial: { label: "جزئي", color: "bg-orange-100 text-orange-700" },
};

export default function OwnerPortal() {
  const [, navigate] = useLocation();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const profileQuery = trpc.owners.myProfile.useQuery(undefined, { enabled: isAuthenticated && user?.role === "owner" || user?.role === "super_admin" });
  const propertiesQuery = trpc.properties.list.useQuery({ ownerId: profileQuery.data?.id } as any, { enabled: !!profileQuery.data?.id });
  const contractsQuery = trpc.contracts.list.useQuery({ ownerId: profileQuery.data?.id } as any, { enabled: !!profileQuery.data?.id });
  const paymentsQuery = trpc.payments.list.useQuery({ ownerId: profileQuery.data?.id } as any, { enabled: !!profileQuery.data?.id });
  const myFinancialsQuery = trpc.financial.myFinancials.useQuery(undefined, { enabled: isAuthenticated && user?.role === "owner" || user?.role === "super_admin" });
  const maintenanceQuery = trpc.maintenance.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "owner" || user?.role === "super_admin" });

  const owner = profileQuery.data;
  const properties = propertiesQuery.data || [];
  const contracts = contractsQuery.data || [];
  const payments = paymentsQuery.data || [];
  const maintenance = (maintenanceQuery.data || []) as any[];
  const summary = myFinancialsQuery.data?.summary;

  const paidPayments = payments.filter((p: any) => p.status === "paid");
  const pendingPayments = payments.filter((p: any) => p.status === "pending" || p.status === "overdue");
  const overduePayments = payments.filter((p: any) => p.status === "overdue");
  const totalRevenue = paidPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const totalPending = pendingPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const totalOverdue = overduePayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  const occupiedProperties = properties.filter((p: any) => p.status === "rented" || p.status === "occupied").length;
  const vacantProperties = properties.filter((p: any) => p.status === "available" || p.status === "vacant").length;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600">جاري التحميل...</p>
      </div>
    </div>
  );

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-amber-50">
      <Card className="w-96 border-0 shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="text-amber-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">بوابة المالك</h2>
          <p className="text-slate-500 mb-6 text-sm">سجّل دخولك للوصول إلى تقاريرك المالية وعقاراتك</p>
          <Button className="w-full bg-amber-500 hover:bg-amber-600" onClick={() => window.location.href = getLoginUrl()}>تسجيل الدخول</Button>
        </CardContent>
      </Card>
    </div>
  );

  if (user?.role !== "owner" && user?.role !== "super_admin") return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-96 border-0 shadow-xl">
        <CardContent className="p-8 text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-slate-800 mb-2">غير مصرّح</h2>
          <p className="text-slate-500 mb-6 text-sm">هذه البوابة مخصصة لملاك العقارات فقط</p>
          <Button variant="outline" onClick={() => navigate("/")}>العودة للرئيسية</Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-40 w-64 bg-white border-l border-slate-200 shadow-lg transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "translate-x-full"} lg:translate-x-0 lg:static`}>
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center text-white font-bold">
              {owner?.name?.charAt(0) || "م"}
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">{owner?.name || "المالك"}</p>
              <p className="text-xs text-slate-400">بوابة المالك</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${activeTab === item.id ? "bg-amber-50 text-amber-700 font-semibold shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}>
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <button onClick={() => { logout(); navigate("/"); }} className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all">
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 lg:mr-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-lg font-bold text-slate-800">{NAV_ITEMS.find(n => n.id === activeTab)?.label}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-100 text-amber-700 text-xs">{properties.length} عقار</Badge>
            <Badge className="bg-green-100 text-green-700 text-xs">{contracts.filter((c: any) => c.status === "active").length} عقد فعّال</Badge>
          </div>
        </header>

        <div className="p-6">
          {/* ─── OVERVIEW ─── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Wallet className="text-green-500" size={20} />
                      <ArrowUpRight className="text-green-500" size={14} />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalRevenue)}</p>
                    <p className="text-xs text-slate-500">إجمالي الإيرادات</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Clock className="text-yellow-500" size={20} />
                      <span className="text-xs text-yellow-600">{pendingPayments.length} دفعة</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalPending)}</p>
                    <p className="text-xs text-slate-500">مبالغ معلقة</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <AlertCircle className="text-red-500" size={20} />
                      <span className="text-xs text-red-600">{overduePayments.length} متأخرة</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalOverdue)}</p>
                    <p className="text-xs text-slate-500">مبالغ متأخرة</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Building2 className="text-blue-500" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{properties.length}</p>
                    <p className="text-xs text-slate-500">{occupiedProperties} مؤجر · {vacantProperties} شاغر</p>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Summary */}
              {summary && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">الملخص المالي</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-green-50 rounded-xl">
                        <p className="text-xs text-green-600 mb-1">إجمالي الإيرادات</p>
                        <p className="text-lg font-bold text-green-700">{formatCurrency(Number(summary.totalRevenue || 0))}</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded-xl">
                        <p className="text-xs text-red-600 mb-1">إجمالي المصاريف</p>
                        <p className="text-lg font-bold text-red-700">{formatCurrency(Number(summary.totalExpenses || 0))}</p>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-xl">
                        <p className="text-xs text-amber-600 mb-1">رسوم الإدارة</p>
                        <p className="text-lg font-bold text-amber-700">{formatCurrency(Number(summary.totalExpenses || 0))}</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-xl">
                        <p className="text-xs text-blue-600 mb-1">صافي الربح</p>
                        <p className="text-lg font-bold text-blue-700">{formatCurrency(Number(summary.netProfit || 0))}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Payments */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">آخر الدفعات</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {payments.slice(0, 8).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{p.contractNumber || `عقد #${p.contractId}`}</p>
                          <p className="text-xs text-slate-400">{formatDate(p.dueDate)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={STATUS_MAP[p.status]?.color || "bg-gray-100 text-gray-700"}>{STATUS_MAP[p.status]?.label || p.status}</Badge>
                          <span className="text-sm font-bold text-slate-800">{formatCurrency(Number(p.amount))}</span>
                        </div>
                      </div>
                    ))}
                    {payments.length === 0 && <p className="text-center text-sm text-slate-400 py-8">لا توجد دفعات حالياً</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── PROPERTIES ─── */}
          {activeTab === "properties" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-green-100 text-green-700">{occupiedProperties} مؤجر</Badge>
                <Badge className="bg-yellow-100 text-yellow-700">{vacantProperties} شاغر</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {properties.map((p: any) => (
                  <Card key={p.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-slate-800">{p.titleAr}</h3>
                          <p className="text-xs text-slate-400">{PROPERTY_TYPES[p.type] || p.type} · {p.district || "المدينة المنورة"}</p>
                        </div>
                        <Badge className={p.status === "rented" || p.status === "occupied" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                          {p.status === "rented" || p.status === "occupied" ? "مؤجر" : "شاغر"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-400">السعر</p>
                          <p className="text-sm font-bold text-slate-700">{formatCurrency(Number(p.price || 0))}</p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-400">المساحة</p>
                          <p className="text-sm font-bold text-slate-700">{p.area || "—"} م²</p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-400">الغرف</p>
                          <p className="text-sm font-bold text-slate-700">{p.bedrooms || "—"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {properties.length === 0 && (
                <Card className="border-0 shadow-sm"><CardContent className="p-12 text-center"><Building2 className="text-slate-300 mx-auto mb-3" size={48} /><p className="text-slate-400">لا توجد عقارات مسجلة</p></CardContent></Card>
              )}
            </div>
          )}

          {/* ─── CONTRACTS ─── */}
          {activeTab === "contracts" && (
            <div className="space-y-4">
              {contracts.map((c: any) => (
                <Card key={c.id} className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-800">عقد #{c.contractNumber || c.id}</h3>
                        <p className="text-xs text-slate-400">{c.type === "rent" ? "إيجار" : c.type === "sale" ? "بيع" : "إدارة"}</p>
                      </div>
                      <Badge className={c.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                        {c.status === "active" ? "فعّال" : c.status === "expired" ? "منتهي" : c.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-slate-400">مبلغ الإيجار</p>
                        <p className="text-sm font-bold text-slate-700">{formatCurrency(Number(c.rentAmount || 0))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">تاريخ البداية</p>
                        <p className="text-sm text-slate-700">{formatDate(c.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">تاريخ النهاية</p>
                        <p className="text-sm text-slate-700">{formatDate(c.endDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">دورة الدفع</p>
                        <p className="text-sm text-slate-700">{c.paymentFrequency === "monthly" ? "شهري" : c.paymentFrequency === "quarterly" ? "ربع سنوي" : c.paymentFrequency === "annual" ? "سنوي" : c.paymentFrequency}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {contracts.length === 0 && (
                <Card className="border-0 shadow-sm"><CardContent className="p-12 text-center"><FileText className="text-slate-300 mx-auto mb-3" size={48} /><p className="text-slate-400">لا توجد عقود</p></CardContent></Card>
              )}
            </div>
          )}

          {/* ─── PAYMENTS ─── */}
          {activeTab === "payments" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-xs text-green-600">مدفوع</p><p className="text-xl font-bold text-green-700">{formatCurrency(totalRevenue)}</p></CardContent></Card>
                <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-xs text-yellow-600">معلق</p><p className="text-xl font-bold text-yellow-700">{formatCurrency(totalPending)}</p></CardContent></Card>
                <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-xs text-red-600">متأخر</p><p className="text-xl font-bold text-red-700">{formatCurrency(totalOverdue)}</p></CardContent></Card>
              </div>
              <div className="space-y-2">
                {payments.map((p: any) => (
                  <Card key={p.id} className="border-0 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{p.type === "rent" ? "إيجار" : p.type === "deposit" ? "وديعة" : p.type}</p>
                        <p className="text-xs text-slate-400">استحقاق: {formatDate(p.dueDate)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={STATUS_MAP[p.status]?.color || "bg-gray-100 text-gray-700"}>{STATUS_MAP[p.status]?.label || p.status}</Badge>
                        <span className="text-sm font-bold text-slate-800">{formatCurrency(Number(p.amount))}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {payments.length === 0 && (
                <Card className="border-0 shadow-sm"><CardContent className="p-12 text-center"><CreditCard className="text-slate-300 mx-auto mb-3" size={48} /><p className="text-slate-400">لا توجد دفعات</p></CardContent></Card>
              )}
            </div>
          )}

          {/* ─── MAINTENANCE ─── */}
          {activeTab === "maintenance" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-yellow-100 text-yellow-700">{maintenance.filter((m: any) => m.status === "open").length} مفتوح</Badge>
                <Badge className="bg-blue-100 text-blue-700">{maintenance.filter((m: any) => m.status === "in_progress").length} جاري</Badge>
                <Badge className="bg-green-100 text-green-700">{maintenance.filter((m: any) => m.status === "completed").length} مكتمل</Badge>
              </div>
              {maintenance.map((m: any) => (
                <Card key={m.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-slate-800 text-sm">{m.title}</h3>
                      <Badge className={m.status === "completed" ? "bg-green-100 text-green-700" : m.status === "in_progress" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}>
                        {m.status === "completed" ? "مكتمل" : m.status === "in_progress" ? "جاري" : "مفتوح"}
                      </Badge>
                    </div>
                    {m.description && <p className="text-xs text-slate-500 mb-2">{m.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>تاريخ الطلب: {formatDate(m.createdAt)}</span>
                      {m.cost && <span>التكلفة: {formatCurrency(Number(m.cost))}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {maintenance.length === 0 && (
                <Card className="border-0 shadow-sm"><CardContent className="p-12 text-center"><Wrench className="text-slate-300 mx-auto mb-3" size={48} /><p className="text-slate-400">لا توجد طلبات صيانة</p></CardContent></Card>
              )}
            </div>
          )}

          {/* ─── STATEMENTS ─── */}
          {activeTab === "statements" && (
            <div className="space-y-4">
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-sm text-slate-600">كشف الحساب الشامل</CardTitle></CardHeader>
                <CardContent>
                  {summary ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-green-50 rounded-xl text-center">
                          <p className="text-xs text-green-600 mb-1">إجمالي الإيرادات</p>
                          <p className="text-xl font-bold text-green-700">{formatCurrency(Number(summary.totalRevenue || 0))}</p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-xl text-center">
                          <p className="text-xs text-red-600 mb-1">إجمالي المصاريف</p>
                          <p className="text-xl font-bold text-red-700">{formatCurrency(Number(summary.totalExpenses || 0))}</p>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-xl text-center">
                          <p className="text-xs text-amber-600 mb-1">رسوم الإدارة</p>
                          <p className="text-xl font-bold text-amber-700">{formatCurrency(Number(summary.totalExpenses || 0))}</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-xl text-center">
                          <p className="text-xs text-blue-600 mb-1">صافي الربح</p>
                          <p className="text-xl font-bold text-blue-700">{formatCurrency(Number(summary.netProfit || 0))}</p>
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold text-slate-700 mb-3">تفاصيل الدفعات</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-200">
                                <th className="text-right py-2 px-3 text-slate-500 font-medium">التاريخ</th>
                                <th className="text-right py-2 px-3 text-slate-500 font-medium">النوع</th>
                                <th className="text-right py-2 px-3 text-slate-500 font-medium">الحالة</th>
                                <th className="text-right py-2 px-3 text-slate-500 font-medium">المبلغ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {payments.map((p: any) => (
                                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                                  <td className="py-2 px-3 text-slate-600">{formatDate(p.dueDate)}</td>
                                  <td className="py-2 px-3 text-slate-600">{p.type === "rent" ? "إيجار" : p.type}</td>
                                  <td className="py-2 px-3"><Badge className={`text-xs ${STATUS_MAP[p.status]?.color || "bg-gray-100"}`}>{STATUS_MAP[p.status]?.label || p.status}</Badge></td>
                                  <td className="py-2 px-3 font-bold text-slate-800">{formatCurrency(Number(p.amount))}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-sm text-slate-400 py-8">لا تتوفر بيانات مالية حالياً</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
