import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Shield, AlertTriangle, CheckCircle, Clock, Plus, Trash2, Edit, Bell } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "نشط", color: "bg-green-100 text-green-800" },
  expired: { label: "منتهي", color: "bg-red-100 text-red-800" },
  suspended: { label: "موقوف", color: "bg-yellow-100 text-yellow-800" },
  pending_renewal: { label: "قيد التجديد", color: "bg-blue-100 text-blue-800" },
};

function getDaysLeft(expiryDate: string | Date | null): number {
  if (!expiryDate) return 0;
  const expiry = new Date(String(expiryDate));
  const now = new Date();
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function FalCompliance() {
  const { data: licenses = [], refetch } = trpc.falCompliance.list.useQuery();
  const { data: expiring } = trpc.falCompliance.checkExpiring.useQuery();
  const createMutation = trpc.falCompliance.create.useMutation({ onSuccess: () => { refetch(); setShowAdd(false); toast.success("تم إضافة الترخيص"); } });
  const deleteMutation = trpc.falCompliance.delete.useMutation({ onSuccess: () => { refetch(); toast.success("تم حذف الترخيص"); } });
  const updateMutation = trpc.falCompliance.update.useMutation({ onSuccess: () => { refetch(); setEditId(null); toast.success("تم تحديث الترخيص"); } });

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ licenseNumber: "", holderName: "", holderType: "broker" as const, licenseType: "وسيط عقاري", issueDate: "", expiryDate: "", notes: "" });

  const handleSubmit = () => {
    if (!form.licenseNumber || !form.holderName || !form.expiryDate) { toast.error("يرجى تعبئة الحقول المطلوبة"); return; }
    if (editId) {
      updateMutation.mutate({ id: editId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const startEdit = (lic: any) => {
    setEditId(lic.id);
    setForm({
      licenseNumber: lic.licenseNumber,
      holderName: lic.holderName,
      holderType: lic.holderType,
      licenseType: lic.licenseType ?? "وسيط عقاري",
      issueDate: lic.issueDate ? String(lic.issueDate).split("T")[0] : "",
      expiryDate: lic.expiryDate ? String(lic.expiryDate).split("T")[0] : "",
      notes: lic.notes ?? "",
    });
    setShowAdd(true);
  };

  const alertCount = (expiring?.expired?.length ?? 0) + (expiring?.expiring7?.length ?? 0) + (expiring?.expiring30?.length ?? 0);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6 text-blue-600" /> امتثال فال</h1>
          <p className="text-muted-foreground mt-1">إدارة تراخيص فال ومتابعة تواريخ انتهائها</p>
        </div>
        <Dialog open={showAdd} onOpenChange={(v) => { setShowAdd(v); if (!v) setEditId(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditId(null); setForm({ licenseNumber: "", holderName: "", holderType: "broker", licenseType: "وسيط عقاري", issueDate: "", expiryDate: "", notes: "" }); }}>
              <Plus className="h-4 w-4 ml-2" /> إضافة ترخيص
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader><DialogTitle>{editId ? "تعديل الترخيص" : "إضافة ترخيص جديد"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>رقم الترخيص *</Label><Input value={form.licenseNumber} onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))} placeholder="FAL-XXXX" /></div>
                <div><Label>اسم الحامل *</Label><Input value={form.holderName} onChange={e => setForm(f => ({ ...f, holderName: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>نوع الحامل</Label>
                  <Select value={form.holderType} onValueChange={v => setForm(f => ({ ...f, holderType: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="broker">وسيط</SelectItem><SelectItem value="company">شركة</SelectItem><SelectItem value="agent">وكيل</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>نوع الترخيص</Label><Input value={form.licenseType} onChange={e => setForm(f => ({ ...f, licenseType: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>تاريخ الإصدار</Label><Input type="date" value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} /></div>
                <div><Label>تاريخ الانتهاء *</Label><Input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} /></div>
              </div>
              <div><Label>ملاحظات</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <Button className="w-full" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editId ? "حفظ التعديلات" : "إضافة الترخيص"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* تنبيهات الانتهاء */}
      {alertCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(expiring?.expired?.length ?? 0) > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div><p className="font-bold text-red-800 text-lg">{expiring?.expired?.length}</p><p className="text-red-700 text-sm">تراخيص منتهية</p></div>
              </CardContent>
            </Card>
          )}
          {(expiring?.expiring7?.length ?? 0) > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4 flex items-center gap-3">
                <Bell className="h-8 w-8 text-orange-600" />
                <div><p className="font-bold text-orange-800 text-lg">{expiring?.expiring7?.length}</p><p className="text-orange-700 text-sm">تنتهي خلال 7 أيام</p></div>
              </CardContent>
            </Card>
          )}
          {(expiring?.expiring30?.length ?? 0) > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div><p className="font-bold text-yellow-800 text-lg">{expiring?.expiring30?.length}</p><p className="text-yellow-700 text-sm">تنتهي خلال 30 يوماً</p></div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* إحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{licenses.length}</p><p className="text-sm text-muted-foreground">إجمالي التراخيص</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{licenses.filter(l => l.status === "active").length}</p><p className="text-sm text-muted-foreground">نشطة</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{licenses.filter(l => l.status === "expired").length}</p><p className="text-sm text-muted-foreground">منتهية</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-600">{licenses.filter(l => getDaysLeft(l.expiryDate) <= 30 && getDaysLeft(l.expiryDate) >= 0).length}</p><p className="text-sm text-muted-foreground">تنتهي قريباً</p></CardContent></Card>
      </div>

      {/* جدول التراخيص */}
      <Card>
        <CardHeader><CardTitle>قائمة التراخيص</CardTitle></CardHeader>
        <CardContent>
          {licenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>لا توجد تراخيص مسجلة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="p-3 text-right">رقم الترخيص</th>
                  <th className="p-3 text-right">الحامل</th>
                  <th className="p-3 text-right">النوع</th>
                  <th className="p-3 text-right">تاريخ الانتهاء</th>
                  <th className="p-3 text-right">الأيام المتبقية</th>
                  <th className="p-3 text-right">الحالة</th>
                  <th className="p-3 text-right">إجراءات</th>
                </tr></thead>
                <tbody>
                  {licenses.map(lic => {
                    const daysLeft = getDaysLeft(lic.expiryDate);
                    const urgency = daysLeft < 0 ? "expired" : daysLeft <= 7 ? "critical" : daysLeft <= 30 ? "warning" : "ok";
                    return (
                      <tr key={lic.id} className="border-b hover:bg-muted/30">
                        <td className="p-3 font-mono">{lic.licenseNumber}</td>
                        <td className="p-3 font-medium">{lic.holderName}</td>
                        <td className="p-3 text-muted-foreground">{lic.licenseType}</td>
                        <td className="p-3">{lic.expiryDate ? new Date(String(lic.expiryDate)).toLocaleDateString("ar-SA") : "-"}</td>
                        <td className="p-3">
                          <span className={`font-bold ${urgency === "expired" ? "text-red-600" : urgency === "critical" ? "text-orange-600" : urgency === "warning" ? "text-yellow-600" : "text-green-600"}`}>
                            {daysLeft < 0 ? `منتهي منذ ${Math.abs(daysLeft)} يوم` : `${daysLeft} يوم`}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_LABELS[lic.status]?.color ?? "bg-gray-100 text-gray-800"}`}>
                            {STATUS_LABELS[lic.status]?.label ?? lic.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => startEdit(lic)}><Edit className="h-3 w-3" /></Button>
                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => { if (confirm("هل أنت متأكد من الحذف؟")) deleteMutation.mutate(lic.id); }}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
