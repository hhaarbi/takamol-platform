import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, CalendarCheck, CheckCircle2, Clock, XCircle, DollarSign } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "معلق", color: "bg-blue-100 text-blue-700", icon: <Clock className="h-3 w-3" /> },
  confirmed: { label: "مؤكد", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="h-3 w-3" /> },
  cancelled: { label: "ملغي", color: "bg-red-100 text-red-700", icon: <XCircle className="h-3 w-3" /> },
  converted: { label: "تحوّل لعقد", color: "bg-purple-100 text-purple-700", icon: <CheckCircle2 className="h-3 w-3" /> },
};

export default function Reservations() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    unitId: "",
    prospectName: "",
    prospectPhone: "",
    prospectEmail: "",
    depositAmount: "",
    startDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: reservations, isLoading } = trpc.reservations.list.useQuery();
  const { data: unitsData } = trpc.units.listAll.useQuery();
  const { data: stats } = trpc.reservations.stats.useQuery();

  const createMutation = trpc.reservations.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء الحجز المسبق بنجاح");
      setOpen(false);
      setForm({ unitId: "", prospectName: "", prospectPhone: "", prospectEmail: "", depositAmount: "", startDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0], notes: "" });
      utils.reservations.list.invalidate();
      utils.reservations.stats.invalidate();
    },
    onError: () => toast.error("فشل إنشاء الحجز"),
  });

  const updateStatusMutation = trpc.reservations.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة الحجز");
      utils.reservations.list.invalidate();
      utils.reservations.stats.invalidate();
    },
  });

  const handleCreate = () => {
    if (!form.unitId || !form.prospectName || !form.prospectPhone) {
      toast.error("يرجى ملء الحقول الإلزامية");
      return;
    }
    createMutation.mutate({
      unitId: parseInt(form.unitId),
      propertyId: 0,
      applicantName: form.prospectName,
      applicantPhone: form.prospectPhone,
      applicantEmail: form.prospectEmail || undefined,
      depositAmount: form.depositAmount || undefined,
      desiredStartDate: new Date(form.startDate).getTime(),
      notes: form.notes || undefined,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الحجز المسبق للوحدات</h1>
          <p className="text-muted-foreground mt-1">إدارة حجوزات المستأجرين المحتملين مع دفع العربون</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              حجز جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>حجز مسبق جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>الوحدة <span className="text-red-500">*</span></Label>
                <Select value={form.unitId} onValueChange={v => setForm(p => ({ ...p, unitId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر وحدة شاغرة" />
                  </SelectTrigger>
                  <SelectContent>
                    {(unitsData as Array<{id: number; unitNumber: string; propertyName: string; type: string}> | undefined)?.map(u => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.unitNumber} — {u.propertyName} ({u.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>اسم المستأجر المحتمل <span className="text-red-500">*</span></Label>
                <Input placeholder="الاسم الكامل" value={form.prospectName} onChange={e => setForm(p => ({ ...p, prospectName: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>رقم الجوال <span className="text-red-500">*</span></Label>
                  <Input placeholder="05xxxxxxxx" value={form.prospectPhone} onChange={e => setForm(p => ({ ...p, prospectPhone: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>البريد الإلكتروني</Label>
                  <Input type="email" placeholder="اختياري" value={form.prospectEmail} onChange={e => setForm(p => ({ ...p, prospectEmail: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>مبلغ العربون (ر.س)</Label>
                  <Input type="number" placeholder="0" value={form.depositAmount} onChange={e => setForm(p => ({ ...p, depositAmount: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>تاريخ بدء الإيجار</Label>
                  <Input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-1">
                <Label>ملاحظات</Label>
                <Input placeholder="ملاحظات اختيارية..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>

              <Button className="w-full" onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "جاري الحجز..." : "تأكيد الحجز"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "إجمالي الحجوزات", value: stats.total, color: "text-foreground" },
            { label: "معلقة", value: stats.pending, color: "text-blue-600" },
            { label: "مؤكدة", value: stats.confirmed, color: "text-green-600" },
            { label: "إجمالي العربون", value: `${stats.depositsPaid.toLocaleString("ar-SA")} ر.س`, color: "text-amber-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reservations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-blue-500" />
            قائمة الحجوزات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : !reservations?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد حجوزات بعد</p>
              <p className="text-sm">أنشئ أول حجز مسبق لوحدة شاغرة</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.map(r => {
                const st = STATUS_MAP[r.status || "pending"];
                return (
                  <div key={r.id} className="rounded-xl border p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{r.applicantName}</h3>
                          <Badge className={`gap-1 border-0 text-xs ${st.color}`}>{st.icon}{st.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{r.applicantPhone}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          وحدة رقم: {r.unitId} — عقار: {r.propertyId}
                        </p>
                        {r.desiredStartDate && (
                          <p className="text-xs text-muted-foreground">
                            تاريخ بدء الإيجار: {new Date(r.desiredStartDate).toLocaleDateString("ar-SA")}
                          </p>
                        )}
                      </div>
                      <div className="text-left shrink-0">
                        {r.depositAmount && parseFloat(r.depositAmount) > 0 && (
                          <div className="flex items-center gap-1 text-amber-600">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-bold">{parseFloat(r.depositAmount).toLocaleString("ar-SA")} ر.س</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">عربون</p>
                      </div>
                    </div>

                    {(r.status === "pending" || r.status === "confirmed") && (
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        {r.status === "pending" && (
                          <Button size="sm" variant="outline" className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => updateStatusMutation.mutate({ id: r.id, status: "confirmed" })}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            تأكيد
                          </Button>
                        )}
                        {r.status === "confirmed" && (
                          <Button size="sm" variant="outline" className="gap-1 text-purple-600 border-purple-200 hover:bg-purple-50"
                            onClick={() => updateStatusMutation.mutate({ id: r.id, status: "converted" })}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            تحويل لعقد
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="gap-1 text-red-500 border-red-200 hover:bg-red-50"
                          onClick={() => updateStatusMutation.mutate({ id: r.id, status: "cancelled" })}>
                          <XCircle className="h-3.5 w-3.5" />
                          إلغاء
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
