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
import { Plus, Banknote, CheckCircle, Clock, XCircle, ArrowUpRight } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "قيد المعالجة", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
  completed: { label: "مكتمل", color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
  failed: { label: "فشل", color: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3" /> },
};

export default function OwnerTransfers() {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    ownerId: "", amount: "", transferDate: new Date().toISOString().split("T")[0],
    bankName: "", ibanLast4: "", referenceNumber: "", notes: "", status: "completed" as const,
  });

  const { data: transfers = [], refetch } = trpc.ownerTransfers.list.useQuery(undefined);
  const { data: owners = [] } = trpc.owners.list.useQuery();

  const createMutation = trpc.ownerTransfers.create.useMutation({
    onSuccess: () => { toast.success("تم تسجيل التحويل بنجاح"); setShowAdd(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const updateStatusMutation = trpc.ownerTransfers.updateStatus.useMutation({
    onSuccess: () => { toast.success("تم تحديث الحالة"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const totalCompleted = transfers.filter(t => t.status === "completed").reduce((s, t) => s + Number(t.amount), 0);
  const totalPending = transfers.filter(t => t.status === "pending").reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">تحويلات الملاك</h1>
          <p className="text-gray-500 text-sm mt-1">سجل جميع التحويلات المالية لأصحاب العقارات</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 gap-2"><Plus className="h-4 w-4" />تسجيل تحويل</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader><DialogTitle>تسجيل تحويل مالي جديد</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>المالك *</Label>
                  <Select value={form.ownerId} onValueChange={v => setForm(f => ({ ...f, ownerId: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر المالك" /></SelectTrigger>
                    <SelectContent>{owners.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>المبلغ (ر.س) *</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>تاريخ التحويل *</Label><Input type="date" value={form.transferDate} onChange={e => setForm(f => ({ ...f, transferDate: e.target.value }))} /></div>
                <div>
                  <Label>الحالة</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as typeof form.status }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">مكتمل</SelectItem>
                      <SelectItem value="pending">قيد المعالجة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>البنك</Label><Input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} placeholder="اسم البنك" /></div>
                <div><Label>آخر 4 أرقام IBAN</Label><Input value={form.ibanLast4} onChange={e => setForm(f => ({ ...f, ibanLast4: e.target.value }))} placeholder="XXXX" maxLength={4} /></div>
              </div>
              <div><Label>رقم المرجع</Label><Input value={form.referenceNumber} onChange={e => setForm(f => ({ ...f, referenceNumber: e.target.value }))} placeholder="رقم العملية البنكية" /></div>
              <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
              <Button className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => createMutation.mutate({ ...form, ownerId: Number(form.ownerId), transferDate: form.transferDate })}
                disabled={!form.ownerId || !form.amount || createMutation.isPending}>
                {createMutation.isPending ? "جاري الحفظ..." : "حفظ التحويل"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
              <div>
                <div className="text-xl font-bold text-green-700">{totalCompleted.toLocaleString("ar-SA")} ر.س</div>
                <div className="text-sm text-green-600">إجمالي المحوّل</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg"><Clock className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <div className="text-xl font-bold text-yellow-700">{totalPending.toLocaleString("ar-SA")} ر.س</div>
                <div className="text-sm text-yellow-600">قيد المعالجة</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Banknote className="h-5 w-5 text-blue-600" /></div>
              <div>
                <div className="text-xl font-bold text-blue-700">{transfers.length}</div>
                <div className="text-sm text-blue-600">إجمالي التحويلات</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transfers Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">سجل التحويلات</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right p-3 font-medium text-gray-600">المالك</th>
                  <th className="text-right p-3 font-medium text-gray-600">المبلغ</th>
                  <th className="text-right p-3 font-medium text-gray-600">التاريخ</th>
                  <th className="text-right p-3 font-medium text-gray-600">البنك</th>
                  <th className="text-right p-3 font-medium text-gray-600">المرجع</th>
                  <th className="text-right p-3 font-medium text-gray-600">الحالة</th>
                  <th className="text-right p-3 font-medium text-gray-600">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transfers.map(t => {
                  const statusInfo = STATUS_LABELS[t.status] || STATUS_LABELS.pending;
                  return (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium">{(t as any).ownerName || `مالك #${t.ownerId}`}</td>
                      <td className="p-3 font-bold text-green-700">{Number(t.amount).toLocaleString("ar-SA")} ر.س</td>
                      <td className="p-3 text-gray-600">{new Date(t.transferDate).toLocaleDateString("ar-SA")}</td>
                      <td className="p-3 text-gray-600">{t.bankName || "-"}</td>
                      <td className="p-3 text-gray-500 font-mono text-xs">{t.referenceNumber || "-"}</td>
                      <td className="p-3">
                        <Badge className={`${statusInfo.color} gap-1 text-xs`}>
                          {statusInfo.icon}{statusInfo.label}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {t.status === "pending" && (
                          <Button size="sm" variant="outline" className="text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => updateStatusMutation.mutate({ id: t.id, status: "completed" })}>
                            <CheckCircle className="h-3 w-3" />تأكيد
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {transfers.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <ArrowUpRight className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>لا توجد تحويلات مسجلة</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
