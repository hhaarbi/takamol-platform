import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  LayoutDashboard, Users, Building2, FileText, CreditCard, Wrench,
  TrendingUp, LogOut, Search, Plus, Download, Bell, ChevronRight,
  MessageSquare, UserCheck, Briefcase, Home, CheckCircle,
  AlertCircle, Clock, X, Menu, DollarSign, BarChart3, Calendar,
  ClipboardList, Shield, FileSearch, Receipt, ListTodo, Filter,
  Eye, Edit, Trash2, Phone, Mail, MapPin, Hash, Star,
  ArrowUpDown, ChevronDown, Printer, RefreshCw, Settings,
  AlertTriangle, CheckSquare, XCircle, Banknote, PieChart, Archive
} from "lucide-react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
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
const PAYMENT_METHODS: Record<string, string> = {
  bank_transfer: "تحويل بنكي", cash: "نقدي", check: "شيك", online: "إلكتروني",
};
const EXPENSE_CATEGORIES: Record<string, string> = {
  maintenance: "صيانة", utilities: "خدمات", insurance: "تأمين", taxes: "ضرائب",
  management: "إدارة", marketing: "تسويق", legal: "قانوني", other: "أخرى",
};
const MAINTENANCE_STATUS: Record<string, string> = {
  pending: "معلق", in_progress: "جاري", completed: "مكتمل", cancelled: "ملغي",
};
const PRIORITY_LABELS: Record<string, string> = {
  low: "منخفض", medium: "متوسط", high: "عالي", urgent: "عاجل",
};
const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-600", medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700", urgent: "bg-red-100 text-red-700",
};

