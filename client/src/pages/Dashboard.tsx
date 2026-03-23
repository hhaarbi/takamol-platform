import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard, Users, Building2, FileText, CreditCard, Wrench,
  TrendingUp, LogOut, Search, Plus, Download, Bell, ChevronRight,
  MessageSquare, UserCheck, Briefcase, Home, RefreshCw, CheckCircle,
  AlertCircle, Clock, X, Menu, DollarSign, BarChart3
} from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  new: "جديد", contacted: "تم التواصل", qualified: "مؤهل", closed: "مغلق", lost: "خسارة",
};
const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700", contacted: "bg-yellow-100 text-yellow-700",
  qualified: "bg-green-100 text-green-700", closed: "bg-gray-100 text-gray-700",
  lost: "bg-red-100 text-red-700",
};
const SERVICE_LABELS: Record<string, string> = {
  buy: "شراء", sell: "بيع", rent_looking: "إيجار (باحث)", rent_listing: "إيجار (معروض)",
  property_management: "إدارة أملاك", unknown: "غير محدد",
};
const PROPERTY_TYPES: Record<string, string> = {
  apartment: "شقة", villa: "فيلا", land: "أرض", commercial: "تجاري",
  office: "مكتب", warehouse: "مستودع", building: "مبنى", farm: "مزرعة",
};

