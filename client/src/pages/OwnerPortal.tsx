import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2, FileText, CreditCard, TrendingUp, LogOut,
  Home, BarChart3, DollarSign, AlertCircle, CheckCircle,
  ChevronRight, Calendar, Menu, X
} from "lucide-react";

const NAV_ITEMS = [
  { id: "overview", label: "نظرة عامة", icon: BarChart3 },
  { id: "properties", label: "عقاراتي", icon: Building2 },
  { id: "contracts", label: "العقود", icon: FileText },
  { id: "payments", label: "الدفعات", icon: CreditCard },
  { id: "statements", label: "كشف الحساب", icon: TrendingUp },
];

export default function OwnerPortal() {
  const [, navigate] = useLocation();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const profileQuery = trpc.owners.myProfile.useQuery(undefined, { enabled: isAuthenticated && user?.role === "owner" });
  const propertiesQuery = trpc.properties.list.useQuery({ ownerId: profileQuery.data?.id } as any, { enabled: !!profileQuery.data?.id });
  const contractsQuery = trpc.contracts.list.useQuery({ ownerId: profileQuery.data?.id } as any, { enabled: !!profileQuery.data?.id });
  const paymentsQuery = trpc.payments.list.useQuery({ ownerId: profileQuery.data?.id } as any, { enabled: !!profileQuery.data?.id });
  const myFinancialsQuery = trpc.financial.myFinancials.useQuery(undefined, { enabled: isAuthenticated && user?.role === "owner" });

  const owner = profileQuery.data;
  const properties = propertiesQuery.data || [];
  const contracts = contractsQuery.data || [];
  const payments = paymentsQuery.data || [];
  const summary = myFinancialsQuery.data?.summary;

  const paidPayments = payments.filter(p => p.status === "paid");
  const pendingPayments = payments.filter(p => p.status === "pending" || p.status === "overdue");
  const totalRevenue = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600">جاري التحميل...</p>
      </div>
    </div>
  );

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
      <Card className="w-full max-w-sm shadow-xl border-0">
        <CardContent className="p-8 text-center">
          <Building2 size={48} className="mx-auto mb-4 text-amber-500" />
          <h2 className="text-xl font-bold mb-2">بوابة الملاك</h2>
          <p className="text-slate-500 mb-2 text-sm">شركة تكامل لإدارة الأملاك</p>
          <p className="text-slate-400 mb-6 text-xs">يرجى تسجيل الدخول للوصول إلى حسابك</p>
          <Button className="w-full bg-amber-500 hover:bg-amber-600" onClick={() => window.location.href = getLoginUrl()}>
            تسجيل الدخول
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  if (user?.role !== "owner" && user?.role !== "admin") return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
      <Card className="w-full max-w-sm shadow-xl border-0">
        <CardContent className="p-8 text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2">غير مصرح</h2>
          <p className="text-slate-500 mb-6 text-sm">هذه البوابة مخصصة للملاك فقط</p>
          <Button variant="outline" onClick={() => navigate("/")}>العودة للرئيسية</Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-16"} bg-white border-l border-slate-200 flex flex-col transition-all duration-300 fixed h-full z-40 shadow-sm`}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <h1 className="font-bold text-amber-600 text-sm">تكامل</h1>
              <p className="text-slate-400 text-xs">بوابة الملاك</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-slate-600 p-1">
            <Menu size={18} />
          </button>
        </div>
        {sidebarOpen && owner && (
          <div className="p-4 border-b border-slate-100 bg-amber-50">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-sm mb-2">
              {owner.name.charAt(0)}
            </div>
            <p className="font-semibold text-slate-800 text-sm">{owner.name}</p>
            <p className="text-xs text-slate-500">{owner.phone}</p>
          </div>
        )}
        <nav className="flex-1 p-2">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-colors ${activeTab === item.id ? "bg-amber-50 text-amber-700 font-medium" : "text-slate-600 hover:bg-slate-50"}`}>
              <item.icon size={18} className="shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <button onClick={logout} className="w-full flex items-center gap-2 text-slate-400 hover:text-red-400 text-xs px-2 py-1.5 rounded">
            <LogOut size={14} />
            {sidebarOpen && "تسجيل الخروج"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={`flex-1 ${sidebarOpen ? "mr-64" : "mr-16"} transition-all duration-300`}>
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <h2 className="font-semibold text-slate-800 text-sm">{NAV_ITEMS.find(n => n.id === activeTab)?.label}</h2>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => navigate("/")}>
            <Home size={14} className="ml-1" /> الرئيسية
          </Button>
        </header>

        <div className="p-6">
          {/* ── Overview ── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "إجمالي العقارات", value: properties.length, icon: Building2, color: "text-amber-600 bg-amber-50" },
                  { label: "العقود النشطة", value: contracts.filter(c => c.status === "active").length, icon: FileText, color: "text-green-600 bg-green-50" },
                  { label: "الإيرادات المحصّلة", value: `${totalRevenue.toLocaleString("ar-SA")} ﷼`, icon: DollarSign, color: "text-blue-600 bg-blue-50" },
                  { label: "دفعات معلقة", value: pendingPayments.length, icon: AlertCircle, color: "text-red-600 bg-red-50" },
                ].map((s, i) => (
                  <Card key={i} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                        <s.icon size={20} />
                      </div>
                      <p className="text-xl font-bold text-slate-800">{s.value}</p>
                      <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Financial summary */}
              {summary && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">الملخص المالي</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "إجمالي الإيرادات", value: summary.totalRevenue, color: "text-green-600" },
                        { label: "رسوم الإدارة", value: 0, color: "text-orange-600" },
                        { label: "المصاريف", value: summary.totalExpenses, color: "text-red-600" },
                        { label: "صافي الدخل", value: summary.netProfit, color: "text-blue-600" },
                      ].map((f, i) => (
                        <div key={i} className="text-center p-4 bg-slate-50 rounded-xl">
                          <p className={`text-xl font-bold ${f.color}`}>{Number(f.value).toLocaleString("ar-SA")} ﷼</p>
                          <p className="text-xs text-slate-500 mt-1">{f.label}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent payments */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">آخر الدفعات</CardTitle>
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => setActiveTab("payments")}>
                    عرض الكل <ChevronRight size={14} className="mr-1" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {payments.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{p.notes || `دفعة #${p.id}`}</p>
                        <p className="text-xs text-slate-500">{new Date(p.dueDate).toLocaleDateString("ar-SA")}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-amber-600">{Number(p.amount).toLocaleString("ar-SA")} ﷼</span>
                        <Badge className={p.status === "paid" ? "bg-green-100 text-green-700" : p.status === "overdue" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}>
                          {p.status === "paid" ? "مدفوع" : p.status === "overdue" ? "متأخر" : "معلق"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {payments.length === 0 && <p className="text-center text-slate-400 text-sm py-4">لا توجد دفعات بعد</p>}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Properties ── */}
          {activeTab === "properties" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map(prop => (
                <Card key={prop.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-800 text-sm">{prop.titleAr}</h3>
                        <p className="text-xs text-slate-500">{prop.city}{prop.district ? ` • ${prop.district}` : ""}</p>
                      </div>
                      <Badge className={prop.status === "available" ? "bg-green-100 text-green-700" : prop.status === "rented" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}>
                        {prop.status === "available" ? "متاح" : prop.status === "rented" ? "مؤجر" : prop.status === "sold" ? "مباع" : prop.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-3">
                      {prop.area && <span>📐 {prop.area} م²</span>}
                      {prop.bedrooms && <span>🛏 {prop.bedrooms} غرف</span>}
                    </div>
                    <p className="font-bold text-amber-600">{Number(prop.price).toLocaleString("ar-SA")} ﷼</p>
                  </CardContent>
                </Card>
              ))}
              {properties.length === 0 && (
                <div className="col-span-3 text-center py-12 text-slate-400">
                  <Building2 size={40} className="mx-auto mb-3 opacity-30" />
                  <p>لا توجد عقارات مسجلة</p>
                </div>
              )}
            </div>
          )}

          {/* ── Contracts ── */}
          {activeTab === "contracts" && (
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>{["رقم العقد", "النوع", "المبلغ", "تاريخ البداية", "تاريخ النهاية", "الحالة"].map(h => (
                      <th key={h} className="text-right p-3 font-medium text-slate-600 text-xs">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {contracts.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono text-xs">{c.contractNumber}</td>
                        <td className="p-3 text-xs">{c.type === "rent" ? "إيجار" : c.type === "sale" ? "بيع" : "إدارة"}</td>
                        <td className="p-3 text-amber-600 font-medium text-xs">{c.rentAmount ? `${Number(c.rentAmount).toLocaleString("ar-SA")} ﷼` : c.salePrice ? `${Number(c.salePrice).toLocaleString("ar-SA")} ﷼` : "—"}</td>
                        <td className="p-3 text-slate-500 text-xs">{c.startDate ? new Date(c.startDate).toLocaleDateString("ar-SA") : "—"}</td>
                        <td className="p-3 text-slate-500 text-xs">{c.endDate ? new Date(c.endDate).toLocaleDateString("ar-SA") : "—"}</td>
                        <td className="p-3"><Badge className={c.status === "active" ? "bg-green-100 text-green-700" : c.status === "expired" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}>{c.status === "active" ? "نشط" : c.status === "expired" ? "منتهي" : c.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {contracts.length === 0 && <p className="text-center text-slate-400 py-8">لا توجد عقود بعد</p>}
              </div>
            </Card>
          )}

          {/* ── Payments ── */}
          {activeTab === "payments" && (
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>{["النوع", "المبلغ", "تاريخ الاستحقاق", "تاريخ الدفع", "الحالة"].map(h => (
                      <th key={h} className="text-right p-3 font-medium text-slate-600 text-xs">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-3 text-xs">{p.type === "rent" ? "إيجار" : p.type === "deposit" ? "وديعة" : p.type === "management_fee" ? "رسوم إدارة" : p.type}</td>
                        <td className="p-3 font-medium text-amber-600">{Number(p.amount).toLocaleString("ar-SA")} ﷼</td>
                        <td className="p-3 text-slate-500 text-xs">{new Date(p.dueDate).toLocaleDateString("ar-SA")}</td>
                        <td className="p-3 text-slate-500 text-xs">{p.paidDate ? new Date(p.paidDate).toLocaleDateString("ar-SA") : "—"}</td>
                        <td className="p-3"><Badge className={p.status === "paid" ? "bg-green-100 text-green-700" : p.status === "overdue" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}>
                          {p.status === "paid" ? "مدفوع" : p.status === "overdue" ? "متأخر" : "معلق"}
                        </Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {payments.length === 0 && <p className="text-center text-slate-400 py-8">لا توجد دفعات بعد</p>}
              </div>
            </Card>
          )}

          {/* ── Statements ── */}
          {activeTab === "statements" && (
            <div className="space-y-4">
              {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "إجمالي الإيرادات", value: summary.totalRevenue, color: "text-green-600 bg-green-50" },
                    { label: "رسوم الإدارة", value: 0, color: "text-orange-600 bg-orange-50" },
                    { label: "المصاريف", value: summary.totalExpenses, color: "text-red-600 bg-red-50" },
                    { label: "صافي الدخل", value: summary.netProfit, color: "text-blue-600 bg-blue-50" },
                  ].map((f, i) => (
                    <Card key={i} className="border-0 shadow-sm">
                      <CardContent className={`p-4 ${f.color.split(" ")[1]} rounded-xl`}>
                        <p className={`text-2xl font-bold ${f.color.split(" ")[0]}`}>{Number(f.value).toLocaleString("ar-SA")} ﷼</p>
                        <p className="text-xs text-slate-600 mt-1">{f.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">سجل المعاملات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {payments.filter(p => p.status === "paid").map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle size={16} className="text-green-500" />
                          <div>
                            <p className="text-sm font-medium">{p.notes || `دفعة #${p.id}`}</p>
                            <p className="text-xs text-slate-500">{p.paidDate ? new Date(p.paidDate).toLocaleDateString("ar-SA") : ""}</p>
                          </div>
                        </div>
                        <span className="font-bold text-green-600">+{Number(p.amount).toLocaleString("ar-SA")} ﷼</span>
                      </div>
                    ))}
                    {payments.filter(p => p.status === "paid").length === 0 && (
                      <p className="text-center text-slate-400 py-8">لا توجد معاملات مسجلة</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