const NAV_SECTIONS = [
  { title: "الرئيسية", items: [
    { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
    { id: "tasks", label: "المهام اليومية", icon: ListTodo },
    { id: "calendar", label: "التقويم", icon: Calendar },
  ]},
  { title: "العمليات", items: [
    { id: "leads", label: "العملاء المحتملون", icon: Users },
    { id: "properties", label: "العقارات", icon: Building2 },
    { id: "owners", label: "الملاك", icon: UserCheck },
    { id: "brokers", label: "الوسطاء", icon: Briefcase },
    { id: "tenants", label: "المستأجرون", icon: Users },
    { id: "contracts", label: "العقود", icon: FileText },
  ]},
  { title: "المالية", items: [
    { id: "collection", label: "جدول التحصيل", icon: Receipt },
    { id: "payments", label: "الدفعات", icon: CreditCard },
    { id: "expenses", label: "المصاريف", icon: DollarSign },
    { id: "reports", label: "التقارير المالية", icon: PieChart },
  ]},
  { title: "التشغيل", items: [
    { id: "maintenance", label: "الصيانة", icon: Wrench },
    { id: "handover", label: "محاضر التسليم", icon: ClipboardList },
    { id: "vacancy", label: "إدارة الشاغر", icon: Building2 },
  ]},
  { title: "المالية المتقدمة", items: [
    { id: "ext:analytics", label: "التحليلات المتقدمة", icon: BarChart3, href: "/analytics" },
    { id: "ext:owner-transfers", label: "تحويلات الملاك", icon: Banknote, href: "/owner-transfers" },
    { id: "ext:broker-referrals", label: "إحالات الوسطاء", icon: ArrowUpDown, href: "/broker-referrals" },
  ]},
  { title: "التشغيل المتقدم", items: [
    { id: "ext:smart-alerts", label: "مركز التنبيهات", icon: AlertTriangle, href: "/smart-alerts" },
    { id: "ext:contractors", label: "المقاولون", icon: Wrench, href: "/contractors" },
    { id: "ext:tenant-ratings", label: "تقييم المستأجرين", icon: Star, href: "/tenant-ratings" },
    { id: "ext:client-notes", label: "سجل المحادثات", icon: MessageSquare, href: "/client-notes" },
    { id: "ext:data-export", label: "تصدير ونسخ احتياطي", icon: Archive, href: "/data-export" },
    { id: "ext:settings", label: "إعدادات النظام", icon: Settings, href: "/settings" },
  ]},
  { title: "التقارير والسوق", items: [
    { id: "ext:annual-report", label: "التقرير السنوي", icon: FileText, href: "/annual-report" },
    { id: "ext:market-comparison", label: "مقارنة السوق", icon: BarChart3, href: "/market-comparison" },
    { id: "ext:tenant-portal", label: "بوابة المستأجر", icon: Home, href: "/tenant-portal" },
  ]},
  { title: "أخرى", items: [
    { id: "chats", label: "المحادثات", icon: MessageSquare },
    { id: "activity", label: "سجل النشاطات", icon: FileSearch },
    { id: "compliance", label: "الامتثال", icon: Shield },
  ]},
];

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────
function formatCurrency(val: number | string | null | undefined): string {
  if (!val) return "0 ﷼";
  return `${Number(val).toLocaleString("ar-SA")} ﷼`;
}
function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-SA");
}
function formatHijriDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("ar-SA-u-ca-islamic");
  } catch { return formatDate(d); }
}
function daysUntil(d: Date | string | null | undefined): number {
  if (!d) return 999;
  return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function exportToCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [globalSearch, setGlobalSearch] = useState("");
  const [selectedLeadSession, setSelectedLeadSession] = useState<string | null>(null);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAddOwner, setShowAddOwner] = useState(false);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [showAddBroker, setShowAddBroker] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showAddContract, setShowAddContract] = useState(false);
  const [showAddHandover, setShowAddHandover] = useState(false);
  const [propertyDetailId, setPropertyDetailId] = useState<number | null>(null);
  const [collectionMonth, setCollectionMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [reportPeriod, setReportPeriod] = useState("monthly");
  const [leadsFilter, setLeadsFilter] = useState("all");

  // ─── QUERIES ──────────────────────────────────────────────────────────────
  const isAdmin = isAuthenticated && user?.role === "admin";
  const statsQuery = trpc.financial.dashboardStats.useQuery(undefined, { enabled: isAdmin });
  const financialQuery = trpc.financial.summary.useQuery(undefined as any, { enabled: isAdmin });
  const leadsQuery = trpc.leads.list.useQuery({ limit: 500 }, { enabled: isAdmin });
  const propertiesQuery = trpc.properties.list.useQuery({ limit: 500 }, { enabled: isAdmin });
  const ownersQuery = trpc.owners.list.useQuery({}, { enabled: isAdmin });
  const brokersQuery = trpc.brokers.list.useQuery({}, { enabled: isAdmin });
  const tenantsQuery = trpc.tenants.list.useQuery({}, { enabled: isAdmin });
  const contractsQuery = trpc.contracts.list.useQuery({}, { enabled: isAdmin });
  const paymentsQuery = trpc.payments.list.useQuery({}, { enabled: isAdmin });
  const overdueQuery = trpc.payments.overdue.useQuery(undefined, { enabled: isAdmin });
  const expensesQuery = trpc.expenses.list.useQuery({}, { enabled: isAdmin });
  const maintenanceQuery = trpc.maintenance.list.useQuery({}, { enabled: isAdmin });
  const tasksQuery = trpc.tasks.list.useQuery({ status: "pending" }, { enabled: isAdmin });
  const activityQuery = trpc.activity.list.useQuery({ limit: 100 }, { enabled: isAdmin });
  const chatHistoryQuery = trpc.chat.getHistory.useQuery(selectedLeadSession!, { enabled: !!selectedLeadSession });

  // ─── MUTATIONS ────────────────────────────────────────────────────────────
  const updateLeadMutation = trpc.leads.update.useMutation({ onSuccess: () => { leadsQuery.refetch(); toast.success("تم التحديث"); } });
  const createPropertyMutation = trpc.properties.create.useMutation({ onSuccess: () => { propertiesQuery.refetch(); toast.success("تم إضافة العقار"); setShowAddProperty(false); } });
  const deletePropertyMutation = trpc.properties.delete.useMutation({ onSuccess: () => { propertiesQuery.refetch(); toast.success("تم الحذف"); } });
  const createOwnerMutation = trpc.owners.create.useMutation({ onSuccess: () => { ownersQuery.refetch(); toast.success("تم إضافة المالك"); setShowAddOwner(false); } });
  const createTenantMutation = trpc.tenants.create.useMutation({ onSuccess: () => { tenantsQuery.refetch(); toast.success("تم إضافة المستأجر"); setShowAddTenant(false); } });
  const createBrokerMutation = trpc.brokers.create.useMutation({ onSuccess: () => { brokersQuery.refetch(); toast.success("تم إضافة الوسيط"); setShowAddBroker(false); } });
  const markPaidMutation = trpc.payments.markPaid.useMutation({ onSuccess: () => { paymentsQuery.refetch(); overdueQuery.refetch(); toast.success("تم تسجيل الدفع"); } });
  const createPaymentMutation = trpc.payments.create.useMutation({ onSuccess: () => { paymentsQuery.refetch(); toast.success("تم إضافة الدفعة"); setShowAddPayment(false); } });
  const createExpenseMutation = trpc.expenses.create.useMutation({ onSuccess: () => { expensesQuery.refetch(); toast.success("تم إضافة المصروف"); setShowAddExpense(false); } });
  const createMaintenanceMutation = trpc.maintenance.create.useMutation({ onSuccess: () => { maintenanceQuery.refetch(); toast.success("تم إضافة طلب الصيانة"); setShowAddMaintenance(false); } });
  const updateMaintenanceMutation = trpc.maintenance.update.useMutation({ onSuccess: () => { maintenanceQuery.refetch(); toast.success("تم تحديث الحالة"); } });
  const createTaskMutation = trpc.tasks.create.useMutation({ onSuccess: () => { tasksQuery.refetch(); toast.success("تم إضافة المهمة"); setShowAddTask(false); } });
  const completeTaskMutation = trpc.tasks.update.useMutation({ onSuccess: () => { tasksQuery.refetch(); toast.success("تم إنجاز المهمة"); } });
  const createContractMutation = trpc.contracts.create.useMutation({ onSuccess: () => { contractsQuery.refetch(); toast.success("تم إنشاء العقد"); setShowAddContract(false); } });

  // ─── DATA ─────────────────────────────────────────────────────────────────
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
  const tasks = tasksQuery.data || [];
  const activities = activityQuery.data || [];
  const stats = statsQuery.data;
  const financial = financialQuery.data;

  // ─── COMPUTED ─────────────────────────────────────────────────────────────
  const filteredLeads = useMemo(() => leads.filter(l => {
    const matchSearch = !globalSearch || l.name?.includes(globalSearch) || l.phone?.includes(globalSearch);
    const matchFilter = leadsFilter === "all" || l.status === leadsFilter || l.serviceType === leadsFilter;
    return matchSearch && matchFilter;
  }), [leads, globalSearch, leadsFilter]);

  const vacantProperties = useMemo(() => properties.filter(p => p.status === "available"), [properties]);
  const occupiedProperties = useMemo(() => properties.filter(p => p.status === "rented" || p.status === "sold"), [properties]);
  const occupancyRate = properties.length > 0 ? Math.round((occupiedProperties.length / properties.length) * 100) : 0;

  const expiringContracts = useMemo(() => contracts.filter(c => {
    const days = daysUntil(c.endDate);
    return c.status === "active" && days >= 0 && days <= 60;
  }), [contracts]);

  const monthlyCollection = useMemo(() => {
    const [year, month] = collectionMonth.split("-").map(Number);
    return payments.filter(p => {
      const d = new Date(p.dueDate);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
  }, [payments, collectionMonth]);

  const collectionStats = useMemo(() => {
    const total = monthlyCollection.reduce((s, p) => s + Number(p.amount || 0), 0);
    const collected = monthlyCollection.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount || 0), 0);
    const pending = monthlyCollection.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount || 0), 0);
    const overdueAmt = monthlyCollection.filter(p => p.status === "overdue").reduce((s, p) => s + Number(p.amount || 0), 0);
    return { total, collected, pending, overdue: overdueAmt, rate: total > 0 ? Math.round((collected / total) * 100) : 0 };
  }, [monthlyCollection]);

  // ─── FORMS ────────────────────────────────────────────────────────────────
  const [propertyForm, setPropertyForm] = useState({ titleAr: "", type: "apartment" as "apartment" | "villa" | "land" | "commercial" | "office" | "warehouse" | "building" | "farm", listingType: "rent" as "rent" | "sale" | "managed", price: "", area: "", bedrooms: "", bathrooms: "", district: "", descriptionAr: "", featuresAr: "" });
  const [ownerForm, setOwnerForm] = useState({ name: "", phone: "", email: "", nationalId: "", managementFeeType: "percentage" as "fixed" | "percentage", managementFeeValue: "5.00", notes: "" });
  const [tenantForm, setTenantForm] = useState({ name: "", phone: "", email: "", nationalId: "", nationality: "سعودي" });
  const [brokerForm, setBrokerForm] = useState({ name: "", phone: "", email: "", falLicenseNumber: "", commissionRate: "2.5" });
  const [expenseForm, setExpenseForm] = useState({ description: "", category: "maintenance" as "maintenance" | "utilities" | "insurance" | "management" | "other" | "tax" | "cleaning" | "security", amount: "", propertyId: "" as any, paidBy: "company" as string, expenseDate: new Date().toISOString().split("T")[0] });
  const [maintenanceForm, setMaintenanceForm] = useState({ title: "", description: "", propertyId: "" as any, priority: "medium" as "low" | "medium" | "high" | "urgent", category: "plumbing" as string });
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium" as string, dueDate: "" });
  const [paymentForm, setPaymentForm] = useState({ contractId: "" as any, amount: "", dueDate: "", type: "rent" as "rent" | "deposit" | "maintenance_fee" | "management_fee" | "commission" | "other", notes: "" });
  const [contractForm, setContractForm] = useState({ propertyId: "" as any, tenantId: "" as any, ownerId: "" as any, type: "rent" as "rent" | "sale" | "management", startDate: "", endDate: "", rentAmount: "", paymentFrequency: "monthly" as "monthly" | "quarterly" | "semi_annual" | "annual", contractNumber: "" });

  // ─── AUTH GUARDS ──────────────────────────────────────────────────────────
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
      <Card className="w-full max-w-sm shadow-xl"><CardContent className="p-8 text-center">
        <Building2 size={48} className="mx-auto mb-4 text-amber-500" />
        <h2 className="text-xl font-bold mb-2">لوحة تحكم تكامل</h2>
        <p className="text-slate-500 mb-6 text-sm">يرجى تسجيل الدخول للوصول</p>
        <Button className="w-full bg-amber-500 hover:bg-amber-600" onClick={() => window.location.href = getLoginUrl()}>تسجيل الدخول</Button>
      </CardContent></Card>
    </div>
  );
  if (user?.role !== "admin") return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
      <Card className="w-full max-w-sm shadow-xl"><CardContent className="p-8 text-center">
        <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
        <h2 className="text-xl font-bold mb-2">غير مصرح</h2>
        <p className="text-slate-500 mb-6 text-sm">هذه الصفحة للمدير فقط</p>
        <Button variant="outline" onClick={() => navigate("/")}>العودة للرئيسية</Button>
      </CardContent></Card>
    </div>
  );

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <>
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      {/* ── Sidebar ── */}
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
          {NAV_SECTIONS.map(section => (
            <div key={section.title} className="mb-3">
              {sidebarOpen && <p className="text-xs text-slate-500 px-3 py-1 font-medium">{section.title}</p>}
              {section.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    if ((item as any).href) { navigate((item as any).href); }
                    else { setActiveTab(item.id); }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 text-sm transition-colors ${activeTab === item.id ? "bg-amber-500/20 text-amber-400 font-medium" : "text-slate-300 hover:bg-slate-800"}`}
                >
                  <item.icon size={17} className="shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                  {item.id === "collection" && overdue.length > 0 && sidebarOpen && (
                    <span className="mr-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{overdue.length}</span>
                  )}
                  {(item as any).href && sidebarOpen && (
                    <span className="mr-auto text-slate-500 text-xs">↗</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          {sidebarOpen && <p className="text-xs text-slate-400 mb-2 truncate">{user?.name}</p>}
          <button onClick={logout} className="w-full flex items-center gap-2 text-slate-400 hover:text-red-400 text-xs px-2 py-1.5 rounded">
            <LogOut size={14} />{sidebarOpen && "خروج"}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className={`flex-1 ${sidebarOpen ? "mr-64" : "mr-16"} transition-all duration-300`}>
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-slate-800 text-sm">
              {NAV_SECTIONS.flatMap(s => s.items).find(n => n.id === activeTab)?.label}
            </h2>
            {overdue.length > 0 && <Badge variant="destructive" className="text-xs">{overdue.length} متأخر</Badge>}
            {expiringContracts.length > 0 && <Badge className="bg-orange-100 text-orange-700 text-xs">{expiringContracts.length} عقد ينتهي قريباً</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} placeholder="بحث شامل..." className="h-8 text-xs pr-8 w-56" />
            </div>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => navigate("/")}>
              <Home size={14} className="ml-1" /> الموقع
            </Button>
          </div>
        </header>

        <div className="p-6">

          {/* ══════════════════════════════════════════════════════════════════
              OVERVIEW - نظرة عامة
          ══════════════════════════════════════════════════════════════════ */}
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
                  <Card key={i} className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab(["owners","properties","tenants","contracts","leads","brokers"][i])}>
                    <CardContent className="p-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}><s.icon size={20} /></div>
                      <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                      <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Financial + Occupancy */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: "إجمالي الإيرادات", value: financial?.totalRevenue ?? 0, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
                  { label: "إجمالي المصاريف", value: financial?.totalExpenses ?? 0, icon: DollarSign, color: "text-red-600", bg: "bg-red-50" },
                  { label: "صافي الربح", value: financial?.netProfit ?? 0, icon: BarChart3, color: "text-blue-600", bg: "bg-blue-50" },
                ].map((f, i) => (
                  <Card key={i} className="border-0 shadow-sm">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${f.bg}`}><f.icon size={22} className={f.color} /></div>
                      <div>
                        <p className="text-xs text-slate-500">{f.label}</p>
                        <p className={`text-xl font-bold ${f.color}`}>{formatCurrency(f.value)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-500">نسبة الإشغال</p>
                      <span className="text-lg font-bold text-amber-600">{occupancyRate}%</span>
                    </div>
                    <Progress value={occupancyRate} className="h-2" />
                    <p className="text-xs text-slate-400 mt-2">{vacantProperties.length} شاغر من {properties.length}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Alerts Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Overdue */}
                {overdue.length > 0 && (
                  <Card className="border-red-200 bg-red-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-red-700 flex items-center gap-2">
                        <AlertCircle size={16} /> دفعات متأخرة ({overdue.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {overdue.slice(0, 4).map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-white rounded-lg p-3 text-sm">
                          <div>
                            <span className="text-slate-700">{p.notes || `دفعة #${p.id}`}</span>
                            <p className="text-xs text-slate-400">استحقاق: {formatDate(p.dueDate)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-red-600 font-bold text-sm">{formatCurrency(p.amount)}</span>
                            <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700"
                              onClick={() => markPaidMutation.mutate({ id: p.id, paymentMethod: "bank_transfer" })}>
                              <CheckCircle size={12} className="ml-1" /> تسجيل
                            </Button>
                          </div>
                        </div>
                      ))}
                      {overdue.length > 4 && <Button size="sm" variant="ghost" className="w-full text-xs text-red-600" onClick={() => setActiveTab("collection")}>عرض الكل ({overdue.length})</Button>}
                    </CardContent>
                  </Card>
                )}
                {/* Expiring contracts */}
                {expiringContracts.length > 0 && (
                  <Card className="border-orange-200 bg-orange-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-orange-700 flex items-center gap-2">
                        <Clock size={16} /> عقود تنتهي قريباً ({expiringContracts.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {expiringContracts.slice(0, 4).map(c => (
                        <div key={c.id} className="flex items-center justify-between bg-white rounded-lg p-3 text-sm">
                          <span className="text-slate-700">{c.contractNumber}</span>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-orange-100 text-orange-700 text-xs">{daysUntil(c.endDate)} يوم</Badge>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Tasks + Recent Activity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm">المهام اليومية</CardTitle>
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => setActiveTab("tasks")}>عرض الكل</Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {tasks.slice(0, 5).map(t => (
                      <div key={t.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                        <div className="flex items-center gap-2">
                          <button onClick={() => completeTaskMutation.mutate({ id: t.id, data: { status: "completed", completedAt: new Date().toISOString() } })} className="text-slate-300 hover:text-green-500">
                            <CheckSquare size={16} />
                          </button>
                          <span className="text-sm text-slate-700">{t.title}</span>
                        </div>
                        <Badge className={`text-xs ${PRIORITY_COLORS[t.priority || "medium"]}`}>{PRIORITY_LABELS[t.priority || "medium"]}</Badge>
                      </div>
                    ))}
                    {tasks.length === 0 && <p className="text-center text-slate-400 text-sm py-4">لا توجد مهام معلقة</p>}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm">آخر النشاطات</CardTitle>
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => setActiveTab("activity")}>عرض الكل</Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {activities.slice(0, 5).map(a => (
                      <div key={a.id} className="flex items-center gap-3 p-2 text-sm">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <FileSearch size={14} className="text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-700 truncate">{a.description || `${a.action} - ${a.entityType}`}</p>
                          <p className="text-xs text-slate-400">{a.userName} • {formatDate(a.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                    {activities.length === 0 && <p className="text-center text-slate-400 text-sm py-4">لا توجد نشاطات</p>}
                  </CardContent>
                </Card>
              </div>

              {/* Recent leads */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">آخر العملاء المحتملين</CardTitle>
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => setActiveTab("leads")}>عرض الكل <ChevronRight size={14} className="mr-1" /></Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {leads.slice(0, 5).map(lead => (
                      <div key={lead.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm text-slate-800">{lead.name || "غير محدد"}</p>
                          <p className="text-xs text-slate-500">{lead.phone || ""} • {SERVICE_LABELS[lead.serviceType || "unknown"]}</p>
                        </div>
                        <Badge className={`text-xs ${STATUS_COLORS[lead.status || "new"]}`}>{STATUS_LABELS[lead.status || "new"]}</Badge>
                      </div>
                    ))}
                    {leads.length === 0 && <p className="text-center text-slate-400 text-sm py-4">لا يوجد عملاء بعد</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TASKS - المهام اليومية
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "tasks" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{tasks.length} مهمة معلقة</p>
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-xs" onClick={() => setShowAddTask(!showAddTask)}>
                  <Plus size={14} className="ml-1" /> مهمة جديدة
                </Button>
              </div>
              {showAddTask && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input placeholder="عنوان المهمة *" value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} className="text-sm" />
                      <Select value={taskForm.priority} onValueChange={v => setTaskForm(p => ({ ...p, priority: v }))}>
                        <SelectTrigger className="text-sm"><SelectValue placeholder="الأولوية" /></SelectTrigger>
                        <SelectContent>{Object.entries(PRIORITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="date" value={taskForm.dueDate} onChange={e => setTaskForm(p => ({ ...p, dueDate: e.target.value }))} className="text-sm" />
                    </div>
                    <Input placeholder="وصف المهمة" value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} className="text-sm mt-3" />
                    <div className="flex gap-2 mt-3">
                      <Button className="bg-amber-500 hover:bg-amber-600 text-sm" onClick={() => {
                        if (!taskForm.title) return toast.error("يرجى إدخال عنوان المهمة");
                        createTaskMutation.mutate({ title: taskForm.title, type: "other" as const, priority: taskForm.priority as any, dueDate: taskForm.dueDate || new Date().toISOString().split("T")[0], description: taskForm.description || undefined });
                      }} disabled={createTaskMutation.isPending}>{createTaskMutation.isPending ? "جاري..." : "إضافة"}</Button>
                      <Button variant="outline" className="text-sm" onClick={() => setShowAddTask(false)}>إلغاء</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              <div className="space-y-2">
                {tasks.map(t => (
                  <Card key={t.id} className="border-0 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button onClick={() => completeTaskMutation.mutate({ id: t.id, data: { status: "completed", completedAt: new Date().toISOString() } })} className="text-slate-300 hover:text-green-500 transition-colors">
                          <CheckSquare size={20} />
                        </button>
                        <div>
                          <p className="font-medium text-sm text-slate-800">{t.title}</p>
                          {t.description && <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {t.dueDate && <span className="text-xs text-slate-400">{formatDate(t.dueDate)}</span>}
                        <Badge className={`text-xs ${PRIORITY_COLORS[t.priority || "medium"]}`}>{PRIORITY_LABELS[t.priority || "medium"]}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {tasks.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <CheckCircle size={40} className="mx-auto mb-3 opacity-30" />
                    <p>لا توجد مهام معلقة — عمل ممتاز!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              CALENDAR - التقويم التشغيلي
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "calendar" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-red-600 flex items-center gap-2"><AlertCircle size={16} /> دفعات متأخرة</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {overdue.slice(0, 5).map(p => (
                      <div key={p.id} className="flex justify-between items-center text-sm p-2 bg-red-50 rounded">
                        <span>{p.notes || `#${p.id}`}</span>
                        <span className="text-red-600 font-medium">{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                    {overdue.length === 0 && <p className="text-sm text-slate-400 text-center py-4">لا توجد متأخرات</p>}
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-orange-600 flex items-center gap-2"><Clock size={16} /> عقود تنتهي قريباً</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {expiringContracts.slice(0, 5).map(c => (
                      <div key={c.id} className="flex justify-between items-center text-sm p-2 bg-orange-50 rounded">
                        <span>{c.contractNumber}</span>
                        <Badge className="bg-orange-100 text-orange-700 text-xs">{daysUntil(c.endDate)} يوم</Badge>
                      </div>
                    ))}
                    {expiringContracts.length === 0 && <p className="text-sm text-slate-400 text-center py-4">لا توجد عقود تنتهي قريباً</p>}
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-blue-600 flex items-center gap-2"><Wrench size={16} /> صيانة معلقة</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {maintenance.filter(m => m.status === "open" || m.status === "in_progress").slice(0, 5).map(m => (
                      <div key={m.id} className="flex justify-between items-center text-sm p-2 bg-blue-50 rounded">
                        <span>{m.title}</span>
                        <Badge className={PRIORITY_COLORS[m.priority || "medium"]}>{PRIORITY_LABELS[m.priority || "medium"]}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
              {/* Upcoming payments */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm">الدفعات القادمة (30 يوم)</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {payments.filter(p => p.status === "pending" && daysUntil(p.dueDate) >= 0 && daysUntil(p.dueDate) <= 30).map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm">
                        <div>
                          <p className="font-medium">{p.notes || `دفعة #${p.id}`}</p>
                          <p className="text-xs text-slate-400">استحقاق: {formatDate(p.dueDate)} ({daysUntil(p.dueDate)} يوم)</p>
                        </div>
                        <span className="font-bold text-amber-600">{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              LEADS - العملاء المحتملون
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "leads" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-500">{filteredLeads.length} عميل</p>
                  <Select value={leadsFilter} onValueChange={setLeadsFilter}>
                    <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => exportToCSV("leads.csv",
                  ["الاسم", "الجوال", "الخدمة", "الميزانية", "الحالة", "المصدر", "التاريخ"],
                  leads.map(l => [l.name || "", l.phone || "", SERVICE_LABELS[l.serviceType || "unknown"], l.budget || "", STATUS_LABELS[l.status || "new"], l.source || "", formatDate(l.createdAt)])
                )}>
                  <Download size={14} className="ml-1" /> تصدير CSV
                </Button>
              </div>
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>{["الاسم", "الجوال", "الخدمة", "الميزانية", "المصدر", "الحالة", "التاريخ", "إجراء"].map(h => (
                        <th key={h} className="text-right p-3 font-medium text-slate-600 text-xs">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLeads.map(lead => (
                        <tr key={lead.id} className="hover:bg-slate-50">
                          <td className="p-3 font-medium text-slate-800">{lead.name || "—"}</td>
                          <td className="p-3 text-slate-600 font-mono text-xs">{lead.phone || "—"}</td>
                          <td className="p-3"><Badge variant="outline" className="text-xs">{SERVICE_LABELS[lead.serviceType || "unknown"]}</Badge></td>
                          <td className="p-3 text-slate-500 text-xs">{lead.budget || "—"}</td>
                          <td className="p-3 text-slate-500 text-xs">{lead.source || "—"}</td>
                          <td className="p-3">
                            <Select value={lead.status || "new"} onValueChange={v => updateLeadMutation.mutate({ id: lead.id, data: { status: v } })}>
                              <SelectTrigger className={`h-7 text-xs w-28 border-0 ${STATUS_COLORS[lead.status || "new"]}`}><SelectValue /></SelectTrigger>
                              <SelectContent>{Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                            </Select>
                          </td>
                          <td className="p-3 text-slate-400 text-xs">{formatDate(lead.createdAt)}</td>
                          <td className="p-3">
                            {lead.sessionId && (
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setSelectedLeadSession(lead.sessionId!); setActiveTab("chats"); }}>
                                <MessageSquare size={12} className="ml-1" /> محادثة
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredLeads.length === 0 && <p className="text-center text-slate-400 py-8">لا توجد نتائج</p>}
                </div>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              PROPERTIES - العقارات
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "properties" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-slate-500">{properties.length} عقار</p>
                  <Badge className="bg-green-100 text-green-700 text-xs">{occupiedProperties.length} مشغول</Badge>
                  <Badge className="bg-yellow-100 text-yellow-700 text-xs">{vacantProperties.length} شاغر</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => exportToCSV("properties.csv",
                    ["العنوان", "النوع", "الإعلان", "السعر", "المساحة", "الحي", "الحالة"],
                    properties.map(p => [p.titleAr, PROPERTY_TYPES[p.type] || p.type, p.listingType, String(p.price), p.area || "", p.district || "", p.status || ""])
                  )}><Download size={14} className="ml-1" /> تصدير</Button>
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-xs" onClick={() => setShowAddProperty(!showAddProperty)}>
                    <Plus size={14} className="ml-1" /> إضافة عقار
                  </Button>
                </div>
              </div>

              {showAddProperty && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-between">إضافة عقار جديد <button onClick={() => setShowAddProperty(false)}><X size={16} /></button></CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Input placeholder="عنوان العقار *" value={propertyForm.titleAr} onChange={e => setPropertyForm(p => ({ ...p, titleAr: e.target.value }))} className="text-sm col-span-2" />
                      <Select value={propertyForm.type} onValueChange={v => setPropertyForm(p => ({ ...p, type: v as typeof p.type }))}>
                        <SelectTrigger className="text-sm"><SelectValue placeholder="نوع العقار" /></SelectTrigger>
                        <SelectContent>{Object.entries(PROPERTY_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={propertyForm.listingType} onValueChange={v => setPropertyForm(p => ({ ...p, listingType: v as typeof p.listingType }))}>
                        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sale">للبيع</SelectItem>
                          <SelectItem value="rent">للإيجار</SelectItem>
                          <SelectItem value="managed">مُدار</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="السعر (ريال) *" value={propertyForm.price} onChange={e => setPropertyForm(p => ({ ...p, price: e.target.value }))} className="text-sm" />
                      <Input placeholder="المساحة (م²)" value={propertyForm.area} onChange={e => setPropertyForm(p => ({ ...p, area: e.target.value }))} className="text-sm" />
                      <Input placeholder="غرف النوم" type="number" value={propertyForm.bedrooms} onChange={e => setPropertyForm(p => ({ ...p, bedrooms: e.target.value }))} className="text-sm" />
                      <Input placeholder="دورات المياه" type="number" value={propertyForm.bathrooms} onChange={e => setPropertyForm(p => ({ ...p, bathrooms: e.target.value }))} className="text-sm" />
                      <Input placeholder="الحي / الموقع" value={propertyForm.district} onChange={e => setPropertyForm(p => ({ ...p, district: e.target.value }))} className="text-sm col-span-2" />
                    </div>
                    <textarea placeholder="وصف العقار" value={propertyForm.descriptionAr} onChange={e => setPropertyForm(p => ({ ...p, descriptionAr: e.target.value }))} className="w-full mt-3 p-2 border rounded-md text-sm resize-none h-20" />
                    <div className="flex gap-2 mt-3">
                      <Button className="bg-amber-500 hover:bg-amber-600 text-sm" onClick={() => {
                        if (!propertyForm.titleAr || !propertyForm.price) return toast.error("يرجى ملء الحقول المطلوبة");
                        createPropertyMutation.mutate({ ...propertyForm, bedrooms: propertyForm.bedrooms ? parseInt(propertyForm.bedrooms) : undefined, bathrooms: propertyForm.bathrooms ? parseInt(propertyForm.bathrooms) : undefined, area: propertyForm.area || undefined, district: propertyForm.district || undefined, descriptionAr: propertyForm.descriptionAr || undefined, features: [] });
                      }} disabled={createPropertyMutation.isPending}>{createPropertyMutation.isPending ? "جاري..." : "حفظ العقار"}</Button>
                      <Button variant="outline" className="text-sm" onClick={() => setShowAddProperty(false)}>إلغاء</Button>
                    </div>
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
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin size={12} />{prop.city} {prop.district ? `• ${prop.district}` : ""}</p>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <Badge className={`text-xs ${prop.listingType === "sale" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                            {prop.listingType === "sale" ? "بيع" : prop.listingType === "rent" ? "إيجار" : "مُدار"}
                          </Badge>
                          <Badge className={`text-xs ${prop.status === "available" ? "bg-yellow-100 text-yellow-700" : prop.status === "rented" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                            {prop.status === "available" ? "شاغر" : prop.status === "rented" ? "مؤجر" : prop.status === "sold" ? "مباع" : prop.status || "متاح"}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-3">
                        <span>{PROPERTY_TYPES[prop.type] || prop.type}</span>
                        {prop.area && <span>📐 {prop.area} م²</span>}
                        {prop.bedrooms && <span>🛏 {prop.bedrooms} غرف</span>}
                        {prop.bathrooms && <span>🚿 {prop.bathrooms} حمام</span>}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-600">{formatCurrency(prop.price)}</span>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="text-xs h-7 text-blue-600 hover:text-blue-800"
                            onClick={() => setPropertyDetailId(prop.id)}>
                            📊 ROI
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs h-7 text-red-500 hover:text-red-700"
                            onClick={() => { if (confirm("حذف هذا العقار؟")) deletePropertyMutation.mutate(prop.id); }}>
                            <Trash2 size={12} className="ml-1" /> حذف
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {properties.length === 0 && (
                  <div className="col-span-3 text-center py-12 text-slate-400">
                    <Building2 size={40} className="mx-auto mb-3 opacity-30" /><p>لا توجد عقارات بعد</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              OWNERS - الملاك
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "owners" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{owners.length} مالك</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => exportToCSV("owners.csv",
                    ["الاسم", "الجوال", "البريد", "الهوية", "رسوم الإدارة", "الحالة"],
                    owners.map(o => [o.name, o.phone, o.email || "", o.nationalId || "", `${o.managementFeeValue}${o.managementFeeType === "percentage" ? "%" : " ﷼"}`, o.isActive ? "نشط" : "غير نشط"])
                  )}><Download size={14} className="ml-1" /> تصدير</Button>
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-xs" onClick={() => setShowAddOwner(!showAddOwner)}>
                    <Plus size={14} className="ml-1" /> إضافة مالك
                  </Button>
                </div>
              </div>
              {showAddOwner && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <Input placeholder="الاسم *" value={ownerForm.name} onChange={e => setOwnerForm(p => ({ ...p, name: e.target.value }))} className="text-sm" />
                      <Input placeholder="الجوال *" value={ownerForm.phone} onChange={e => setOwnerForm(p => ({ ...p, phone: e.target.value }))} className="text-sm" />
                      <Input placeholder="البريد الإلكتروني" value={ownerForm.email} onChange={e => setOwnerForm(p => ({ ...p, email: e.target.value }))} className="text-sm" />
                      <Input placeholder="رقم الهوية" value={ownerForm.nationalId} onChange={e => setOwnerForm(p => ({ ...p, nationalId: e.target.value }))} className="text-sm" />
                      <Select value={ownerForm.managementFeeType} onValueChange={v => setOwnerForm(p => ({ ...p, managementFeeType: v as typeof p.managementFeeType }))}>
                        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">نسبة مئوية</SelectItem>
                          <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="قيمة رسوم الإدارة" value={ownerForm.managementFeeValue} onChange={e => setOwnerForm(p => ({ ...p, managementFeeValue: e.target.value }))} className="text-sm" />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button className="bg-amber-500 hover:bg-amber-600 text-sm" onClick={() => {
                        if (!ownerForm.name || !ownerForm.phone) return toast.error("يرجى ملء الحقول المطلوبة");
                        createOwnerMutation.mutate(ownerForm);
                      }} disabled={createOwnerMutation.isPending}>{createOwnerMutation.isPending ? "جاري..." : "حفظ"}</Button>
                      <Button variant="outline" className="text-sm" onClick={() => setShowAddOwner(false)}>إلغاء</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>{["الاسم", "الجوال", "البريد", "الهوية", "رسوم الإدارة", "الحالة", "التاريخ"].map(h => (
                        <th key={h} className="text-right p-3 font-medium text-slate-600 text-xs">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {owners.map(o => (
                        <tr key={o.id} className="hover:bg-slate-50">
                          <td className="p-3 font-medium">{o.name}</td>
                          <td className="p-3 text-slate-500 font-mono text-xs">{o.phone}</td>
                          <td className="p-3 text-slate-500 text-xs">{o.email || "—"}</td>
                          <td className="p-3 text-slate-500 text-xs">{o.nationalId || "—"}</td>
                          <td className="p-3 text-slate-500 text-xs">{o.managementFeeValue}{o.managementFeeType === "percentage" ? "%" : " ﷼"}</td>
                          <td className="p-3"><Badge className={o.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{o.isActive ? "نشط" : "غير نشط"}</Badge></td>
                          <td className="p-3 text-slate-400 text-xs">{formatDate(o.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {owners.length === 0 && <p className="text-center text-slate-400 py-8">لا يوجد ملاك بعد</p>}
                </div>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              BROKERS - الوسطاء
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "brokers" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{brokers.length} وسيط</p>
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-xs" onClick={() => setShowAddBroker(!showAddBroker)}>
                  <Plus size={14} className="ml-1" /> إضافة وسيط
                </Button>
              </div>
              {showAddBroker && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <Input placeholder="الاسم *" value={brokerForm.name} onChange={e => setBrokerForm(p => ({ ...p, name: e.target.value }))} className="text-sm" />
                      <Input placeholder="الجوال *" value={brokerForm.phone} onChange={e => setBrokerForm(p => ({ ...p, phone: e.target.value }))} className="text-sm" />
                      <Input placeholder="البريد الإلكتروني" value={brokerForm.email} onChange={e => setBrokerForm(p => ({ ...p, email: e.target.value }))} className="text-sm" />
                      <Input placeholder="رقم ترخيص فال" value={brokerForm.falLicenseNumber} onChange={e => setBrokerForm(p => ({ ...p, falLicenseNumber: e.target.value }))} className="text-sm" />
                      <Input placeholder="نسبة العمولة %" value={brokerForm.commissionRate} onChange={e => setBrokerForm(p => ({ ...p, commissionRate: e.target.value }))} className="text-sm" />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button className="bg-amber-500 hover:bg-amber-600 text-sm" onClick={() => {
                        if (!brokerForm.name || !brokerForm.phone) return toast.error("يرجى ملء الحقول المطلوبة");
                        createBrokerMutation.mutate({ ...brokerForm, commissionRates: { default: parseFloat(brokerForm.commissionRate) || 2.5 } });
                      }} disabled={createBrokerMutation.isPending}>{createBrokerMutation.isPending ? "جاري..." : "حفظ"}</Button>
                      <Button variant="outline" className="text-sm" onClick={() => setShowAddBroker(false)}>إلغاء</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>{["الاسم", "الجوال", "ترخيص فال", "العمولة", "الحالة", "التاريخ"].map(h => (
                        <th key={h} className="text-right p-3 font-medium text-slate-600 text-xs">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {brokers.map(b => (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="p-3 font-medium">{b.name}</td>
                          <td className="p-3 text-slate-500 font-mono text-xs">{b.phone}</td>
                          <td className="p-3 text-slate-500 text-xs">{b.falLicenseNumber || "—"}</td>
                          <td className="p-3 text-slate-500 text-xs">{(b.commissionRates as any)?.default || 2.5}%</td>
                          <td className="p-3"><Badge className={b.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{b.isActive ? "نشط" : "غير نشط"}</Badge></td>
                          <td className="p-3 text-slate-400 text-xs">{formatDate(b.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {brokers.length === 0 && <p className="text-center text-slate-400 py-8">لا يوجد وسطاء بعد</p>}
                </div>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TENANTS - المستأجرون
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "tenants" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{tenants.length} مستأجر</p>
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-xs" onClick={() => setShowAddTenant(!showAddTenant)}>
                  <Plus size={14} className="ml-1" /> إضافة مستأجر
                </Button>
              </div>
              {showAddTenant && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <Input placeholder="الاسم *" value={tenantForm.name} onChange={e => setTenantForm(p => ({ ...p, name: e.target.value }))} className="text-sm" />
                      <Input placeholder="الجوال *" value={tenantForm.phone} onChange={e => setTenantForm(p => ({ ...p, phone: e.target.value }))} className="text-sm" />
                      <Input placeholder="البريد الإلكتروني" value={tenantForm.email} onChange={e => setTenantForm(p => ({ ...p, email: e.target.value }))} className="text-sm" />
                      <Input placeholder="رقم الهوية / الإقامة" value={tenantForm.nationalId} onChange={e => setTenantForm(p => ({ ...p, nationalId: e.target.value }))} className="text-sm" />
                      <Input placeholder="الجنسية" value={tenantForm.nationality} onChange={e => setTenantForm(p => ({ ...p, nationality: e.target.value }))} className="text-sm" />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button className="bg-amber-500 hover:bg-amber-600 text-sm" onClick={() => {
                        if (!tenantForm.name || !tenantForm.phone) return toast.error("يرجى ملء الحقول المطلوبة");
                        createTenantMutation.mutate(tenantForm);
                      }} disabled={createTenantMutation.isPending}>{createTenantMutation.isPending ? "جاري..." : "حفظ"}</Button>
                      <Button variant="outline" className="text-sm" onClick={() => setShowAddTenant(false)}>إلغاء</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>{["الاسم", "الجوال", "البريد", "الهوية", "الجنسية", "الحالة"].map(h => (
                        <th key={h} className="text-right p-3 font-medium text-slate-600 text-xs">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tenants.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="p-3 font-medium">{t.name}</td>
                          <td className="p-3 text-slate-500 font-mono text-xs">{t.phone}</td>
                          <td className="p-3 text-slate-500 text-xs">{t.email || "—"}</td>
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

          {/* ══════════════════════════════════════════════════════════════════
              CONTRACTS - العقود
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "contracts" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-500">{contracts.length} عقد</p>
                  {expiringContracts.length > 0 && <Badge className="bg-orange-100 text-orange-700 text-xs">{expiringContracts.length} ينتهي قريباً</Badge>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => exportToCSV("contracts.csv",
                    ["رقم العقد", "النوع", "المبلغ", "البداية", "النهاية", "الحالة"],
                    contracts.map(c => [c.contractNumber, c.type, c.rentAmount || c.salePrice || "", formatDate(c.startDate), formatDate(c.endDate), c.status])
                  )}><Download size={14} className="ml-1" /> تصدير</Button>
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-xs" onClick={() => setShowAddContract(!showAddContract)}>
                    <Plus size={14} className="ml-1" /> عقد جديد
                  </Button>
                </div>
              </div>
              {showAddContract && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Select value={contractForm.type} onValueChange={v => setContractForm(p => ({ ...p, type: v as typeof p.type }))}>
                        <SelectTrigger className="text-sm"><SelectValue placeholder="نوع العقد" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rent">إيجار</SelectItem>
                          <SelectItem value="sale">بيع</SelectItem>
                          <SelectItem value="management">إدارة</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={String(contractForm.propertyId)} onValueChange={v => setContractForm(p => ({ ...p, propertyId: parseInt(v) }))}>
                        <SelectTrigger className="text-sm"><SelectValue placeholder="العقار" /></SelectTrigger>
                        <SelectContent>{properties.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.titleAr}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={String(contractForm.tenantId)} onValueChange={v => setContractForm(p => ({ ...p, tenantId: parseInt(v) }))}>
                        <SelectTrigger className="text-sm"><SelectValue placeholder="المستأجر" /></SelectTrigger>
                        <SelectContent>{tenants.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={String(contractForm.ownerId)} onValueChange={v => setContractForm(p => ({ ...p, ownerId: parseInt(v) }))}>
                        <SelectTrigger className="text-sm"><SelectValue placeholder="المالك" /></SelectTrigger>
                        <SelectContent>{owners.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="date" placeholder="تاريخ البداية" value={contractForm.startDate} onChange={e => setContractForm(p => ({ ...p, startDate: e.target.value }))} className="text-sm" />
                      <Input type="date" placeholder="تاريخ النهاية" value={contractForm.endDate} onChange={e => setContractForm(p => ({ ...p, endDate: e.target.value }))} className="text-sm" />
                      <Input placeholder="مبلغ الإيجار (ريال)" value={contractForm.rentAmount} onChange={e => setContractForm(p => ({ ...p, rentAmount: e.target.value }))} className="text-sm" />
                      <Select value={contractForm.paymentFrequency} onValueChange={v => setContractForm(p => ({ ...p, paymentFrequency: v as typeof p.paymentFrequency }))}>
                        <SelectTrigger className="text-sm"><SelectValue placeholder="دورة الدفع" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">شهري</SelectItem>
                          <SelectItem value="quarterly">ربع سنوي</SelectItem>
                          <SelectItem value="semi_annual">نصف سنوي</SelectItem>
                          <SelectItem value="annual">سنوي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button className="bg-amber-500 hover:bg-amber-600 text-sm" onClick={() => {
                        if (!contractForm.propertyId || !contractForm.startDate) return toast.error("يرجى ملء الحقول المطلوبة");
                        createContractMutation.mutate({ ...contractForm, rentAmount: contractForm.rentAmount || undefined, endDate: contractForm.endDate || undefined });
                      }} disabled={createContractMutation.isPending}>{createContractMutation.isPending ? "جاري..." : "إنشاء العقد"}</Button>
                      <Button variant="outline" className="text-sm" onClick={() => setShowAddContract(false)}>إلغاء</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>{["رقم العقد", "النوع", "المبلغ", "البداية", "النهاية", "الحالة", "متبقي"].map(h => (
                        <th key={h} className="text-right p-3 font-medium text-slate-600 text-xs">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {contracts.map(c => {
                        const remaining = daysUntil(c.endDate);
                        return (
                          <tr key={c.id} className={`hover:bg-slate-50 ${remaining >= 0 && remaining <= 30 ? "bg-red-50/50" : remaining <= 60 ? "bg-orange-50/50" : ""}`}>
                            <td className="p-3 font-mono text-xs">{c.contractNumber}</td>
                            <td className="p-3 text-xs">{c.type === "rent" ? "إيجار" : c.type === "sale" ? "بيع" : "إدارة"}</td>
                            <td className="p-3 text-amber-600 font-medium text-xs">{c.rentAmount ? formatCurrency(c.rentAmount) : c.salePrice ? formatCurrency(c.salePrice) : "—"}</td>
                            <td className="p-3 text-slate-500 text-xs">{formatDate(c.startDate)}</td>
                            <td className="p-3 text-slate-500 text-xs">{formatDate(c.endDate)}</td>
                            <td className="p-3"><Badge className={c.status === "active" ? "bg-green-100 text-green-700" : c.status === "expired" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}>{c.status === "active" ? "نشط" : c.status === "expired" ? "منتهي" : c.status}</Badge></td>
                            <td className="p-3 text-xs">{c.status === "active" && remaining >= 0 ? <span className={remaining <= 30 ? "text-red-600 font-bold" : remaining <= 60 ? "text-orange-600" : "text-slate-500"}>{remaining} يوم</span> : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {contracts.length === 0 && <p className="text-center text-slate-400 py-8">لا توجد عقود بعد</p>}
                </div>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              COLLECTION - جدول التحصيل الشهري
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "collection" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <Input type="month" value={collectionMonth} onChange={e => setCollectionMonth(e.target.value)} className="h-8 text-sm w-40" />
                  <p className="text-sm text-slate-500">{monthlyCollection.length} دفعة</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => exportToCSV(`collection-${collectionMonth}.csv`,
                    ["رقم", "النوع", "المبلغ", "الاستحقاق", "الحالة", "طريقة الدفع"],
                    monthlyCollection.map(p => [String(p.id), p.type, String(p.amount), formatDate(p.dueDate), p.status, p.paymentMethod || ""])
                  )}><Download size={14} className="ml-1" /> تصدير</Button>
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-xs" onClick={() => setShowAddPayment(!showAddPayment)}>
                    <Plus size={14} className="ml-1" /> دفعة جديدة
                  </Button>
                </div>
              </div>

              {/* Collection stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "إجمالي الشهر", value: collectionStats.total, color: "text-slate-800", bg: "bg-slate-50" },
                  { label: "تم التحصيل", value: collectionStats.collected, color: "text-green-600", bg: "bg-green-50" },
                  { label: "معلق", value: collectionStats.pending, color: "text-yellow-600", bg: "bg-yellow-50" },
                  { label: "متأخر", value: collectionStats.overdue, color: "text-red-600", bg: "bg-red-50" },
                  { label: "نسبة التحصيل", value: collectionStats.rate, color: "text-blue-600", bg: "bg-blue-50", isPercent: true },
                ].map((s, i) => (
                  <Card key={i} className="border-0 shadow-sm">
                    <CardContent className={`p-4 ${s.bg} rounded-lg`}>
                      <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                      <p className={`text-xl font-bold ${s.color}`}>{(s as any).isPercent ? `${s.value}%` : formatCurrency(s.value)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Progress value={collectionStats.rate} className="h-3" />

              {showAddPayment && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Select value={String(paymentForm.contractId)} onValueChange={v => setPaymentForm(p => ({ ...p, contractId: parseInt(v) }))}>
                        <SelectTrigger className="text-sm"><SelectValue placeholder="العقد" /></SelectTrigger>
                        <SelectContent>{contracts.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.contractNumber}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input placeholder="المبلغ *" value={paymentForm.amount} onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))} className="text-sm" />
                      <Input type="date" value={paymentForm.dueDate} onChange={e => setPaymentForm(p => ({ ...p, dueDate: e.target.value }))} className="text-sm" />
                      <Select value={paymentForm.type} onValueChange={v => setPaymentForm(p => ({ ...p, type: v as typeof p.type }))}>
                        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rent">إيجار</SelectItem>
                          <SelectItem value="deposit">وديعة</SelectItem>
                          <SelectItem value="management_fee">رسوم إدارة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input placeholder="ملاحظات" value={paymentForm.notes} onChange={e => setPaymentForm(p => ({ ...p, notes: e.target.value }))} className="text-sm mt-3" />
                    <div className="flex gap-2 mt-3">
                      <Button className="bg-amber-500 hover:bg-amber-600 text-sm" onClick={() => {
                        if (!paymentForm.contractId || !paymentForm.amount || !paymentForm.dueDate) return toast.error("يرجى ملء الحقول المطلوبة");
                        createPaymentMutation.mutate({ ...paymentForm, notes: paymentForm.notes || undefined });
                      }} disabled={createPaymentMutation.isPending}>{createPaymentMutation.isPending ? "جاري..." : "إضافة"}</Button>
                      <Button variant="outline" className="text-sm" onClick={() => setShowAddPayment(false)}>إلغاء</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>{["#", "النوع", "المبلغ", "الاستحقاق", "تاريخ الدفع", "الطريقة", "الحالة", "إجراء"].map(h => (
                        <th key={h} className="text-right p-3 font-medium text-slate-600 text-xs">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {monthlyCollection.map(p => (
                        <tr key={p.id} className={`hover:bg-slate-50 ${p.status === "overdue" ? "bg-red-50/50" : ""}`}>
                          <td className="p-3 text-xs font-mono">{p.id}</td>
                          <td className="p-3 text-xs">{p.type === "rent" ? "إيجار" : p.type === "deposit" ? "وديعة" : "رسوم إدارة"}</td>
                          <td className="p-3 font-medium text-amber-600">{formatCurrency(p.amount)}</td>
                          <td className="p-3 text-slate-500 text-xs">{formatDate(p.dueDate)}</td>
                          <td className="p-3 text-slate-500 text-xs">{p.paidDate ? formatDate(p.paidDate) : "—"}</td>
                          <td className="p-3 text-slate-500 text-xs">{PAYMENT_METHODS[p.paymentMethod || ""] || "—"}</td>
                          <td className="p-3">
                            <Badge className={p.status === "paid" ? "bg-green-100 text-green-700" : p.status === "overdue" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}>
                              {p.status === "paid" ? "مدفوع" : p.status === "overdue" ? "متأخر" : "معلق"}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {p.status !== "paid" && (
                              <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                onClick={() => markPaidMutation.mutate({ id: p.id, paymentMethod: "bank_transfer" })}>
                                <CheckCircle size={12} className="ml-1" /> تسجيل
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {monthlyCollection.length === 0 && <p className="text-center text-slate-400 py-8">لا توجد دفعات لهذا الشهر</p>}
                </div>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              PAYMENTS - الدفعات
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "payments" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{payments.length} دفعة • {overdue.length} متأخرة</p>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => exportToCSV("payments.csv",
                  ["النوع", "المبلغ", "الاستحقاق", "الدفع", "الطريقة", "الحالة"],
                  payments.map(p => [p.type, String(p.amount), formatDate(p.dueDate), p.paidDate ? formatDate(p.paidDate) : "", p.paymentMethod || "", p.status])
                )}><Download size={14} className="ml-1" /> تصدير</Button>
              </div>
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>{["النوع", "المبلغ", "الاستحقاق", "الدفع", "الطريقة", "الحالة", "إجراء"].map(h => (
                        <th key={h} className="text-right p-3 font-medium text-slate-600 text-xs">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map(p => (
                        <tr key={p.id} className={`hover:bg-slate-50 ${p.status === "overdue" ? "bg-red-50/50" : ""}`}>
                          <td className="p-3 text-xs">{p.type === "rent" ? "إيجار" : p.type === "deposit" ? "وديعة" : p.type === "management_fee" ? "رسوم إدارة" : p.type}</td>
                          <td className="p-3 font-medium text-amber-600">{formatCurrency(p.amount)}</td>
                          <td className="p-3 text-slate-500 text-xs">{formatDate(p.dueDate)}</td>
                          <td className="p-3 text-slate-500 text-xs">{p.paidDate ? formatDate(p.paidDate) : "—"}</td>
                          <td className="p-3 text-slate-500 text-xs">{PAYMENT_METHODS[p.paymentMethod || ""] || "—"}</td>
                          <td className="p-3">
                            <Badge className={p.status === "paid" ? "bg-green-100 text-green-700" : p.status === "overdue" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}>
                              {p.status === "paid" ? "مدفوع" : p.status === "overdue" ? "متأخر" : "معلق"}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {p.status !== "paid" && (
                              <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                onClick={() => markPaidMutation.mutate({ id: p.id, paymentMethod: "bank_transfer" })}>تسجيل دفع</Button>
                            )}
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

          {/* ══════════════════════════════════════════════════════════════════
              EXPENSES - المصاريف
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "expenses" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{expenses.length} مصروف</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => exportToCSV("expenses.csv",
                    ["الوصف", "الفئة", "المبلغ", "التاريخ", "دفع من"],
                    expenses.map(e => [e.description, EXPENSE_CATEGORIES[e.category] || e.category, String(e.amount), formatDate(e.expenseDate), e.paidBy])
                  )}><Download size={14} className="ml-1" /> تصدير</Button>
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-xs" onClick={() => setShowAddExpense(!showAddExpense)}>
                    <Plus size={14} className="ml-1" /> إضافة مصروف
                  </Button>
                </div>
              </div>
              {showAddExpense && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Input placeholder="الوصف *" value={expenseForm.description} onChange={e => setExpenseForm(p => ({ ...p, description: e.target.value }))} className="text-sm col-span-2" />
                      <Select value={expenseForm.category} onValueChange={v => setExpenseForm(p => ({ ...p, category: v as typeof p.category }))}>
                        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input placeholder="المبلغ *" value={expenseForm.amount} onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))} className="text-sm" />
                      <Select value={String(expenseForm.propertyId)} onValueChange={v => setExpenseForm(p => ({ ...p, propertyId: parseInt(v) }))}>
                        <SelectTrigger className="text-sm"><SelectValue placeholder="العقار (اختياري)" /></SelectTrigger>
                        <SelectContent>{properties.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.titleAr}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={expenseForm.paidBy} onValueChange={v => setExpenseForm(p => ({ ...p, paidBy: v }))}>
                        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="company">الشركة</SelectItem>
                          <SelectItem value="owner">المالك</SelectItem>
                          <SelectItem value="tenant">المستأجر</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button className="bg-amber-500 hover:bg-amber-600 text-sm" onClick={() => {
                        if (!expenseForm.description || !expenseForm.amount) return toast.error("يرجى ملء الحقول المطلوبة");
                        createExpenseMutation.mutate({ description: expenseForm.description, category: expenseForm.category, amount: expenseForm.amount, expenseDate: expenseForm.expenseDate, propertyId: expenseForm.propertyId ? Number(expenseForm.propertyId) : undefined, paidBy: expenseForm.paidBy as any });
                      }} disabled={createExpenseMutation.isPending}>{createExpenseMutation.isPending ? "جاري..." : "إضافة"}</Button>
                      <Button variant="outline" className="text-sm" onClick={() => setShowAddExpense(false)}>إلغاء</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
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
                          <td className="p-3 text-xs"><Badge variant="outline">{EXPENSE_CATEGORIES[e.category] || e.category}</Badge></td>
                          <td className="p-3 text-red-600 font-medium">{formatCurrency(e.amount)}</td>
                          <td className="p-3 text-slate-500 text-xs">{formatDate(e.expenseDate)}</td>
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

          {/* ══════════════════════════════════════════════════════════════════
              REPORTS - التقارير المالية
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "reports" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-700">التقارير المالية</h3>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                  const totalRevenue = payments.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount || 0), 0);
                  const totalExpenses2 = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
                  exportToCSV("financial-report.csv",
                    ["البند", "المبلغ (ريال)"],
                    [
                      ["إجمالي الإيرادات", String(totalRevenue)],
                      ["إجمالي المصاريف", String(totalExpenses2)],
                      ["صافي الربح", String(totalRevenue - totalExpenses2)],
                      ["عدد العقارات", String(properties.length)],
                      ["نسبة الإشغال", `${occupancyRate}%`],
                      ["عدد العقود النشطة", String(contracts.filter(c => c.status === "active").length)],
                      ["المتأخرات", String(overdue.reduce((s, p) => s + Number(p.amount || 0), 0))],
                    ]
                  );
                }}><Download size={14} className="ml-1" /> تصدير تقرير</Button>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-xs text-slate-500 mb-2">إجمالي الإيرادات المحصّلة</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(payments.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount || 0), 0))}</p>
                    <p className="text-xs text-slate-400 mt-1">{payments.filter(p => p.status === "paid").length} دفعة محصّلة</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-xs text-slate-500 mb-2">إجمالي المصاريف</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(expenses.reduce((s, e) => s + Number(e.amount || 0), 0))}</p>
                    <p className="text-xs text-slate-400 mt-1">{expenses.length} مصروف</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-xs text-slate-500 mb-2">إجمالي المتأخرات</p>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(overdue.reduce((s, p) => s + Number(p.amount || 0), 0))}</p>
                    <p className="text-xs text-slate-400 mt-1">{overdue.length} دفعة متأخرة</p>
                  </CardContent>
                </Card>
              </div>

              {/* Expense breakdown */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm">توزيع المصاريف حسب الفئة</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(EXPENSE_CATEGORIES).map(([cat, label]) => {
                      const catTotal = expenses.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount || 0), 0);
                      const totalExp = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
                      const pct = totalExp > 0 ? Math.round((catTotal / totalExp) * 100) : 0;
                      if (catTotal === 0) return null;
                      return (
                        <div key={cat}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600">{label}</span>
                            <span className="text-slate-800 font-medium">{formatCurrency(catTotal)} ({pct}%)</span>
                          </div>
                          <Progress value={pct} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Owner reports */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm">تقرير الملاك</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b">
                        <tr>{["المالك", "العقارات", "الإيرادات", "المصاريف", "رسوم الإدارة", "الصافي"].map(h => (
                          <th key={h} className="text-right p-3 font-medium text-slate-600 text-xs">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {owners.map(o => {
                          const ownerProps = properties.filter(p => p.ownerId === o.id);
                          const ownerRevenue = payments.filter(p => p.status === "paid" && ownerProps.some(op => contracts.some(c => c.propertyId === op.id && c.id === p.contractId))).reduce((s, p) => s + Number(p.amount || 0), 0);
                          const ownerExpenses = expenses.filter(e => ownerProps.some(op => op.id === e.propertyId)).reduce((s, e) => s + Number(e.amount || 0), 0);
                          const mgmtFee = o.managementFeeType === "percentage" ? ownerRevenue * (Number(o.managementFeeValue) / 100) : Number(o.managementFeeValue) * 12;
                          return (
                            <tr key={o.id} className="hover:bg-slate-50">
                              <td className="p-3 font-medium">{o.name}</td>
                              <td className="p-3 text-xs">{ownerProps.length}</td>
                              <td className="p-3 text-green-600 text-xs">{formatCurrency(ownerRevenue)}</td>
                              <td className="p-3 text-red-600 text-xs">{formatCurrency(ownerExpenses)}</td>
                              <td className="p-3 text-amber-600 text-xs">{formatCurrency(mgmtFee)}</td>
                              <td className="p-3 font-medium text-xs">{formatCurrency(ownerRevenue - ownerExpenses - mgmtFee)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              MAINTENANCE - الصيانة
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "maintenance" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-500">{maintenance.length} طلب</p>
                  <Badge className="bg-yellow-100 text-yellow-700 text-xs">{maintenance.filter(m => m.status === "open").length} معلق</Badge>
                  <Badge className="bg-blue-100 text-blue-700 text-xs">{maintenance.filter(m => m.status === "in_progress").length} جاري</Badge>
                </div>
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-xs" onClick={() => setShowAddMaintenance(!showAddMaintenance)}>
                  <Plus size={14} className="ml-1" /> طلب صيانة
                </Button>
              </div>
              {showAddMaintenance && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Input placeholder="عنوان الطلب *" value={maintenanceForm.title} onChange={e => setMaintenanceForm(p => ({ ...p, title: e.target.value }))} className="text-sm col-span-2" />
                      <Select value={String(maintenanceForm.propertyId)} onValueChange={v => setMaintenanceForm(p => ({ ...p, propertyId: parseInt(v) }))}>
                        <SelectTrigger className="text-sm"><SelectValue placeholder="العقار" /></SelectTrigger>
                        <SelectContent>{properties.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.titleAr}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={maintenanceForm.priority} onValueChange={v => setMaintenanceForm(p => ({ ...p, priority: v as typeof p.priority }))}>
                        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(PRIORITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                      
                    </div>
                    <textarea placeholder="وصف المشكلة" value={maintenanceForm.description} onChange={e => setMaintenanceForm(p => ({ ...p, description: e.target.value }))} className="w-full mt-3 p-2 border rounded-md text-sm resize-none h-16" />
                    <div className="flex gap-2 mt-3">
                      <Button className="bg-amber-500 hover:bg-amber-600 text-sm" onClick={() => {
                        if (!maintenanceForm.title) return toast.error("يرجى إدخال عنوان الطلب");
                        createMaintenanceMutation.mutate({ title: maintenanceForm.title, propertyId: maintenanceForm.propertyId || undefined, description: maintenanceForm.description || undefined, priority: maintenanceForm.priority || undefined });
                      }} disabled={createMaintenanceMutation.isPending}>{createMaintenanceMutation.isPending ? "جاري..." : "إضافة"}</Button>
                      <Button variant="outline" className="text-sm" onClick={() => setShowAddMaintenance(false)}>إلغاء</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {maintenance.map(m => (
                  <Card key={m.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm">{m.title}</h3>
                        <Badge className={PRIORITY_COLORS[m.priority || "medium"]}>{PRIORITY_LABELS[m.priority || "medium"]}</Badge>
                      </div>
                      {m.description && <p className="text-xs text-slate-500 mb-3">{m.description}</p>}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Select value={m.status || "pending"} onValueChange={v => updateMaintenanceMutation.mutate({ id: m.id, data: { status: v } })}>
                            <SelectTrigger className={`h-7 text-xs w-24 border-0 ${m.status === "completed" ? "bg-green-100 text-green-700" : m.status === "in_progress" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>{Object.entries(MAINTENANCE_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {m.cost && <span>التكلفة: {formatCurrency(m.cost)}</span>}
                          <span>{formatDate(m.createdAt)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {maintenance.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-slate-400">
                    <Wrench size={40} className="mx-auto mb-3 opacity-30" /><p>لا توجد طلبات صيانة</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              HANDOVER - محاضر التسليم
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "handover" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">محاضر تسليم واستلام العقارات</p>
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-xs" onClick={() => toast.info("قريباً: نموذج محضر تسليم إلكتروني")}>
                  <Plus size={14} className="ml-1" /> محضر جديد
                </Button>
              </div>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <ClipboardList size={48} className="mx-auto mb-4 text-slate-300" />
                  <h3 className="font-medium text-slate-600 mb-2">محاضر التسليم والاستلام</h3>
                  <p className="text-sm text-slate-400">سيتم إنشاء محضر تسليم إلكتروني عند تسليم أو استلام أي عقار. يشمل حالة العقار، قراءات العدادات، وتوقيع الأطراف.</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VACANCY - إدارة الشاغر
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "vacancy" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-slate-500">{vacantProperties.length} عقار شاغر من {properties.length}</p>
                  <Badge className="bg-amber-100 text-amber-700 text-xs">نسبة الإشغال: {occupancyRate}%</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-slate-800">{properties.length}</p>
                  <p className="text-xs text-slate-500 mt-1">إجمالي العقارات</p>
                </CardContent></Card>
                <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{occupiedProperties.length}</p>
                  <p className="text-xs text-slate-500 mt-1">مشغول</p>
                </CardContent></Card>
                <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-600">{vacantProperties.length}</p>
                  <p className="text-xs text-slate-500 mt-1">شاغر</p>
                </CardContent></Card>
                <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-red-600">{properties.filter((p: any) => p.status === "maintenance").length}</p>
                  <p className="text-xs text-slate-500 mt-1">تحت الصيانة</p>
                </CardContent></Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>

    {/* ─── PROPERTY ROI DIALOG ─────────────────────────────────────────── */}
    {propertyDetailId && (
      <PropertyROIDialog propertyId={propertyDetailId} onClose={() => setPropertyDetailId(null)} />
    )}
    </>
  );
}

// ─── PROPERTY ROI DIALOG ──────────────────────────────────────────────────────
function PropertyROIDialog({ propertyId, onClose }: { propertyId: number; onClose: () => void }) {
  const { data, isLoading } = trpc.analytics.propertyROI.useQuery(propertyId);
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose} dir="rtl">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">📊 تحليل العائد (ROI) - {data?.propertyTitle ?? "جاري التحميل..."}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold">×</button>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">جاري تحليل بيانات العقار...</div>
        ) : data ? (
          <div className="p-5 space-y-5">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-green-700">{data.totalRevenue.toLocaleString("ar-SA")} ر.س</div>
                <div className="text-xs text-gray-500 mt-1">إجمالي الإيرادات</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-red-700">{data.totalExpenses.toLocaleString("ar-SA")} ر.س</div>
                <div className="text-xs text-gray-500 mt-1">إجمالي المصاريف</div>
              </div>
              <div className={`rounded-lg p-3 text-center ${data.netProfit >= 0 ? "bg-blue-50" : "bg-orange-50"}`}>
                <div className={`text-xl font-bold ${data.netProfit >= 0 ? "text-blue-700" : "text-orange-700"}`}>{data.netProfit.toLocaleString("ar-SA")} ر.س</div>
                <div className="text-xs text-gray-500 mt-1">صافي الربح</div>
              </div>
              <div className={`rounded-lg p-3 text-center ${data.roi >= 5 ? "bg-emerald-50" : data.roi >= 0 ? "bg-yellow-50" : "bg-red-50"}`}>
                <div className={`text-2xl font-bold ${data.roi >= 5 ? "text-emerald-700" : data.roi >= 0 ? "text-yellow-700" : "text-red-700"}`}>{data.roi.toFixed(1)}%</div>
                <div className="text-xs text-gray-500 mt-1">نسبة العائد ROI</div>
              </div>
            </div>
            {/* ROI Gauge */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">مؤشر العائد</span>
                <span className="text-sm text-gray-500">معيار السوق: 6-8%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${data.roi >= 6 ? "bg-green-500" : data.roi >= 3 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(Math.max(data.roi, 0), 15) / 15 * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span><span>5%</span><span>10%</span><span>15%+</span>
              </div>
            </div>
            {/* Monthly Chart (simple bars) */}
            {data.monthlyData.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">الإيرادات والمصاريف الشهرية (12 شهر)</h3>
                <div className="flex items-end gap-1 h-24">
                  {data.monthlyData.map((m, i) => {
                    const maxVal = Math.max(...data.monthlyData.map(d => Math.max(d.revenue, d.expenses)), 1);
                    const revH = (m.revenue / maxVal) * 100;
                    const expH = (m.expenses / maxVal) * 100;
                    return (
                      <div key={i} className="flex-1 flex items-end gap-0.5" title={`${m.month}: إيراد ${m.revenue.toLocaleString()} | مصروف ${m.expenses.toLocaleString()}`}>
                        <div className="flex-1 bg-green-400 rounded-t" style={{ height: `${revH}%` }} />
                        <div className="flex-1 bg-red-400 rounded-t" style={{ height: `${expH}%` }} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded inline-block"></span>إيرادات</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded inline-block"></span>مصاريف</span>
                </div>
              </div>
            )}
            {/* Details */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-gray-600">سعر العقار</span><span className="font-medium">{data.propertyPrice.toLocaleString("ar-SA")} ر.س</span></div>
              <div className="flex justify-between"><span className="text-gray-600">تكاليف الصيانة</span><span className="font-medium text-orange-600">{data.maintenanceCosts.toLocaleString("ar-SA")} ر.س</span></div>
              <div className="flex justify-between border-t pt-2"><span className="font-semibold">صافي الربح</span><span className={`font-bold ${data.netProfit >= 0 ? "text-green-700" : "text-red-700"}`}>{data.netProfit.toLocaleString("ar-SA")} ر.س</span></div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">لا توجد بيانات كافية لهذا العقار</div>
        )}
      </div>
    </div>
  );
}
