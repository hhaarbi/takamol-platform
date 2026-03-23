import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Star, Phone, Wrench, Building2, Edit, ToggleLeft } from "lucide-react";

const SPECIALTY_LABELS: Record<string, string> = {
  plumbing: "سباكة", electrical: "كهرباء", hvac: "تكييف",
  painting: "دهانات", carpentry: "نجارة", cleaning: "تنظيف",
  security: "أمن", general: "عام", other: "أخرى",
};

const SPECIALTY_COLORS: Record<string, string> = {
  plumbing: "bg-blue-100 text-blue-800", electrical: "bg-yellow-100 text-yellow-800",
  hvac: "bg-cyan-100 text-cyan-800", painting: "bg-purple-100 text-purple-800",
  carpentry: "bg-amber-100 text-amber-800", cleaning: "bg-green-100 text-green-800",
  security: "bg-red-100 text-red-800", general: "bg-gray-100 text-gray-800",
  other: "bg-slate-100 text-slate-800",
};

export default function Contractors() {
  const [filterSpecialty, setFilterSpecialty] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showRate, setShowRate] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", specialty: "general", phone: "", phone2: "", email: "", company: "", notes: "" });
  const [ratingValue, setRatingValue] = useState(5);

  const { data: contractors = [], refetch } = trpc.contractors.list.useQuery(
    filterSpecialty ? { specialty: filterSpecialty, isActive: true } : { isActive: true }
  );

  const createMutation = trpc.contractors.create.useMutation({
    onSuccess: () => { toast.success("تم إضافة المقاول بنجاح"); setShowAdd(false); refetch(); setForm({ name: "", specialty: "general", phone: "", phone2: "", email: "", company: "", notes: "" }); },
    onError: (e) => toast.error(e.message),
  });

  const rateMutation = trpc.contractors.rate.useMutation({
    onSuccess: () => { toast.success("تم تقييم المقاول"); setShowRate(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = trpc.contractors.update.useMutation({
    onSuccess: () => { toast.success("تم تحديث الحالة"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المقاولون والموردون</h1>
          <p className="text-gray-500 text-sm mt-1">إدارة قائمة المقاولين المعتمدين وتقييم أدائهم</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700 gap-2"><Plus className="h-4 w-4" />إضافة مقاول</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader><DialogTitle>إضافة مقاول جديد</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>الاسم *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="اسم المقاول" /></div>
                <div><Label>التخصص *</Label>
                  <Select value={form.specialty} onValueChange={v => setForm(f => ({ ...f, specialty: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(SPECIALTY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>الجوال *</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="05xxxxxxxx" /></div>
                <div><Label>جوال إضافي</Label><Input value={form.phone2} onChange={e => setForm(f => ({ ...f, phone2: e.target.value }))} placeholder="اختياري" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>البريد الإلكتروني</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="اختياري" /></div>
                <div><Label>اسم الشركة</Label><Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="اختياري" /></div>
              </div>
              <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
              <Button className="w-full bg-amber-600 hover:bg-amber-700" onClick={() => createMutation.mutate(form as typeof form & { specialty: "general" })} disabled={!form.name || !form.phone || createMutation.isPending}>
                {createMutation.isPending ? "جاري الحفظ..." : "حفظ المقاول"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button variant={!filterSpecialty ? "default" : "outline"} size="sm" onClick={() => setFilterSpecialty("")}>الكل</Button>
        {Object.entries(SPECIALTY_LABELS).map(([k, v]) => (
          <Button key={k} variant={filterSpecialty === k ? "default" : "outline"} size="sm" onClick={() => setFilterSpecialty(k)}>{v}</Button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-700">{contractors.length}</div>
            <div className="text-sm text-amber-600">إجمالي المقاولين</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{contractors.filter(c => Number(c.rating) >= 4).length}</div>
            <div className="text-sm text-green-600">تقييم ممتاز (4+)</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{contractors.reduce((s, c) => s + c.totalJobs, 0)}</div>
            <div className="text-sm text-blue-600">إجمالي المهام</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">
              {contractors.length > 0 ? (contractors.reduce((s, c) => s + Number(c.rating), 0) / contractors.length).toFixed(1) : "0"}
            </div>
            <div className="text-sm text-purple-600">متوسط التقييم</div>
          </CardContent>
        </Card>
      </div>

      {/* Contractors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contractors.map(contractor => (
          <Card key={contractor.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{contractor.name}</CardTitle>
                  {contractor.company && <p className="text-xs text-gray-500 mt-0.5">{contractor.company}</p>}
                </div>
                <Badge className={SPECIALTY_COLORS[contractor.specialty] || "bg-gray-100 text-gray-800"}>
                  {SPECIALTY_LABELS[contractor.specialty] || contractor.specialty}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-3.5 w-3.5" />
                <span dir="ltr">{contractor.phone}</span>
                {contractor.phone2 && <span dir="ltr" className="text-gray-400">/ {contractor.phone2}</span>}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`h-4 w-4 ${s <= Math.round(Number(contractor.rating)) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                  ))}
                  <span className="text-xs text-gray-500 mr-1">({Number(contractor.rating).toFixed(1)})</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Wrench className="h-3 w-3" />
                  <span>{contractor.totalJobs} مهمة</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Building2 className="h-3 w-3" />
                <span>إجمالي التكاليف: {Number(contractor.totalCost).toLocaleString("ar-SA")} ر.س</span>
              </div>

              {contractor.notes && <p className="text-xs text-gray-500 bg-gray-50 rounded p-2">{contractor.notes}</p>}

              <div className="flex gap-2 pt-1">
                <Dialog open={showRate === contractor.id} onOpenChange={o => setShowRate(o ? contractor.id : null)}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs">
                      <Star className="h-3 w-3" />تقييم
                    </Button>
                  </DialogTrigger>
                  <DialogContent dir="rtl" className="max-w-sm">
                    <DialogHeader><DialogTitle>تقييم {contractor.name}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>التقييم (1-5)</Label>
                        <div className="flex gap-2 mt-2">
                          {[1, 2, 3, 4, 5].map(s => (
                            <button key={s} onClick={() => setRatingValue(s)} className={`p-2 rounded-full transition-colors ${s <= ratingValue ? "text-amber-400" : "text-gray-300"}`}>
                              <Star className={`h-6 w-6 ${s <= ratingValue ? "fill-amber-400" : ""}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <Button className="w-full bg-amber-600 hover:bg-amber-700" onClick={() => rateMutation.mutate({ id: contractor.id, rating: ratingValue })} disabled={rateMutation.isPending}>
                        {rateMutation.isPending ? "جاري الحفظ..." : "حفظ التقييم"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => toggleMutation.mutate({ id: contractor.id, data: { isActive: !contractor.isActive } })}>
                  <ToggleLeft className="h-3 w-3" />{contractor.isActive ? "تعطيل" : "تفعيل"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {contractors.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Wrench className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>لا يوجد مقاولون مسجلون</p>
          <p className="text-sm mt-1">أضف مقاولين معتمدين لتسهيل إسناد أعمال الصيانة</p>
        </div>
      )}
    </div>
  );
}
