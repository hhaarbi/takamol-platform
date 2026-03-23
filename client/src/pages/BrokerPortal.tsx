import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Building2, TrendingUp, LogOut, Home, BarChart3, DollarSign,
  AlertCircle, Plus, Menu, X, Percent, Eye, Star, Award,
  CheckCircle, Clock
} from "lucide-react";

const PROPERTY_TYPES: Record<string, string> = {
  apartment: "شقة", villa: "فيلا", land: "أرض", commercial: "تجاري",
  office: "مكتب", warehouse: "مستودع", building: "عمارة", farm: "مزرعة",
};
const LISTING_TYPES: Record<string, string> = { sale: "بيع", rent: "إيجار" };

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(amount);
}
function formatDate(date: string | Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("ar-SA", { year: "numeric", month: "short", day: "numeric" }).format(new Date(date));
}

const NAV_ITEMS = [
  { id: "overview", label: "نظرة عامة", icon: BarChart3 },
  { id: "listings", label: "عقاراتي", icon: Building2 },
  { id: "add", label: "إضافة عقار", icon: Plus },
  { id: "commissions", label: "العمولات", icon: DollarSign },
  { id: "performance", label: "الأداء", icon: TrendingUp },
];

export default function BrokerPortal() {
  const [, navigate] = useLocation();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [propertyForm, setPropertyForm] = useState({
    titleAr: "", type: "apartment", listingType: "sale", price: "",
    area: "", bedrooms: "", bathrooms: "", district: "", city: "المدينة المنورة",
    description: "", features: ""
  });

  const profileQuery = trpc.brokers.myProfile.useQuery(undefined, { enabled: isAuthenticated && user?.role === "broker" });
  const myListingsQuery = trpc.properties.list.useQuery({ brokerId: profileQuery.data?.id } as any, { enabled: !!profileQuery.data?.id });
  const commissionsQuery = trpc.brokers.commissions.list.useQuery(profileQuery.data?.id ?? 0, { enabled: !!profileQuery.data?.id });
  const createPropertyMutation = trpc.properties.create.useMutation({
    onSuccess: () => { myListingsQuery.refetch(); toast.success("تم إضافة العقار بنجاح"); setActiveTab("listings"); setPropertyForm({ titleAr: "", type: "apartment", listingType: "sale", price: "", area: "", bedrooms: "", bathrooms: "", district: "", city: "المدينة المنورة", description: "", features: "" }); },
    onError: () => toast.error("حدث خطأ أثناء إضافة العقار")
  });

  const broker = profileQuery.data;
  const listings = myListingsQuery.data || [];
  const commissions = (commissionsQuery.data || []) as any[];
  const totalCommissions = commissions.reduce((sum: number, c: any) => sum + Number(c.commissionAmount || 0), 0);
  const paidCommissions = commissions.filter((c: any) => c.status === "paid").reduce((sum: number, c: any) => sum + Number(c.commissionAmount || 0), 0);
  const pendingCommissions = commissions.filter((c: any) => c.status === "pending").reduce((sum: number, c: any) => sum + Number(c.commissionAmount || 0), 0);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600">جاري التحميل...</p>
      </div>
    </div>
  );

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50">
      <Card className="w-96 border-0 shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="text-teal-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">بوابة الوسيط</h2>
          <p className="text-slate-500 mb-6 text-sm">سجّل دخولك لإدارة عقاراتك وعمولاتك</p>
          <Button className="w-full bg-teal-500 hover:bg-teal-600" onClick={() => window.location.href = getLoginUrl()}>تسجيل الدخول</Button>
        </CardContent>
      </Card>
    </div>
  );

  if (user?.role !== "broker" && user?.role !== "admin") return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-96 border-0 shadow-xl">
        <CardContent className="p-8 text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-slate-800 mb-2">غير مصرّح</h2>
          <p className="text-slate-500 mb-6 text-sm">هذه البوابة مخصصة للوسطاء المعتمدين فقط</p>
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
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold">
              {broker?.name?.charAt(0) || "و"}
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">{broker?.name || "الوسيط"}</p>
              <p className="text-xs text-slate-400">وسيط عقاري {broker?.falLicenseNumber ? `· فال: ${broker.falLicenseNumber}` : ""}</p>
            </div>
          </div>
          {broker?.commissionRates && (
            <div className="mt-3 p-2 bg-teal-50 rounded-lg">
              <p className="text-xs text-teal-600 flex items-center gap-1"><Percent size={12} /> نسبة العمولة: <span className="font-bold">{((broker.commissionRates as any)?.default || 0)}%</span></p>
            </div>
          )}
        </div>
        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${activeTab === item.id ? "bg-teal-50 text-teal-700 font-semibold shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}>
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
          <Badge className="bg-teal-100 text-teal-700 text-xs">{listings.length} عقار</Badge>
        </header>

        <div className="p-6">
          {/* ─── OVERVIEW ─── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm"><CardContent className="p-4"><Building2 className="text-teal-500 mb-2" size={20} /><p className="text-2xl font-bold text-slate-800">{listings.length}</p><p className="text-xs text-slate-500">عقاراتي</p></CardContent></Card>
                <Card className="border-0 shadow-sm"><CardContent className="p-4"><DollarSign className="text-green-500 mb-2" size={20} /><p className="text-2xl font-bold text-slate-800">{formatCurrency(totalCommissions)}</p><p className="text-xs text-slate-500">إجمالي العمولات</p></CardContent></Card>
                <Card className="border-0 shadow-sm"><CardContent className="p-4"><CheckCircle className="text-green-500 mb-2" size={20} /><p className="text-2xl font-bold text-slate-800">{formatCurrency(paidCommissions)}</p><p className="text-xs text-slate-500">مدفوع</p></CardContent></Card>
                <Card className="border-0 shadow-sm"><CardContent className="p-4"><Clock className="text-yellow-500 mb-2" size={20} /><p className="text-2xl font-bold text-slate-800">{formatCurrency(pendingCommissions)}</p><p className="text-xs text-slate-500">معلق</p></CardContent></Card>
              </div>

              {broker?.commissionRates && (
                <Card className="border-0 shadow-sm bg-gradient-to-l from-teal-50 to-white">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3"><Award className="text-teal-500" size={24} /><h3 className="font-bold text-slate-800">نسبة عمولتك</h3></div>
                    <p className="text-3xl font-bold text-teal-600 mb-1">{((broker.commissionRates as any)?.default || 0)}%</p>
                    <p className="text-xs text-slate-500">تُحسب تلقائياً على كل عقار تبيعه أو تؤجره عبر المنصة. نسبة تكامل تظهر لك على كل عرض.</p>
                  </CardContent>
                </Card>
              )}

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm text-slate-600">آخر العقارات</CardTitle>
                  <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-xs" onClick={() => setActiveTab("add")}><Plus size={14} className="ml-1" /> إضافة عقار</Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {listings.slice(0, 5).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50">
                        <div><p className="text-sm font-medium text-slate-700">{p.titleAr}</p><p className="text-xs text-slate-400">{PROPERTY_TYPES[p.type] || p.type} · {p.district || "المدينة المنورة"}</p></div>
                        <div className="text-left"><p className="text-sm font-bold text-slate-800">{formatCurrency(Number(p.price || 0))}</p><Badge className="text-xs bg-teal-100 text-teal-700">{LISTING_TYPES[p.listingType] || p.listingType}</Badge></div>
                      </div>
                    ))}
                    {listings.length === 0 && <p className="text-center text-sm text-slate-400 py-6">لم تضف أي عقارات بعد</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── LISTINGS ─── */}
          {activeTab === "listings" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-teal-100 text-teal-700">{listings.filter((l: any) => l.listingType === "sale").length} بيع</Badge>
                  <Badge className="bg-blue-100 text-blue-700">{listings.filter((l: any) => l.listingType === "rent").length} إيجار</Badge>
                </div>
                <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-xs" onClick={() => setActiveTab("add")}><Plus size={14} className="ml-1" /> إضافة</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {listings.map((p: any) => (
                  <Card key={p.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div><h3 className="font-bold text-slate-800">{p.titleAr}</h3><p className="text-xs text-slate-400">{PROPERTY_TYPES[p.type] || p.type} · {p.district || "المدينة المنورة"}</p></div>
                        <Badge className={p.status === "available" ? "bg-green-100 text-green-700" : p.status === "rented" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}>
                          {p.status === "available" ? "متاح" : p.status === "rented" ? "مؤجر" : p.status === "sold" ? "مباع" : p.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center mb-3">
                        <div className="p-2 bg-slate-50 rounded-lg"><p className="text-xs text-slate-400">السعر</p><p className="text-sm font-bold text-slate-700">{formatCurrency(Number(p.price || 0))}</p></div>
                        <div className="p-2 bg-slate-50 rounded-lg"><p className="text-xs text-slate-400">المساحة</p><p className="text-sm font-bold text-slate-700">{p.area || "—"} م²</p></div>
                        <div className="p-2 bg-slate-50 rounded-lg"><p className="text-xs text-slate-400">الغرف</p><p className="text-sm font-bold text-slate-700">{p.bedrooms || "—"}</p></div>
                      </div>
                      {broker?.commissionRates && (
                        <div className="p-2 bg-amber-50 rounded-lg flex items-center justify-between">
                          <span className="text-xs text-amber-600">عمولة تكامل</span>
                          <span className="text-sm font-bold text-amber-700">{formatCurrency(Number(p.price || 0) * Number(((broker.commissionRates as any)?.default || 0)) / 100)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              {listings.length === 0 && (
                <Card className="border-0 shadow-sm"><CardContent className="p-12 text-center"><Building2 className="text-slate-300 mx-auto mb-3" size={48} /><p className="text-slate-400 mb-4">لم تضف أي عقارات بعد</p><Button className="bg-teal-500 hover:bg-teal-600" onClick={() => setActiveTab("add")}><Plus size={16} className="ml-1" /> إضافة أول عقار</Button></CardContent></Card>
              )}
            </div>
          )}

          {/* ─── ADD PROPERTY ─── */}
          {activeTab === "add" && (
            <Card className="border-0 shadow-sm max-w-2xl mx-auto">
              <CardHeader><CardTitle className="text-lg text-slate-800">إضافة عقار جديد</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><label className="text-sm text-slate-600 mb-1 block">اسم العقار *</label><Input placeholder="مثال: شقة فاخرة في حي الروضة" value={propertyForm.titleAr} onChange={e => setPropertyForm(p => ({ ...p, titleAr: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm text-slate-600 mb-1 block">نوع العقار *</label><Select value={propertyForm.type} onValueChange={(v: string) => setPropertyForm(p => ({ ...p, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(PROPERTY_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                  <div><label className="text-sm text-slate-600 mb-1 block">نوع العرض *</label><Select value={propertyForm.listingType} onValueChange={(v: string) => setPropertyForm(p => ({ ...p, listingType: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(LISTING_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm text-slate-600 mb-1 block">السعر (ريال) *</label><Input type="number" placeholder="500000" value={propertyForm.price} onChange={e => setPropertyForm(p => ({ ...p, price: e.target.value }))} /></div>
                  <div><label className="text-sm text-slate-600 mb-1 block">المساحة (م²)</label><Input type="number" placeholder="150" value={propertyForm.area} onChange={e => setPropertyForm(p => ({ ...p, area: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm text-slate-600 mb-1 block">غرف النوم</label><Input type="number" placeholder="3" value={propertyForm.bedrooms} onChange={e => setPropertyForm(p => ({ ...p, bedrooms: e.target.value }))} /></div>
                  <div><label className="text-sm text-slate-600 mb-1 block">دورات المياه</label><Input type="number" placeholder="2" value={propertyForm.bathrooms} onChange={e => setPropertyForm(p => ({ ...p, bathrooms: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm text-slate-600 mb-1 block">الحي</label><Input placeholder="حي الروضة" value={propertyForm.district} onChange={e => setPropertyForm(p => ({ ...p, district: e.target.value }))} /></div>
                  <div><label className="text-sm text-slate-600 mb-1 block">المدينة</label><Input value={propertyForm.city} onChange={e => setPropertyForm(p => ({ ...p, city: e.target.value }))} /></div>
                </div>
                <div><label className="text-sm text-slate-600 mb-1 block">الوصف</label><textarea className="w-full border rounded-lg p-3 text-sm min-h-[80px] focus:ring-2 focus:ring-teal-500 focus:border-teal-500" placeholder="وصف تفصيلي للعقار..." value={propertyForm.description} onChange={e => setPropertyForm(p => ({ ...p, description: e.target.value }))} /></div>
                <div><label className="text-sm text-slate-600 mb-1 block">المميزات (مفصولة بفاصلة)</label><Input placeholder="مصعد, موقف سيارات, حديقة" value={propertyForm.features} onChange={e => setPropertyForm(p => ({ ...p, features: e.target.value }))} /></div>

                {broker?.commissionRates && propertyForm.price && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div><p className="text-sm font-medium text-amber-700">عمولة تكامل على هذا العقار</p><p className="text-xs text-amber-500">نسبة {((broker.commissionRates as any)?.default || 0)}% من سعر العقار</p></div>
                      <p className="text-xl font-bold text-amber-700">{formatCurrency(Number(propertyForm.price) * Number(((broker.commissionRates as any)?.default || 0)) / 100)}</p>
                    </div>
                  </div>
                )}

                <Button className="bg-teal-500 hover:bg-teal-600 w-full" onClick={() => {
                  if (!propertyForm.titleAr || !propertyForm.price) return toast.error("يرجى ملء الحقول المطلوبة");
                  createPropertyMutation.mutate({
                    titleAr: propertyForm.titleAr, type: propertyForm.type as any, listingType: propertyForm.listingType as any,
                    price: propertyForm.price, area: propertyForm.area || undefined, bedrooms: propertyForm.bedrooms ? Number(propertyForm.bedrooms) : undefined,
                    bathrooms: propertyForm.bathrooms ? Number(propertyForm.bathrooms) : undefined, district: propertyForm.district || undefined,
                    city: propertyForm.city, descriptionAr: propertyForm.description || undefined,
                    features: propertyForm.features ? propertyForm.features.split(",").map(f => f.trim()) : undefined,
                  });
                }} disabled={createPropertyMutation.isPending}>
                  {createPropertyMutation.isPending ? "جاري الإضافة..." : "إضافة العقار"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ─── COMMISSIONS ─── */}
          {activeTab === "commissions" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-xs text-teal-600">إجمالي</p><p className="text-xl font-bold text-teal-700">{formatCurrency(totalCommissions)}</p></CardContent></Card>
                <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-xs text-green-600">مدفوع</p><p className="text-xl font-bold text-green-700">{formatCurrency(paidCommissions)}</p></CardContent></Card>
                <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-xs text-yellow-600">معلق</p><p className="text-xl font-bold text-yellow-700">{formatCurrency(pendingCommissions)}</p></CardContent></Card>
              </div>
              {commissions.map((c: any) => (
                <Card key={c.id} className="border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div><p className="text-sm font-medium text-slate-700">عمولة #{c.id}</p><p className="text-xs text-slate-400">{c.notes || "عمولة تسويق عقاري"} · {formatDate(c.createdAt)}</p></div>
                    <div className="flex items-center gap-3">
                      <Badge className={c.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>{c.status === "paid" ? "مدفوع" : "معلق"}</Badge>
                      <span className="text-sm font-bold text-slate-800">{formatCurrency(Number(c.commissionAmount || 0))}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {commissions.length === 0 && (
                <Card className="border-0 shadow-sm"><CardContent className="p-12 text-center"><DollarSign className="text-slate-300 mx-auto mb-3" size={48} /><p className="text-slate-400">لا توجد عمولات حالياً</p></CardContent></Card>
              )}
            </div>
          )}

          {/* ─── PERFORMANCE ─── */}
          {activeTab === "performance" && (
            <div className="space-y-6">
              <Card className="border-0 shadow-sm bg-gradient-to-l from-teal-50 to-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center"><Star className="text-teal-600" size={32} /></div>
                    <div><h2 className="text-xl font-bold text-slate-800">{broker?.name || "الوسيط"}</h2><p className="text-sm text-slate-500">وسيط عقاري معتمد {broker?.falLicenseNumber ? `· رخصة فال: ${broker.falLicenseNumber}` : ""}</p></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-white rounded-xl text-center shadow-sm"><p className="text-2xl font-bold text-teal-600">{listings.length}</p><p className="text-xs text-slate-500">عقار مسجّل</p></div>
                    <div className="p-3 bg-white rounded-xl text-center shadow-sm"><p className="text-2xl font-bold text-green-600">{listings.filter((l: any) => l.status === "sold" || l.status === "rented").length}</p><p className="text-xs text-slate-500">صفقة مكتملة</p></div>
                    <div className="p-3 bg-white rounded-xl text-center shadow-sm"><p className="text-2xl font-bold text-amber-600">{formatCurrency(totalCommissions)}</p><p className="text-xs text-slate-500">إجمالي العمولات</p></div>
                    <div className="p-3 bg-white rounded-xl text-center shadow-sm"><p className="text-2xl font-bold text-blue-600">{((broker?.commissionRates as any)?.default || 0)}%</p><p className="text-xs text-slate-500">نسبة العمولة</p></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-sm text-slate-600">ملخص العقارات حسب النوع</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(PROPERTY_TYPES).map(([key, label]) => {
                      const count = listings.filter((l: any) => l.type === key).length;
                      if (count === 0) return null;
                      return (<div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"><span className="text-sm text-slate-700">{label}</span><Badge className="bg-teal-100 text-teal-700">{count}</Badge></div>);
                    })}
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
