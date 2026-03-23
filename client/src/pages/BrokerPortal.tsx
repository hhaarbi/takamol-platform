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
import {
  Building2, TrendingUp, LogOut, Home, BarChart3, DollarSign,
  AlertCircle, Plus, X, Menu, Percent, Eye
} from "lucide-react";

const PROPERTY_TYPES: Record<string, string> = {
  apartment: "شقة", villa: "فيلا", land: "أرض", commercial: "تجاري",
  office: "مكتب", warehouse: "مستودع", building: "مبنى", farm: "مزرعة",
};

const NAV_ITEMS = [
  { id: "overview", label: "نظرة عامة", icon: BarChart3 },
  { id: "properties", label: "عقاراتي", icon: Building2 },
  { id: "commissions", label: "عمولاتي", icon: DollarSign },
];

export default function BrokerPortal() {
  const [, navigate] = useLocation();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAddProperty, setShowAddProperty] = useState(false);

  const profileQuery = trpc.brokers.myProfile.useQuery(undefined, { enabled: isAuthenticated && user?.role === "broker" });
  const propertiesQuery = trpc.properties.list.useQuery({ brokerId: profileQuery.data?.id }, { enabled: !!profileQuery.data?.id });
  const commissionsQuery = trpc.brokers.commissions.list.useQuery(profileQuery.data?.id, { enabled: !!profileQuery.data?.id });

  const broker = profileQuery.data;
  const properties = propertiesQuery.data || [];
  const commissions = commissionsQuery.data || [];

  const totalCommissions = commissions.filter(c => c.status === "paid").reduce((sum, c) => sum + Number(c.commissionAmount), 0);
  const pendingCommissions = commissions.filter(c => c.status === "pending").reduce((sum, c) => sum + Number(c.commissionAmount), 0);

  const defaultPropertyForm = {
    titleAr: "", type: "apartment" as const, listingType: "sale" as const,
    price: "", area: "", bedrooms: "", bathrooms: "", district: "", descriptionAr: "",
  };
  const [propertyForm, setPropertyForm] = useState(defaultPropertyForm);

  const createPropertyMutation = trpc.properties.create.useMutation({
    onSuccess: () => {
      propertiesQuery.refetch();
      toast.success("تم إضافة العقار بنجاح وسيتم مراجعته");
      setPropertyForm(defaultPropertyForm);
      setShowAddProperty(false);
    },
    onError: () => toast.error("حدث خطأ أثناء إضافة العقار"),
  });

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
          <h2 className="text-xl font-bold mb-2">بوابة الوسطاء</h2>
          <p className="text-slate-500 mb-2 text-sm">شركة تكامل لإدارة الأملاك</p>
          <p className="text-slate-400 mb-6 text-xs">يرجى تسجيل الدخول للوصول إلى حسابك</p>
          <Button className="w-full bg-amber-500 hover:bg-amber-600" onClick={() => window.location.href = getLoginUrl()}>
            تسجيل الدخول
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  if (user?.role !== "broker" && user?.role !== "admin") return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
      <Card className="w-full max-w-sm shadow-xl border-0">
        <CardContent className="p-8 text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2">غير مصرح</h2>
          <p className="text-slate-500 mb-6 text-sm">هذه البوابة مخصصة للوسطاء المعتمدين فقط</p>
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
              <p className="text-slate-400 text-xs">بوابة الوسطاء</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-slate-600 p-1">
            <Menu size={18} />
          </button>
        </div>
        {sidebarOpen && broker && (
          <div className="p-4 border-b border-slate-100 bg-amber-50">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-sm mb-2">
              {broker.name.charAt(0)}
            </div>
            <p className="font-semibold text-slate-800 text-sm">{broker.name}</p>
            <p className="text-xs text-slate-500">{broker.phone}</p>
            {broker.licenseNumber && (
              <p className="text-xs text-amber-600 mt-1">ترخيص: {broker.licenseNumber}</p>
            )}
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
                  { label: "عقارات نشطة", value: properties.filter(p => p.status === "available").length, icon: Eye, color: "text-green-600 bg-green-50" },
                  { label: "عمولات مستلمة", value: `${totalCommissions.toLocaleString("ar-SA")} ﷼`, icon: DollarSign, color: "text-blue-600 bg-blue-50" },
                  { label: "عمولات معلقة", value: `${pendingCommissions.toLocaleString("ar-SA")} ﷼`, icon: Percent, color: "text-orange-600 bg-orange-50" },
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

              {/* Commission rates */}
              {broker?.commissionRates && Object.keys(broker.commissionRates as object).length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Percent size={16} className="text-amber-500" />
                      نسب عمولتك على المنصة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(broker.commissionRates as Record<string, number>).map(([type, rate]) => (
                        <div key={type} className="bg-amber-50 rounded-xl p-3 text-center">
                          <p className="text-2xl font-bold text-amber-600">{rate}%</p>
                          <p className="text-xs text-slate-600 mt-1">{PROPERTY_TYPES[type] || type}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-3">* النسب محددة من قبل إدارة تكامل وتُطبق على كل صفقة ناجحة</p>
                  </CardContent>
                </Card>
              )}

              {/* Quick add */}
              <Card className="border-0 shadow-sm border-dashed border-2 border-amber-200 bg-amber-50/50">
                <CardContent className="p-6 text-center">
                  <Building2 size={32} className="mx-auto mb-3 text-amber-400" />
                  <h3 className="font-semibold text-slate-700 mb-1">أضف عقاراً جديداً</h3>
                  <p className="text-xs text-slate-500 mb-4">سوّق عقاراتك عبر منصة تكامل واحصل على عمولتك</p>
                  <Button className="bg-amber-500 hover:bg-amber-600 text-sm" onClick={() => { setActiveTab("properties"); setShowAddProperty(true); }}>
                    <Plus size={16} className="ml-1" /> إضافة عقار
                  </Button>
                </CardContent>
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
                <Card className="border-0 shadow-sm border-amber-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      إضافة عقار جديد للتسويق
                      <button onClick={() => setShowAddProperty(false)}><X size={16} /></button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-amber-50 rounded-lg p-3 mb-4 text-xs text-amber-700">
                      <strong>ملاحظة:</strong> سيتم مراجعة العقار من قبل فريق تكامل قبل نشره. ستُطبق نسبة العمولة المتفق عليها عند إتمام الصفقة.
                    </div>
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
                        </SelectContent>
                      </Select>
                      <Input placeholder="السعر المطلوب (ريال) *" value={propertyForm.price} onChange={e => setPropertyForm(p => ({ ...p, price: e.target.value }))} className="text-sm" />
                      <Input placeholder="المساحة (م²)" value={propertyForm.area} onChange={e => setPropertyForm(p => ({ ...p, area: e.target.value }))} className="text-sm" />
                      <Input placeholder="الحي / الموقع" value={propertyForm.district} onChange={e => setPropertyForm(p => ({ ...p, district: e.target.value }))} className="text-sm" />
                      <Input placeholder="غرف النوم" type="number" value={propertyForm.bedrooms} onChange={e => setPropertyForm(p => ({ ...p, bedrooms: e.target.value }))} className="text-sm" />
                      <Input placeholder="دورات المياه" type="number" value={propertyForm.bathrooms} onChange={e => setPropertyForm(p => ({ ...p, bathrooms: e.target.value }))} className="text-sm" />
                    </div>
                    <textarea placeholder="وصف العقار (اختياري)" value={propertyForm.descriptionAr} onChange={e => setPropertyForm(p => ({ ...p, descriptionAr: e.target.value }))} className="w-full mt-3 p-2 border rounded-md text-sm resize-none h-20" />

                    {/* Commission preview */}
                    {propertyForm.price && broker?.commissionRates && (broker.commissionRates as Record<string, number>)[propertyForm.type] && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm">
                        <p className="text-green-700 font-medium">
                          عمولتك المتوقعة: {((broker.commissionRates as Record<string, number>)[propertyForm.type] / 100 * Number(propertyForm.price)).toLocaleString("ar-SA")} ﷼
                          <span className="text-green-500 text-xs mr-2">({(broker.commissionRates as Record<string, number>)[propertyForm.type]}% من السعر)</span>
                        </p>
                      </div>
                    )}

                    <Button className="mt-3 bg-amber-500 hover:bg-amber-600 text-sm" onClick={() => {
                      if (!propertyForm.titleAr || !propertyForm.price) return toast.error("يرجى ملء الحقول المطلوبة");
                      createPropertyMutation.mutate({
                        ...propertyForm,
                        brokerId: broker?.id,
                        bedrooms: propertyForm.bedrooms ? parseInt(propertyForm.bedrooms) : undefined,
                        bathrooms: propertyForm.bathrooms ? parseInt(propertyForm.bathrooms) : undefined,
                        area: propertyForm.area || undefined,
                        district: propertyForm.district || undefined,
                        descriptionAr: propertyForm.descriptionAr || undefined,
                        features: [],
                        source: "broker",
                      });
                    }} disabled={createPropertyMutation.isPending}>
                      {createPropertyMutation.isPending ? "جاري الإرسال..." : "إرسال للمراجعة"}
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
                          <p className="text-xs text-slate-500">{prop.city}{prop.district ? ` • ${prop.district}` : ""}</p>
                        </div>
                        <Badge className={prop.status === "available" ? "bg-green-100 text-green-700" : prop.status === "sold" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}>
                          {prop.status === "available" ? "نشط" : prop.status === "sold" ? "مباع" : prop.status === "rented" ? "مؤجر" : "معلق"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-3">
                        <span>🏠 {PROPERTY_TYPES[prop.type] || prop.type}</span>
                        {prop.area && <span>📐 {prop.area} م²</span>}
                        {prop.bedrooms && <span>🛏 {prop.bedrooms} غرف</span>}
                        <span>{prop.listingType === "sale" ? "🔑 للبيع" : "🏠 للإيجار"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-600">{Number(prop.price).toLocaleString("ar-SA")} ﷼</span>
                        {broker?.commissionRates && (broker.commissionRates as Record<string, number>)[prop.type] && (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            عمولة {(broker.commissionRates as Record<string, number>)[prop.type]}%
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {properties.length === 0 && (
                  <div className="col-span-3 text-center py-12 text-slate-400">
                    <Building2 size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="mb-3">لم تضف أي عقارات بعد</p>
                    <Button size="sm" className="bg-amber-500 hover:bg-amber-600" onClick={() => setShowAddProperty(true)}>
                      <Plus size={14} className="ml-1" /> أضف أول عقار
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Commissions ── */}
          {activeTab === "commissions" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card className="border-0 shadow-sm bg-green-50">
                  <CardContent className="p-4">
                    <p className="text-2xl font-bold text-green-600">{totalCommissions.toLocaleString("ar-SA")} ﷼</p>
                    <p className="text-xs text-slate-600 mt-1">إجمالي العمولات المستلمة</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-orange-50">
                  <CardContent className="p-4">
                    <p className="text-2xl font-bold text-orange-600">{pendingCommissions.toLocaleString("ar-SA")} ﷼</p>
                    <p className="text-xs text-slate-600 mt-1">عمولات معلقة</p>
                  </CardContent>
                </Card>
              </div>
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>{["الوصف", "النسبة", "المبلغ", "التاريخ", "الحالة"].map(h => (
                        <th key={h} className="text-right p-3 font-medium text-slate-600 text-xs">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {commissions.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="p-3 text-sm">{c.notes || `عمولة #${c.id}`}</td>
                          <td className="p-3 text-xs text-amber-600">{c.commissionRate}%</td>
                          <td className="p-3 font-medium text-green-600">{Number(c.commissionAmount).toLocaleString("ar-SA")} ﷼</td>
                          <td className="p-3 text-slate-500 text-xs">{new Date(c.createdAt).toLocaleDateString("ar-SA")}</td>
                          <td className="p-3">
                            <Badge className={c.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                              {c.status === "paid" ? "مستلمة" : "معلقة"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {commissions.length === 0 && <p className="text-center text-slate-400 py-8">لا توجد عمولات بعد</p>}
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