const NAV_ITEMS = [
  { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { id: "leads", label: "العملاء المحتملون", icon: Users },
  { id: "properties", label: "العقارات", icon: Building2 },
  { id: "owners", label: "الملاك", icon: UserCheck },
  { id: "brokers", label: "الوسطاء", icon: Briefcase },
  { id: "tenants", label: "المستأجرون", icon: Users },
  { id: "contracts", label: "العقود", icon: FileText },
  { id: "payments", label: "التحصيل", icon: CreditCard },
  { id: "expenses", label: "المصاريف", icon: TrendingUp },
  { id: "maintenance", label: "الصيانة", icon: Wrench },
  { id: "chats", label: "المحادثات", icon: MessageSquare },
];

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLeadSession, setSelectedLeadSession] = useState<string | null>(null);

  // Queries
  const statsQuery = trpc.financial.dashboardStats.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const financialQuery = trpc.financial.summary.useQuery(undefined as any, { enabled: isAuthenticated && user?.role === "admin" });
  const leadsQuery = trpc.leads.list.useQuery({ limit: 200 }, { enabled: isAuthenticated && user?.role === "admin" });
  const propertiesQuery = trpc.properties.list.useQuery({ limit: 100 }, { enabled: isAuthenticated && user?.role === "admin" });
  const ownersQuery = trpc.owners.list.useQuery({}, { enabled: isAuthenticated && user?.role === "admin" });
  const brokersQuery = trpc.brokers.list.useQuery({}, { enabled: isAuthenticated && user?.role === "admin" });
  const tenantsQuery = trpc.tenants.list.useQuery({}, { enabled: isAuthenticated && user?.role === "admin" });
  const contractsQuery = trpc.contracts.list.useQuery({}, { enabled: isAuthenticated && user?.role === "admin" });
  const paymentsQuery = trpc.payments.list.useQuery({}, { enabled: isAuthenticated && user?.role === "admin" });
  const overdueQuery = trpc.payments.overdue.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const expensesQuery = trpc.expenses.list.useQuery({}, { enabled: isAuthenticated && user?.role === "admin" });
  const maintenanceQuery = trpc.maintenance.list.useQuery({}, { enabled: isAuthenticated && user?.role === "admin" });
  const chatHistoryQuery = trpc.chat.getHistory.useQuery(selectedLeadSession!, { enabled: !!selectedLeadSession });

  // Mutations
  const updateLeadMutation = trpc.leads.update.useMutation({ onSuccess: () => { leadsQuery.refetch(); toast.success("تم التحديث"); } });
  const createPropertyMutation = trpc.properties.create.useMutation({ onSuccess: () => { propertiesQuery.refetch(); toast.success("تم إضافة العقار"); setPropertyForm(defaultPropertyForm); } });
  const deletePropertyMutation = trpc.properties.delete.useMutation({ onSuccess: () => { propertiesQuery.refetch(); toast.success("تم الحذف"); } });
  const createOwnerMutation = trpc.owners.create.useMutation({ onSuccess: () => { ownersQuery.refetch(); toast.success("تم إضافة المالك"); setOwnerForm(defaultOwnerForm); } });
  const createTenantMutation = trpc.tenants.create.useMutation({ onSuccess: () => { tenantsQuery.refetch(); toast.success("تم إضافة المستأجر"); } });
  const markPaidMutation = trpc.payments.markPaid.useMutation({ onSuccess: () => { paymentsQuery.refetch(); overdueQuery.refetch(); toast.success("تم تسجيل الدفع"); } });
  const createPaymentMutation = trpc.payments.create.useMutation({ onSuccess: () => { paymentsQuery.refetch(); toast.success("تم إضافة الدفعة"); } });

  const defaultPropertyForm = { titleAr: "", type: "apartment" as const, listingType: "rent" as const, price: "", area: "", bedrooms: "", bathrooms: "", district: "", descriptionAr: "", featuresAr: "" };
  const defaultOwnerForm = { name: "", phone: "", email: "", nationalId: "", managementFeeType: "percentage" as const, managementFeeValue: "5.00", notes: "" };
  const [propertyForm, setPropertyForm] = useState(defaultPropertyForm);
  const [ownerForm, setOwnerForm] = useState(defaultOwnerForm);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAddOwner, setShowAddOwner] = useState(false);

  const leads = leadsQuery.data || [];
  const properties = propertiesQuery.data || [];
  const owners = ownersQuery.data || [];
  const brokers = brokersQuery.data || [];
  const tenants = tenantsQuery.data || [];
  const contracts = contractsQuery.data || [];
  const payments = paymentsQuery.data || [];
  const overdue = overdueQuery.data || [];
  const expenses = expensesQuery.data || [];
  const maintenance = maintenanceQuery.data || [];
  const stats = statsQuery.data;
  const financial = financialQuery.data;

  const filteredLeads = leads.filter(l =>
    !search || l.name?.includes(search) || l.phone?.includes(search)
  );

  const exportLeads = () => {
    const csv = [
      ["الاسم", "الجوال", "الخدمة", "الميزانية", "الحالة", "المصدر", "التاريخ"].join(","),
      ...leads.map(l => [l.name || "", l.phone || "", SERVICE_LABELS[l.serviceType || "unknown"], l.budget || "", STATUS_LABELS[l.status || "new"], l.source || "", new Date(l.createdAt).toLocaleDateString("ar-SA")].join(","))
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "leads.csv"; a.click();
  };

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
      <Card className="w-full max-w-sm shadow-xl">
        <CardContent className="p-8 text-center">
          <Building2 size={48} className="mx-auto mb-4 text-amber-500" />
          <h2 className="text-xl font-bold mb-2">لوحة تحكم تكامل</h2>
          <p className="text-slate-500 mb-6 text-sm">يرجى تسجيل الدخول للوصول</p>
          <Button className="w-full bg-amber-500 hover:bg-amber-600" onClick={() => window.location.href = getLoginUrl()}>
            تسجيل الدخول
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  if (user?.role !== "admin") return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
      <Card className="w-full max-w-sm shadow-xl">
        <CardContent className="p-8 text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2">غير مصرح</h2>
          <p className="text-slate-500 mb-6 text-sm">هذه الصفحة للمدير فقط</p>
          <Button variant="outline" onClick={() => navigate("/")}>العودة للرئيسية</Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-16"} bg-slate-900 text-white flex flex-col transition-all duration-300 fixed h-full z-40`}>
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <h1 className="font-bold text-amber-400 text-sm">تكامل</h1>
              <p className="text-slate-400 text-xs">لوحة الإدارة</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white p-1">
            <Menu size={18} />
          </button>
        </div>
        <nav className="flex-1 p-2 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-colors ${activeTab === item.id ? "bg-amber-500 text-white" : "text-slate-300 hover:bg-slate-800"}`}
            >
              <item.icon size={18} className="shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          {sidebarOpen && <p className="text-xs text-slate-400 mb-2 truncate">{user?.name}</p>}
          <button onClick={logout} className="w-full flex items-center gap-2 text-slate-400 hover:text-red-400 text-xs px-2 py-1.5 rounded">
            <LogOut size={14} />
            {sidebarOpen && "خروج"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 ${sidebarOpen ? "mr-64" : "mr-16"} transition-all duration-300`}>
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-slate-800 text-sm">
              {NAV_ITEMS.find(n => n.id === activeTab)?.label}
            </h2>
            {overdue.length > 0 && (
              <Badge variant="destructive" className="text-xs">{overdue.length} متأخر</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="h-8 text-xs pr-8 w-48" />
            </div>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => navigate("/")}>
              <Home size={14} className="ml-1" /> الموقع
            </Button>
          </div>
        </header>

        <div className="p-6">
          {/* ── Overview ── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: "الملاك", value: stats?.owners ?? 0, icon: UserCheck, color: "text-blue-600 bg-blue-50" },
                  { label: "العقارات", value: stats?.properties ?? 0, icon: Building2, color: "text-amber-600 bg-amber-50" },
                  { label: "المستأجرون", value: stats?.tenants ?? 0, icon: Users, color: "text-green-600 bg-green-50" },
                  { label: "العقود النشطة", value: stats?.activeContracts ?? 0, icon: FileText, color: "text-purple-600 bg-purple-50" },
                  { label: "العملاء المحتملون", value: stats?.leads ?? 0, icon: Users, color: "text-orange-600 bg-orange-50" },
                  { label: "الوسطاء", value: stats?.brokers ?? 0, icon: Briefcase, color: "text-teal-600 bg-teal-50" },
                ].map((s, i) => (
                  <Card key={i} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                        <s.icon size={20} />
                      </div>
                      <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                      <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Financial summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "إجمالي الإيرادات", value: financial?.totalRevenue ?? 0, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
                  { label: "إجمالي المصاريف", value: financial?.totalExpenses ?? 0, icon: DollarSign, color: "text-red-600", bg: "bg-red-50" },
                  { label: "صافي الربح", value: financial?.netProfit ?? 0, icon: BarChart3, color: "text-blue-600", bg: "bg-blue-50" },
                ].map((f, i) => (
                  <Card key={i} className="border-0 shadow-sm">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${f.bg}`}>
                        <f.icon size={22} className={f.color} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">{f.label}</p>
                        <p className={`text-xl font-bold ${f.color}`}>{Number(f.value).toLocaleString("ar-SA")} ﷼</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Overdue payments alert */}
              {overdue.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-700 flex items-center gap-2">
                      <AlertCircle size={16} /> دفعات متأخرة ({overdue.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {overdue.slice(0, 5).map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-white rounded-lg p-3 text-sm">
                          <span className="text-slate-700">{p.notes || `دفعة #${p.id}`}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-red-600 font-medium">{Number(p.amount).toLocaleString("ar-SA")} ﷼</span>
                            <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700"
                              onClick={() => markPaidMutation.mutate({ id: p.id, paymentMethod: "bank_transfer" })}>
                              <CheckCircle size={12} className="ml-1" /> تسجيل دفع
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent leads */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">آخر العملاء المحتملين</CardTitle>
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => setActiveTab("leads")}>
                    عرض الكل <ChevronRight size={14} className="mr-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {leads.slice(0, 5).map(lead => (
                      <div key={lead.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm text-slate-800">{lead.name || "غير محدد"}</p>
                          <p className="text-xs text-slate-500">{lead.phone || ""} • {SERVICE_LABELS[lead.serviceType || "unknown"]}</p>
                        </div>
                        <Badge className={`text-xs ${STATUS_COLORS[lead.status || "new"]}`}>
                          {STATUS_LABELS[lead.status || "new"]}
                        </Badge>
                      </div>
                    ))}
                    {leads.length === 0 && <p className="text-center text-slate-400 text-sm py-4">لا يوجد عملاء بعد</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Leads ── */}
          {activeTab === "leads" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{leads.length} عميل محتمل</p>
                <Button size="sm" variant="outline" className="text-xs" onClick={exportLeads}>
                  <Download size={14} className="ml-1" /> تصدير CSV
                </Button>
              </div>
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        {["الاسم", "الجوال", "الخدمة", "الميزانية", "المصدر", "الحالة", "التاريخ"].map(h => (
                          <th key={h} className="text-right p-3 font-medium text-slate-600 text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLeads.map(lead => (
                        <tr key={lead.id} className="hover:bg-slate-50">
                          <td className="p-3 font-medium text-slate-800">{lead.name || "—"}</td>
                          <td className="p-3 text-slate-600 font-mono text-xs">{lead.phone || "—"}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-xs">{SERVICE_LABELS[lead.serviceType || "unknown"]}</Badge>
                          </td>
                          <td className="p-3 text-slate-500 text-xs">{lead.budget || "—"}</td>
                          <td className="p-3 text-slate-500 text-xs">{lead.source || "—"}</td>
                          <td className="p-3">
                            <Select value={lead.status || "new"} onValueChange={v => updateLeadMutation.mutate({ id: lead.id, data: { status: v } })}>
                              <SelectTrigger className={`h-7 text-xs w-28 border-0 ${STATUS_COLORS[lead.status || "new"]}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3 text-slate-400 text-xs">{new Date(lead.createdAt).toLocaleDateString("ar-SA")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredLeads.length === 0 && <p className="text-center text-slate-400 py-8">لا توجد نتائج</p>}
                </div>
              </Card>
            </div>
          )}

          {/* ── Properties ── */}
          {activeTab === "properties" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{properties.length} عقار</p>
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-xs" onClick={() => setShowAddProperty(!showAddProperty)}>
                  <Plus size={14} className="ml-1" /> إضافة عقار
                </Button>
              </div>

              {showAddProperty && (
                <Card className="border-amber-200 border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      إضافة عقار جديد
                      <button onClick={() => setShowAddProperty(false)}><X size={16} /></button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <Input placeholder="عنوان العقار *" value={propertyForm.titleAr} onChange={e => setPropertyForm(p => ({ ...p, titleAr: e.target.value }))} className="text-sm" />
                      <Select value={propertyForm.type} onValueChange={v => setPropertyForm(p => ({ ...p, type: v as any }))}>
                        <SelectTrigger className="text-sm"><SelectValue placeholder="نوع العقار" /></SelectTrigger>
                        <SelectContent>{Object.entries(PROPERTY_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={propertyForm.listingType} onValueChange={v => setPropertyForm(p => ({ ...p, listingType: v as any }))}>
                        <SelectTrigger className="text-sm"><SelectValue placeholder="نوع الإعلان" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sale">للبيع</SelectItem>
                          <SelectItem value="rent">للإيجار</SelectItem>
                          <SelectItem value="managed">مُدار</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="السعر (ريال) *" value={propertyForm.price} onChange={e => setPropertyForm(p => ({ ...p, price: e.target.value }))} className="text-sm" />
                      <Input placeholder="المساحة (م²)" value={propertyForm.area} onChange={e => setPropertyForm(p => ({ ...p, area: e.target.value }))} className="text-sm" />
                      <Input placeholder="الحي / الموقع" value={propertyForm.district} onChange={e => setPropertyForm(p => ({ ...p, district: e.target.value }))} className="text-sm" />
                      <Input placeholder="غرف النوم" type="number" value={propertyForm.bedrooms} onChange={e => setPropertyForm(p => ({ ...p, bedrooms: e.target.value }))} className="text-sm" />
                      <Input placeholder="دورات المياه" type="number" value={propertyForm.bathrooms} onChange={e => setPropertyForm(p => ({ ...p, bathrooms: e.target.value }))} className="text-sm" />
                    </div>
                    <textarea placeholder="وصف العقار" value={propertyForm.descriptionAr} onChange={e => setPropertyForm(p => ({ ...p, descriptionAr: e.target.value }))} className="w-full mt-3 p-2 border rounded-md text-sm resize-none h-20" />
                    <Button className="mt-3 bg-amber-500 hover:bg-amber-600 text-sm" onClick={() => {
                      if (!propertyForm.titleAr || !propertyForm.price) return toast.error("يرجى ملء الحقول المطلوبة");
                      createPropertyMutation.mutate({ ...propertyForm, bedrooms: propertyForm.bedrooms ? parseInt(propertyForm.bedrooms) : undefined, bathrooms: propertyForm.bathrooms ? parseInt(propertyForm.bathrooms) : undefined, area: propertyForm.area || undefined, district: propertyForm.district || undefined, descriptionAr: propertyForm.descriptionAr || undefined, features: [] });
                    }} disabled={createPropertyMutation.isPending}>
                      {createPropertyMutation.isPending ? "جاري الحفظ..." : "حفظ العقار"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map(prop => (
                  <Card key={prop.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-slate-800 text-sm">{prop.titleAr}</h3>
                          <p className="text-xs text-slate-500">{prop.city} {prop.district ? `• ${prop.district}` : ""}</p>
                        </div>
                        <Badge className={`text-xs ${prop.listingType === "sale" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                          {prop.listingType === "sale" ? "بيع" : prop.listingType === "rent" ? "إيجار" : "مُدار"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-3">
                        <span>🏠 {PROPERTY_TYPES[prop.type] || prop.type}</span>
                        {prop.area && <span>📐 {prop.area} م²</span>}
                        {prop.bedrooms && <span>🛏 {prop.bedrooms} غرف</span>}
                        {prop.bathrooms && <span>🚿 {prop.bathrooms} حمام</span>}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-600">{Number(prop.price).toLocaleString("ar-SA")} ﷼</span>
                        <Button size="sm" variant="outline" className="text-xs h-7 text-red-500 hover:text-red-700"
                          onClick={() => { if (confirm("حذف هذا العقار؟")) deletePropertyMutation.mutate(prop.id); }}>
                          حذف
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {properties.length === 0 && (
                  <div className="col-span-3 text-center py-12 text-slate-400">
                    <Building2 size={40} className="mx-auto mb-3 opacity-30" />
                    <p>لا توجد عقارات بعد</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Owners ── */}
          {activeTab === "owners" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{owners.length} مالك</p>
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-xs" onClick={() => setShowAddOwner(!showAddOwner)}>
                  <Plus size={14} className="ml-1" /> إضافة مالك
                </Button>
              </div>
              {showAddOwner && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      إضافة مالك جديد
                      <button onClick={() => setShowAddOwner(false)}><X size={16} /></button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <Input placeholder="الاسم *" value={ownerForm.name} onChange={e => setOwnerForm(p => ({ ...p, name: e.target.value }))} className="text-sm" />
                      <Input placeholder="الجوال *" value={ownerForm.phone} onChange={e => setOwnerForm(p => ({ ...p, phone: e.target.value }))} className="text-sm" />
                      <Input placeholder="البريد الإلكتروني" value={ownerForm.email} onChange={e => setOwnerForm(p => ({ ...p, email: e.target.value }))} className="text-sm" />
                      <Input placeholder="رقم الهوية" value={ownerForm.nationalId} onChange={e => setOwnerForm(p => ({ ...p, nationalId: e.target.value }))} className="text-sm" />
                      <Select value={ownerForm.managementFeeType} onValueChange={v => setOwnerForm(p => ({ ...p, managementFeeType: v as any }))}>
                        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">نسبة مئوية</SelectItem>
                          <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="قيمة رسوم الإدارة" value={ownerForm.managementFeeValue} onChange={e => setOwnerForm(p => ({ ...p, managementFeeValue: e.target.value }))} className="text-sm" />
                    </div>
                    <Button className="mt-3 bg-amber-500 hover:bg-amber-600 text-sm" onClick={() => {
                      if (!ownerForm.name || !ownerForm.phone) return toast.error("يرجى ملء الحقول المطلوبة");
                      createOwnerMutation.mutate(ownerForm);
                    }} disabled={createOwnerMutation.isPending}>
                      {createOwnerMutation.isPending ? "جاري الحفظ..." : "حفظ المالك"}
                    </Button>
                  </CardContent>
                </Card>
              )}
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>{["الاسم", "الجوال", "رسوم الإدارة", "الحالة", "تاريخ الإضافة"].map(h => (
                        <th key={h} className="text-right p-3 font-medium text-slate-600 text-xs">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {owners.map(o => (
                        <tr key={o.id} className="hover:bg-slate-50">
                          <td className="p-3 font-medium">{o.name}</td>
                          <td className="p-3 text-slate-500 font-mono text-xs">{o.phone}</td>
                          <td className="p-3 text-slate-500 text-xs">{o.managementFeeValue}{o.managementFeeType === "percentage" ? "%" : " ﷼"}</td>
                          <td className="p-3"><Badge className={o.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{o.isActive ? "نشط" : "غير نشط"}</Badge></td>
                          <td className="p-3 text-slate-400 text-xs">{new Date(o.createdAt).toLocaleDateString("ar-SA")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {owners.length === 0 && <p className="text-center text-slate-400 py-8">لا يوجد ملاك بعد</p>}
                </div>
              </Card>
            </div>
          )}

          {/* ── Brokers ── */}
          {activeTab === "brokers" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">{brokers.length} وسيط</p>
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>{["الاسم", "الجوال", "رقم الترخيص", "الحالة", "تاريخ الإضافة"].map(h => (
                        <th key={h} className="text-right p-3 font-medium text-slate-600 text-xs">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {brokers.map(b => (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="p-3 font-medium">{b.name}</td>
                          <td className="p-3 text-slate-500 font-mono text-xs">{b.phone}</td>
                          <td className="p-3 text-slate-500 text-xs">{b.licenseNumber || "—"}</td>
                          <td className="p-3"><Badge className={b.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{b.isActive ? "نشط" : "غير نشط"}</Badge></td>
                          <td className="p-3 text-slate-400 text-xs">{new Date(b.createdAt).toLocaleDateString("ar-SA")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {brokers.length === 0 && <p className="text-center text-slate-400 py-8">لا يوجد وسطاء بعد</p>}
                </div>
              </Card>
            </div>
          )}

          {/* ── Tenants ── */}
          {activeTab === "tenants" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">{tenants.length} مستأجر</p>
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>{["الاسم", "الجوال", "الهوية", "الجنسية", "الحالة"].map(h => (
                        <th key={h} className="text-right p-3 font-medium text-slate-600 text-xs">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tenants.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="p-3 font-medium">{t.name}</td>
                          <td className="p-3 text-slate-500 font-mono text-xs">{t.phone}</td>
                          <td className="p-3 text-slate-500 text-xs">{t.nationalId || "—"}</td>
                          <td className="p-3 text-slate-500 text-xs">{t.nationality || "—"}</td>
                          <td className="p-3"><Badge className={t.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>{t.isActive ? "نشط" : "منتهي"}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {tenants.length === 0 && <p className="text-center text-slate-400 py-8">لا يوجد مستأجرون بعد</p>}
                </div>
              </Card>
            </div>
          )}

          {/* ── Contracts ── */}
          {activeTab === "contracts" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">{contracts.length} عقد</p>
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
            </div>
          )}

          {/* ── Payments ── */}
          {activeTab === "payments" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{payments.length} دفعة • {overdue.length} متأخرة</p>
              </div>
              {overdue.length > 0 && (
                <Card className="border-red-200 bg-red-50 border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-700 flex items-center gap-2">
                      <AlertCircle size={16} /> دفعات متأخرة ({overdue.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {overdue.map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                        <div>
                          <p className="text-sm font-medium">{p.notes || `دفعة #${p.id}`}</p>
                          <p className="text-xs text-slate-500">استحقاق: {new Date(p.dueDate).toLocaleDateString("ar-SA")}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-red-600 font-bold">{Number(p.amount).toLocaleString("ar-SA")} ﷼</span>
                          <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700"
                            onClick={() => markPaidMutation.mutate({ id: p.id, paymentMethod: "bank_transfer" })}>
                            تسجيل دفع
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>{["النوع", "المبلغ", "تاريخ الاستحقاق", "تاريخ الدفع", "طريقة الدفع", "الحالة"].map(h => (
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
                          <td className="p-3 text-slate-500 text-xs">{p.paymentMethod || "—"}</td>
                          <td className="p-3">
                            <Badge className={p.status === "paid" ? "bg-green-100 text-green-700" : p.status === "overdue" ? "bg-red-100 text-red-700" : p.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}>
                              {p.status === "paid" ? "مدفوع" : p.status === "overdue" ? "متأخر" : p.status === "pending" ? "معلق" : p.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {payments.length === 0 && <p className="text-center text-slate-400 py-8">لا توجد دفعات بعد</p>}
                </div>
              </Card>
            </div>
          )}

          {/* ── Expenses ── */}
          {activeTab === "expenses" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">{expenses.length} مصروف</p>
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>{["الوصف", "الفئة", "المبلغ", "التاريخ", "دفع من"].map(h => (
                        <th key={h} className="text-right p-3 font-medium text-slate-600 text-xs">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {expenses.map(e => (
                        <tr key={e.id} className="hover:bg-slate-50">
                          <td className="p-3 font-medium text-sm">{e.description}</td>
                          <td className="p-3 text-xs"><Badge variant="outline">{e.category}</Badge></td>
                          <td className="p-3 text-red-600 font-medium">{Number(e.amount).toLocaleString("ar-SA")} ﷼</td>
                          <td className="p-3 text-slate-500 text-xs">{new Date(e.expenseDate).toLocaleDateString("ar-SA")}</td>
                          <td className="p-3 text-slate-500 text-xs">{e.paidBy === "company" ? "الشركة" : e.paidBy === "owner" ? "المالك" : "المستأجر"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {expenses.length === 0 && <p className="text-center text-slate-400 py-8">لا توجد مصاريف بعد</p>}
                </div>
              </Card>
            </div>
          )}

          {/* ── Maintenance ── */}
          {activeTab === "maintenance" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">{maintenance.length} طلب صيانة</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {maintenance.map(m => (
                  <Card key={m.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm">{m.title}</h3>
                        <Badge className={m.priority === "urgent" ? "bg-red-100 text-red-700" : m.priority === "high" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}>
                          {m.priority === "urgent" ? "عاجل" : m.priority === "high" ? "عالي" : m.priority === "medium" ? "متوسط" : "منخفض"}
                        </Badge>
                      </div>
                      {m.description && <p className="text-xs text-slate-500 mb-2">{m.description}</p>}
                      <div className="flex items-center justify-between">
                        <Badge className={m.status === "completed" ? "bg-green-100 text-green-700" : m.status === "in_progress" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}>
                          {m.status === "completed" ? "مكتمل" : m.status === "in_progress" ? "جاري" : "معلق"}
                        </Badge>
                        {m.cost && <span className="text-xs text-slate-500">التكلفة: {Number(m.cost).toLocaleString("ar-SA")} ﷼</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {maintenance.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-slate-400">
                    <Wrench size={40} className="mx-auto mb-3 opacity-30" />
                    <p>لا توجد طلبات صيانة</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Chats ── */}
          {activeTab === "chats" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-10rem)]">
              <Card className="overflow-hidden flex flex-col border-0 shadow-sm">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-sm">العملاء ({leads.filter(l => l.sessionId).length})</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-2 space-y-1">
                  {leads.filter(l => l.sessionId).map(lead => (
                    <button key={lead.id} onClick={() => setSelectedLeadSession(lead.sessionId!)}
                      className={`w-full text-right p-3 rounded-lg transition-colors ${selectedLeadSession === lead.sessionId ? "bg-amber-50 border border-amber-200" : "hover:bg-slate-50"}`}>
                      <p className="font-medium text-sm">{lead.name || "غير محدد"}</p>
                      <p className="text-xs text-slate-500">{SERVICE_LABELS[lead.serviceType || "unknown"]}</p>
                      <p className="text-xs text-slate-400">{lead.phone || ""}</p>
                    </button>
                  ))}
                  {leads.filter(l => l.sessionId).length === 0 && (
                    <p className="text-center text-slate-400 text-sm py-8">لا توجد محادثات بعد</p>
                  )}
                </CardContent>
              </Card>
              <Card className="lg:col-span-2 overflow-hidden flex flex-col border-0 shadow-sm">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-sm">
                    {selectedLeadSession ? `محادثة: ${leads.find(l => l.sessionId === selectedLeadSession)?.name || "عميل"}` : "اختر عميلاً"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                  {!selectedLeadSession ? (
                    <div className="flex items-center justify-center h-full text-slate-300">
                      <MessageSquare size={48} />
                    </div>
                  ) : chatHistoryQuery.isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (chatHistoryQuery.data || []).map((msg: any) => (
                    <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === "user" ? "bg-amber-500 text-white rounded-tr-sm" : "bg-slate-100 text-slate-800 rounded-tl-sm"}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
