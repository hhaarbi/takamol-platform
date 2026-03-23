import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Home, FileText, CreditCard, Wrench, AlertCircle, CheckCircle, Clock,
  Phone, Building2, KeyRound, MessageCircle, ArrowLeft, Search,
  Calendar, MapPin, User, BanknoteIcon, Shield, Star, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

const WHATSAPP = "966558018151";

function formatDate(ts: number | string | Date | null | undefined) {
  if (!ts) return "—";
  const d = ts instanceof Date ? ts : new Date(Number(ts));
  return d.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
}

function formatAmount(amount: number | string) {
  return Number(amount).toLocaleString("ar-SA");
}

export default function TenantPortal() {
  const [contractCode, setContractCode] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState<{
    title: string; description: string; priority: "low" | "medium" | "high" | "urgent";
  }>({ title: "", description: "", priority: "medium" });

  const { data, isLoading, error } = trpc.tenantPortal.getByContract.useQuery(
    { contractCode: searchCode },
    { enabled: !!searchCode }
  );

  const submitMaintenance = trpc.tenantPortal.submitMaintenance.useMutation({
    onSuccess: () => {
      toast.success("✅ تم إرسال طلب الصيانة بنجاح");
      setMaintenanceOpen(false);
      setMaintenanceForm({ title: "", description: "", priority: "medium" });
    },
    onError: () => toast.error("خطأ في إرسال الطلب، حاول مرة أخرى"),
  });

  const handleSearch = () => {
    if (contractCode.trim()) setSearchCode(contractCode.trim());
  };

  const paymentStatusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    paid: { label: "مدفوع", color: "bg-green-100 text-green-700 border-green-200", icon: <CheckCircle size={13} /> },
    pending: { label: "معلق", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: <Clock size={13} /> },
    overdue: { label: "متأخر", color: "bg-red-100 text-red-700 border-red-200", icon: <AlertCircle size={13} /> },
    partial: { label: "جزئي", color: "bg-blue-100 text-blue-700 border-blue-200", icon: <BanknoteIcon size={13} /> },
  };

  const maintenanceStatusMap: Record<string, { label: string; color: string }> = {
    open: { label: "مفتوح", color: "bg-blue-100 text-blue-700" },
    in_progress: { label: "قيد التنفيذ", color: "bg-amber-100 text-amber-700" },
    completed: { label: "مكتمل", color: "bg-green-100 text-green-700" },
    cancelled: { label: "ملغي", color: "bg-gray-100 text-gray-600" },
  };

  const priorityMap: Record<string, { label: string; color: string }> = {
    low: { label: "منخفضة", color: "text-gray-500" },
    medium: { label: "متوسطة", color: "text-amber-600" },
    high: { label: "عالية", color: "text-orange-600" },
    urgent: { label: "عاجلة", color: "text-red-600" },
  };

  const paidCount = data?.payments.filter(p => p.status === "paid").length ?? 0;
  const overdueCount = data?.payments.filter(p => p.status === "overdue").length ?? 0;
  const totalPaid = data?.payments.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0) ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" dir="rtl">

      {/* ─── Header ─── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-700/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 py-10 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back link */}
            <a href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 text-sm mb-6 transition-colors">
              <ArrowLeft size={14} />العودة للرئيسية
            </a>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 gold-gradient rounded-2xl flex items-center justify-center shadow-xl">
                <KeyRound size={26} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white">بوابة المستأجر</h1>
                <p className="text-white/50 text-sm mt-1 flex items-center gap-2">
                  <Building2 size={13} />تكامل لإدارة الأملاك — المدينة المنورة
                </p>
              </div>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mt-6">
              {[
                { icon: <Shield size={12} />, text: "بدون تسجيل" },
                { icon: <CheckCircle size={12} />, text: "متاح 24/7" },
                { icon: <Star size={12} />, text: "آمن وسريع" },
              ].map((f) => (
                <span key={f.text} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/8 border border-white/15 text-white/60 text-xs">
                  <span className="text-amber-400">{f.icon}</span>{f.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main content ─── */}
      <div className="max-w-4xl mx-auto px-4 pb-16 space-y-6">

        {/* Search card */}
        <Card className="border-white/10 bg-white/5 backdrop-blur shadow-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Search size={18} className="text-amber-400" />
              </div>
              <div>
                <h2 className="font-bold text-white">الدخول برقم العقد</h2>
                <p className="text-xs text-white/40">أدخل رقم عقدك للوصول إلى جميع خدماتك</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Input
                placeholder="مثال: CNT-2025-001"
                value={contractCode}
                onChange={e => setContractCode(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                className="flex-1 bg-white/8 border-white/20 text-white placeholder:text-white/30 focus:border-amber-500/50 rounded-xl"
                dir="ltr"
              />
              <Button onClick={handleSearch} className="gold-gradient text-white font-bold px-6 rounded-xl shadow-md hover:opacity-90">
                بحث
              </Button>
            </div>
            {error && (
              <div className="mt-3 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle size={16} />
                رقم العقد غير صحيح. تأكد من الرقم وحاول مجدداً.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/50 text-sm">جاري البحث عن بيانات العقد...</p>
          </div>
        )}

        {/* Data */}
        {data && (
          <div className="space-y-5">

            {/* Contract summary banner */}
            <div className="gold-gradient rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Home size={22} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white/70 text-xs">مرحباً بك</p>
                    <p className="text-xl font-black text-white">{data.tenant?.name || "المستأجر"}</p>
                    <p className="text-white/60 text-xs flex items-center gap-1 mt-0.5">
                      <FileText size={11} />{data.contract.contractNumber}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="text-center px-4 py-2 bg-white/15 rounded-xl">
                    <p className="text-2xl font-black text-white">{paidCount}</p>
                    <p className="text-xs text-white/60">دفعة مسددة</p>
                  </div>
                  {overdueCount > 0 && (
                    <div className="text-center px-4 py-2 bg-red-500/20 rounded-xl border border-red-500/30">
                      <p className="text-2xl font-black text-red-300">{overdueCount}</p>
                      <p className="text-xs text-red-300/70">دفعة متأخرة</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contract details */}
            <Card className="border-white/10 bg-white/5 backdrop-blur shadow-lg">
              <CardHeader className="pb-3 border-b border-white/10">
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <FileText size={15} className="text-amber-400" />
                  </div>
                  تفاصيل العقد
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: "رقم العقد", value: data.contract.contractNumber, icon: <FileText size={14} />, dir: "ltr" as const },
                    { label: "المستأجر", value: data.tenant?.name || "—", icon: <User size={14} /> },
                    { label: "قيمة الإيجار", value: `${formatAmount(data.contract.rentAmount || 0)} ر.س`, icon: <BanknoteIcon size={14} />, highlight: true },
                    { label: "تاريخ البداية", value: formatDate(data.contract.startDate), icon: <Calendar size={14} /> },
                    { label: "تاريخ الانتهاء", value: formatDate(data.contract.endDate), icon: <Calendar size={14} /> },
                    { label: "حالة العقد", value: data.contract.status === "active" ? "ساري ✓" : data.contract.status === "expired" ? "منتهي" : data.contract.status, icon: <Shield size={14} />, highlight: data.contract.status === "active" },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-xl bg-white/5 border border-white/8">
                      <div className="flex items-center gap-1.5 text-white/40 text-xs mb-1.5">
                        {item.icon}{item.label}
                      </div>
                      <p className={`font-bold text-sm ${item.highlight ? "text-amber-400" : "text-white"}`}
                        dir={item.dir || "rtl"}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>


              </CardContent>
            </Card>

            {/* Payments */}
            <Card className="border-white/10 bg-white/5 backdrop-blur shadow-lg">
              <CardHeader className="pb-3 border-b border-white/10">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-white flex items-center gap-2 text-base">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <CreditCard size={15} className="text-green-400" />
                    </div>
                    سجل المدفوعات
                  </CardTitle>
                  <div className="flex gap-3 text-xs">
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">
                      <CheckCircle size={11} />مدفوع: {paidCount}
                    </span>
                    {overdueCount > 0 && (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                        <AlertCircle size={11} />متأخر: {overdueCount}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Summary bar */}
                <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/8 flex items-center justify-between">
                  <span className="text-white/50 text-xs">إجمالي المدفوع</span>
                  <span className="font-black text-green-400 text-lg">{formatAmount(totalPaid)} ر.س</span>
                </div>

                {data.payments.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard size={32} className="text-white/20 mx-auto mb-2" />
                    <p className="text-white/40 text-sm">لا توجد مدفوعات مسجلة</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {data.payments.slice(0, 12).map(payment => {
                      const s = paymentStatusMap[payment.status] || { label: payment.status, color: "bg-gray-100 text-gray-600 border-gray-200", icon: null };
                      return (
                        <div key={payment.id}
                          className="flex items-center justify-between p-3.5 bg-white/5 border border-white/8 rounded-xl hover:bg-white/8 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${payment.status === "paid" ? "bg-green-500/15 text-green-400" : payment.status === "overdue" ? "bg-red-500/15 text-red-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                              {s.icon}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{formatAmount(payment.amount)} ر.س</p>
                              <p className="text-xs text-white/40">
                                استحقاق: {formatDate(payment.dueDate)}
                              </p>
                            </div>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1 ${s.color}`}>
                            {s.icon}{s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Maintenance */}
            <Card className="border-white/10 bg-white/5 backdrop-blur shadow-lg">
              <CardHeader className="pb-3 border-b border-white/10">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-white flex items-center gap-2 text-base">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <Wrench size={15} className="text-orange-400" />
                    </div>
                    طلبات الصيانة
                  </CardTitle>
                  <Dialog open={maintenanceOpen} onOpenChange={setMaintenanceOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gold-gradient text-white font-bold rounded-xl shadow-md">
                        + طلب صيانة جديد
                      </Button>
                    </DialogTrigger>
                    <DialogContent dir="rtl" className="bg-slate-900 border-white/10 text-white">
                      <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                          <Wrench size={18} className="text-amber-400" />طلب صيانة جديد
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-2">
                        <div>
                          <Label className="text-white/70 text-sm">عنوان المشكلة *</Label>
                          <Input
                            value={maintenanceForm.title}
                            onChange={e => setMaintenanceForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="مثال: تسرب مياه في الحمام"
                            className="mt-1.5 bg-white/8 border-white/20 text-white placeholder:text-white/30 rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="text-white/70 text-sm">الوصف التفصيلي</Label>
                          <Textarea
                            value={maintenanceForm.description}
                            onChange={e => setMaintenanceForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="اشرح المشكلة بالتفصيل لمساعدتنا في الإصلاح السريع..."
                            rows={3}
                            className="mt-1.5 bg-white/8 border-white/20 text-white placeholder:text-white/30 rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="text-white/70 text-sm">الأولوية</Label>
                          <Select value={maintenanceForm.priority} onValueChange={v => setMaintenanceForm(f => ({ ...f, priority: v as "low" | "medium" | "high" | "urgent" }))}>
                            <SelectTrigger className="mt-1.5 bg-white/8 border-white/20 text-white rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-white/10">
                              <SelectItem value="low" className="text-white">منخفضة</SelectItem>
                              <SelectItem value="medium" className="text-white">متوسطة</SelectItem>
                              <SelectItem value="high" className="text-white">عالية</SelectItem>
                              <SelectItem value="urgent" className="text-white">عاجلة 🚨</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          className="w-full gold-gradient text-white font-bold rounded-xl"
                          onClick={() => submitMaintenance.mutate({ contractCode: searchCode, ...maintenanceForm })}
                          disabled={!maintenanceForm.title || submitMaintenance.isPending}
                        >
                          {submitMaintenance.isPending ? "جاري الإرسال..." : "إرسال الطلب"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {data.maintenance.length === 0 ? (
                  <div className="text-center py-8">
                    <Wrench size={32} className="text-white/20 mx-auto mb-2" />
                    <p className="text-white/40 text-sm">لا توجد طلبات صيانة</p>
                    <p className="text-white/25 text-xs mt-1">اضغط على "طلب صيانة جديد" لتقديم طلبك</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.maintenance.slice(0, 8).map(req => {
                      const s = maintenanceStatusMap[req.status] || { label: req.status, color: "bg-gray-100 text-gray-600" };
                      const p = priorityMap[req.priority] || { label: req.priority, color: "text-gray-400" };
                      return (
                        <div key={req.id} className="flex items-center justify-between p-3.5 bg-white/5 border border-white/8 rounded-xl hover:bg-white/8 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-500/15 rounded-lg flex items-center justify-center">
                              <Wrench size={14} className="text-orange-400" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{req.title}</p>
                              <p className="text-xs text-white/40 flex items-center gap-2">
                                <span>{formatDate(req.createdAt)}</span>
                                <span className={`font-medium ${p.color}`}>• {p.label}</span>
                              </p>
                            </div>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.color}`}>
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="border-amber-500/20 bg-amber-500/5 backdrop-blur shadow-lg">
              <CardContent className="p-5">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <MessageCircle size={16} className="text-amber-400" />للتواصل مع إدارة تكامل
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors group">
                    <div className="w-9 h-9 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone size={16} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-white/40">واتساب مباشر</p>
                      <p className="text-sm font-bold text-white">+966 55 801 8151</p>
                    </div>
                    <ChevronRight size={14} className="text-white/30 group-hover:text-white/60 transition-colors" />
                  </a>
                  <a href="https://t.me/Takamolestatebot" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors group">
                    <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageCircle size={16} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-white/40">تيليغرام</p>
                      <p className="text-sm font-bold text-white">@Takamolestatebot</p>
                    </div>
                    <ChevronRight size={14} className="text-white/30 group-hover:text-white/60 transition-colors" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty state (no search yet) */}
        {!data && !isLoading && !error && (
          <div className="text-center py-16">
            <div className="w-20 h-20 gold-gradient rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-2xl">
              <KeyRound size={36} className="text-white" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">ابدأ بإدخال رقم عقدك</h3>
            <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed">
              أدخل رقم عقدك في الحقل أعلاه للوصول إلى تفاصيل عقدك، سجل مدفوعاتك، وتقديم طلبات الصيانة.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-10 max-w-sm mx-auto">
              {[
                { icon: <FileText size={20} />, label: "تفاصيل العقد" },
                { icon: <CreditCard size={20} />, label: "سجل الدفعات" },
                { icon: <Wrench size={20} />, label: "طلبات الصيانة" },
              ].map((f) => (
                <div key={f.label} className="p-4 rounded-2xl bg-white/5 border border-white/8 text-center">
                  <div className="text-amber-400 flex justify-center mb-2">{f.icon}</div>
                  <p className="text-xs text-white/50">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
