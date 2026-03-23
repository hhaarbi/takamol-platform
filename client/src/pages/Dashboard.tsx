import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Users,
  Building2,
  MessageSquare,
  BarChart3,
  LogOut,
  Plus,
  Search,
  Download,
  Eye,
  Trash2,
  Edit,
  Phone,
  Star,
  Home,
  TrendingUp,
  Menu,
  X,
} from "lucide-react";

type Tab = "overview" | "leads" | "properties" | "chats";

const SERVICE_LABELS: Record<string, string> = {
  buy: "شراء عقار",
  sell: "بيع عقار",
  rent_looking: "البحث عن إيجار",
  rent_listing: "تأجير عقار",
  property_management: "إدارة أملاك",
  unknown: "غير محدد",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
  lost: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  qualified: "مؤهل",
  closed: "مغلق",
  lost: "خسارة",
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: "شقة",
  villa: "فيلا",
  land: "أرض",
  commercial: "تجاري",
  office: "مكتب",
  warehouse: "مستودع",
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<number | null>(null);
  const [selectedLeadSession, setSelectedLeadSession] = useState<string | null>(null);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [, navigate] = useLocation();

  const { user, loading, isAuthenticated } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  // Data queries
  const leadsQuery = trpc.leads.list.useQuery({
    search: searchQuery || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    serviceType: serviceFilter !== "all" ? serviceFilter : undefined,
    limit: 200,
  });

  const leadsCountQuery = trpc.leads.count.useQuery();

  const propertiesQuery = trpc.properties.list.useQuery({ limit: 100 });

  const chatHistoryQuery = trpc.leads.getChatHistory.useQuery(
    { sessionId: selectedLeadSession! },
    { enabled: !!selectedLeadSession }
  );

  const updateStatusMutation = trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      leadsQuery.refetch();
      toast.success("تم تحديث الحالة");
    },
  });

  const deletePropertyMutation = trpc.properties.delete.useMutation({
    onSuccess: () => {
      propertiesQuery.refetch();
      toast.success("تم حذف العقار");
    },
  });

  // Add property form state
  const [propertyForm, setPropertyForm] = useState({
    titleAr: "",
    title: "",
    type: "apartment" as const,
    listingType: "sale" as const,
    price: "",
    priceUnit: "total" as const,
    area: "",
    bedrooms: "",
    bathrooms: "",
    city: "المدينة المنورة",
    district: "",
    descriptionAr: "",
    featuresAr: "",
    negotiable: true,
    isFeatured: false,
    images: [] as string[],
  });

  const createPropertyMutation = trpc.properties.create.useMutation({
    onSuccess: () => {
      propertiesQuery.refetch();
      setShowAddProperty(false);
      toast.success("تم إضافة العقار بنجاح");
      setPropertyForm({
        titleAr: "",
        title: "",
        type: "apartment",
        listingType: "sale",
        price: "",
        priceUnit: "total",
        area: "",
        bedrooms: "",
        bathrooms: "",
        city: "المدينة المنورة",
        district: "",
        descriptionAr: "",
        featuresAr: "",
        negotiable: true,
        isFeatured: false,
        images: [],
      });
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadImageMutation = trpc.properties.uploadImage.useMutation();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1];
        try {
          const { url } = await uploadImageMutation.mutateAsync({
            base64,
            filename: file.name,
            mimeType: file.type,
          });
          setPropertyForm((prev) => ({ ...prev, images: [...prev.images, url] }));
          toast.success("تم رفع الصورة");
        } catch (e) {
          toast.error("فشل رفع الصورة");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProperty = () => {
    createPropertyMutation.mutate({
      ...propertyForm,
      title: propertyForm.titleAr,
      bedrooms: propertyForm.bedrooms ? parseInt(propertyForm.bedrooms) : undefined,
      bathrooms: propertyForm.bathrooms ? parseInt(propertyForm.bathrooms) : undefined,
      area: propertyForm.area || undefined,
      district: propertyForm.district || undefined,
      descriptionAr: propertyForm.descriptionAr || undefined,
      featuresAr: propertyForm.featuresAr
        ? propertyForm.featuresAr.split("\n").filter(Boolean)
        : [],
    });
  };

  const exportLeads = () => {
    const leads = leadsQuery.data || [];
    const csv = [
      ["الاسم", "الجوال", "الخدمة", "الميزانية", "المدينة", "الحالة", "التاريخ"].join(","),
      ...leads.map((l) =>
        [
          l.name || "",
          l.phone || "",
          SERVICE_LABELS[l.serviceType || "unknown"] || "",
          l.budget || "",
          l.preferredCity || "",
          STATUS_LABELS[l.status] || "",
          new Date(l.createdAt).toLocaleDateString("ar-SA"),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `عملاء-تكامل-${new Date().toLocaleDateString("ar-SA")}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const leads = leadsQuery.data || [];
  const properties = propertiesQuery.data || [];
  const totalLeads = leadsCountQuery.data || 0;
  const newLeads = leads.filter((l) => l.status === "new").length;
  const saleProps = properties.filter((p) => p.listingType === "sale").length;
  const rentProps = properties.filter((p) => p.listingType === "rent").length;

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "نظرة عامة", icon: <BarChart3 size={18} /> },
    { id: "leads", label: "العملاء", icon: <Users size={18} /> },
    { id: "properties", label: "العقارات", icon: <Building2 size={18} /> },
    { id: "chats", label: "المحادثات", icon: <MessageSquare size={18} /> },
  ];

  return (
    <div className="min-h-screen flex bg-background" dir="rtl">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-sidebar-foreground">تكامل</p>
              <p className="text-xs text-sidebar-foreground/60">لوحة التحكم</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.charAt(0) || "م"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-sidebar-foreground">{user?.name || "المالك"}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email || ""}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent"
            onClick={() => navigate("/")}
          >
            <Home size={14} className="ml-2" />
            الصفحة الرئيسية
          </Button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-muted"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="text-lg font-bold text-foreground">
            {navItems.find((n) => n.id === activeTab)?.label}
          </h1>
          <div className="flex items-center gap-2">
            {activeTab === "leads" && (
              <Button size="sm" variant="outline" onClick={exportLeads}>
                <Download size={14} className="ml-1" />
                تصدير
              </Button>
            )}
            {activeTab === "properties" && (
              <Button size="sm" className="gold-gradient text-white" onClick={() => setShowAddProperty(true)}>
                <Plus size={14} className="ml-1" />
                إضافة عقار
              </Button>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {/* ── Overview ── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "إجمالي العملاء", value: totalLeads, icon: <Users size={20} />, color: "text-blue-600" },
                  { label: "عملاء جدد", value: newLeads, icon: <TrendingUp size={20} />, color: "text-green-600" },
                  { label: "عقارات للبيع", value: saleProps, icon: <Building2 size={20} />, color: "text-amber-600" },
                  { label: "عقارات للإيجار", value: rentProps, icon: <Home size={20} />, color: "text-purple-600" },
                ].map((stat) => (
                  <Card key={stat.label} className="border-border">
                    <CardContent className="p-4">
                      <div className={`${stat.color} mb-2`}>{stat.icon}</div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent leads */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">آخر العملاء</CardTitle>
                </CardHeader>
                <CardContent>
                  {leads.slice(0, 5).length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">لا يوجد عملاء بعد</p>
                  ) : (
                    <div className="space-y-3">
                      {leads.slice(0, 5).map((lead) => (
                        <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium text-sm">{lead.name || "غير محدد"}</p>
                            <p className="text-xs text-muted-foreground">{SERVICE_LABELS[lead.serviceType || "unknown"]}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {lead.phone && (
                              <a href={`tel:${lead.phone}`} className="text-primary hover:underline text-xs">
                                {lead.phone}
                              </a>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[lead.status]}`}>
                              {STATUS_LABELS[lead.status]}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Service breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">توزيع الخدمات المطلوبة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(SERVICE_LABELS).map(([key, label]) => {
                      const count = leads.filter((l) => l.serviceType === key).length;
                      const pct = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
                      return (
                        <div key={key} className="p-3 rounded-lg border border-border">
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="text-xl font-bold text-foreground">{count}</p>
                          <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full gold-gradient rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Leads ── */}
          {activeTab === "leads" && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="بحث بالاسم أو الجوال..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الحالات</SelectItem>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={serviceFilter} onValueChange={setServiceFilter}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="الخدمة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الخدمات</SelectItem>
                    {Object.entries(SERVICE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-right p-3 font-medium text-muted-foreground">الاسم</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">الجوال</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">الخدمة</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">الميزانية</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">الحالة</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">التاريخ</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-muted-foreground">
                              لا يوجد عملاء
                            </td>
                          </tr>
                        ) : (
                          leads.map((lead) => (
                            <tr key={lead.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                              <td className="p-3 font-medium">{lead.name || "—"}</td>
                              <td className="p-3">
                                {lead.phone ? (
                                  <a
                                    href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-600 hover:underline flex items-center gap-1"
                                  >
                                    <Phone size={12} />
                                    {lead.phone}
                                  </a>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="p-3">
                                <Badge variant="secondary" className="text-xs">
                                  {SERVICE_LABELS[lead.serviceType || "unknown"]}
                                </Badge>
                              </td>
                              <td className="p-3 text-muted-foreground">{lead.budget || "—"}</td>
                              <td className="p-3">
                                <Select
                                  value={lead.status}
                                  onValueChange={(v) =>
                                    updateStatusMutation.mutate({ id: lead.id, status: v as any })
                                  }
                                >
                                  <SelectTrigger className={`h-7 text-xs w-28 ${STATUS_COLORS[lead.status]}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                      <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-3 text-muted-foreground text-xs">
                                {new Date(lead.createdAt).toLocaleDateString("ar-SA")}
                              </td>
                              <td className="p-3">
                                {lead.sessionId && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedLeadSession(lead.sessionId!);
                                      setActiveTab("chats");
                                    }}
                                  >
                                    <Eye size={14} />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Properties ── */}
          {activeTab === "properties" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Building2 size={40} className="mx-auto mb-3 opacity-30" />
                    <p>لا توجد عقارات. أضف عقاراً جديداً.</p>
                  </div>
                ) : (
                  properties.map((prop) => (
                    <Card key={prop.id} className="overflow-hidden border-border">
                      {(prop.images as string[])?.length > 0 ? (
                        <img
                          src={(prop.images as string[])[0]}
                          alt={prop.titleAr}
                          className="w-full h-40 object-cover"
                        />
                      ) : (
                        <div className="w-full h-40 bg-muted flex items-center justify-center">
                          <Building2 size={32} className="text-muted-foreground" />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm truncate">{prop.titleAr}</h3>
                            <p className="text-xs text-muted-foreground">{prop.city} {prop.district ? `- ${prop.district}` : ""}</p>
                          </div>
                          {prop.isFeatured && <Star size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />}
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Badge variant={prop.listingType === "sale" ? "default" : "secondary"} className="text-xs ml-1">
                              {prop.listingType === "sale" ? "للبيع" : "للإيجار"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {PROPERTY_TYPE_LABELS[prop.type]}
                            </Badge>
                          </div>
                          <p className="text-sm font-bold text-primary">
                            {Number(prop.price).toLocaleString("ar-SA")} ر.س
                          </p>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                            onClick={() => {
                              if (confirm("هل تريد حذف هذا العقار؟")) {
                                deletePropertyMutation.mutate({ id: prop.id });
                              }
                            }}
                          >
                            <Trash2 size={12} className="ml-1" />
                            حذف
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── Chats ── */}
          {activeTab === "chats" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
              {/* Lead list */}
              <Card className="overflow-hidden flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">العملاء</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-2 space-y-1">
                  {leads.filter((l) => l.sessionId).map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => setSelectedLeadSession(lead.sessionId!)}
                      className={`w-full text-right p-3 rounded-lg transition-colors ${
                        selectedLeadSession === lead.sessionId
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted"
                      }`}
                    >
                      <p className="font-medium text-sm">{lead.name || "غير محدد"}</p>
                      <p className="text-xs text-muted-foreground">{SERVICE_LABELS[lead.serviceType || "unknown"]}</p>
                      <p className="text-xs text-muted-foreground">{lead.phone || ""}</p>
                    </button>
                  ))}
                  {leads.filter((l) => l.sessionId).length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-4">لا توجد محادثات</p>
                  )}
                </CardContent>
              </Card>

              {/* Chat messages */}
              <Card className="lg:col-span-2 overflow-hidden flex flex-col">
                <CardHeader className="pb-2 border-b border-border">
                  <CardTitle className="text-sm">
                    {selectedLeadSession
                      ? `محادثة: ${leads.find((l) => l.sessionId === selectedLeadSession)?.name || "عميل"}`
                      : "اختر عميلاً لعرض المحادثة"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                  {!selectedLeadSession ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <MessageSquare size={40} className="opacity-30" />
                    </div>
                  ) : chatHistoryQuery.isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (chatHistoryQuery.data || []).length === 0 ? (
                    <p className="text-center text-muted-foreground">لا توجد رسائل</p>
                  ) : (
                    (chatHistoryQuery.data || []).map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                            msg.role === "user"
                              ? "gold-gradient text-white rounded-tr-sm"
                              : "bg-muted text-foreground rounded-tl-sm"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-xs mt-1 ${msg.role === "user" ? "text-white/70" : "text-muted-foreground"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Add Property Dialog */}
      <Dialog open={showAddProperty} onOpenChange={setShowAddProperty}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة عقار جديد</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>اسم العقار (عربي) *</Label>
              <Input
                value={propertyForm.titleAr}
                onChange={(e) => setPropertyForm((p) => ({ ...p, titleAr: e.target.value }))}
                placeholder="مثال: شقة فاخرة في حي العزيزية"
              />
            </div>
            <div>
              <Label>نوع العقار *</Label>
              <Select value={propertyForm.type} onValueChange={(v) => setPropertyForm((p) => ({ ...p, type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>نوع الإعلان *</Label>
              <Select value={propertyForm.listingType} onValueChange={(v) => setPropertyForm((p) => ({ ...p, listingType: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">للبيع</SelectItem>
                  <SelectItem value="rent">للإيجار</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>السعر (ريال) *</Label>
              <Input
                type="number"
                value={propertyForm.price}
                onChange={(e) => setPropertyForm((p) => ({ ...p, price: e.target.value }))}
                placeholder="500000"
              />
            </div>
            <div>
              <Label>وحدة السعر</Label>
              <Select value={propertyForm.priceUnit} onValueChange={(v) => setPropertyForm((p) => ({ ...p, priceUnit: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">إجمالي</SelectItem>
                  <SelectItem value="per_month">شهرياً</SelectItem>
                  <SelectItem value="per_year">سنوياً</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>المساحة (م²)</Label>
              <Input
                type="number"
                value={propertyForm.area}
                onChange={(e) => setPropertyForm((p) => ({ ...p, area: e.target.value }))}
                placeholder="150"
              />
            </div>
            <div>
              <Label>عدد الغرف</Label>
              <Input
                type="number"
                value={propertyForm.bedrooms}
                onChange={(e) => setPropertyForm((p) => ({ ...p, bedrooms: e.target.value }))}
                placeholder="3"
              />
            </div>
            <div>
              <Label>عدد الحمامات</Label>
              <Input
                type="number"
                value={propertyForm.bathrooms}
                onChange={(e) => setPropertyForm((p) => ({ ...p, bathrooms: e.target.value }))}
                placeholder="2"
              />
            </div>
            <div>
              <Label>المدينة</Label>
              <Input
                value={propertyForm.city}
                onChange={(e) => setPropertyForm((p) => ({ ...p, city: e.target.value }))}
              />
            </div>
            <div>
              <Label>الحي</Label>
              <Input
                value={propertyForm.district}
                onChange={(e) => setPropertyForm((p) => ({ ...p, district: e.target.value }))}
                placeholder="حي العزيزية"
              />
            </div>
            <div className="col-span-2">
              <Label>الوصف</Label>
              <Textarea
                value={propertyForm.descriptionAr}
                onChange={(e) => setPropertyForm((p) => ({ ...p, descriptionAr: e.target.value }))}
                placeholder="وصف تفصيلي للعقار..."
                rows={3}
              />
            </div>
            <div className="col-span-2">
              <Label>المميزات (سطر لكل ميزة)</Label>
              <Textarea
                value={propertyForm.featuresAr}
                onChange={(e) => setPropertyForm((p) => ({ ...p, featuresAr: e.target.value }))}
                placeholder="مسبح&#10;حديقة&#10;موقف سيارات&#10;مكيف مركزي"
                rows={3}
              />
            </div>
            <div className="col-span-2">
              <Label>صور العقار</Label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="block w-full text-sm text-muted-foreground file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90"
              />
              {propertyForm.images.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {propertyForm.images.map((url, i) => (
                    <img key={i} src={url} alt="" className="w-16 h-16 object-cover rounded-lg" />
                  ))}
                </div>
              )}
            </div>
            <div className="col-span-2 flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={propertyForm.negotiable}
                  onChange={(e) => setPropertyForm((p) => ({ ...p, negotiable: e.target.checked }))}
                />
                <span className="text-sm">قابل للتفاوض</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={propertyForm.isFeatured}
                  onChange={(e) => setPropertyForm((p) => ({ ...p, isFeatured: e.target.checked }))}
                />
                <span className="text-sm">عقار مميز</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button
              className="flex-1 gold-gradient text-white"
              onClick={handleAddProperty}
              disabled={createPropertyMutation.isPending || !propertyForm.titleAr || !propertyForm.price}
            >
              {createPropertyMutation.isPending ? "جاري الإضافة..." : "إضافة العقار"}
            </Button>
            <Button variant="outline" onClick={() => setShowAddProperty(false)}>إلغاء</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
