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
import { Plus, UserCheck, Phone, ArrowLeftRight, CheckCircle, Clock, XCircle } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "قيد الانتظار", color: "bg-yellow-100 text-yellow-800" },
  contacted: { label: "تم التواصل", color: "bg-blue-100 text-blue-800" },
  deal_closed: { label: "تم الإغلاق", color: "bg-green-100 text-green-800" },
  cancelled: { label: "ملغي", color: "bg-red-100 text-red-800" },
};

const SERVICE_LABELS: Record<string, string> = {
  buy: "شراء عقار", sell: "بيع عقار", rent: "إيجار", management: "إدارة أملاك",
};

export default function BrokerReferrals() {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    referringBrokerId: "", receivingBrokerId: "", propertyId: "",
    clientName: "", clientPhone: "", serviceType: "buy" as const,
    referralCommission: "", notes: "",
  });

  const { data: referrals = [], refetch } = trpc.brokerReferrals.list.useQuery();
  const { data: brokers = [] } = trpc.brokers.list.useQuery();

  const createMutation = trpc.brokerReferrals.create.useMutation({
    onSuccess: () => { toast.success("تم تسجيل الإحالة بنجاح"); setShowAdd(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.brokerReferrals.update.useMutation({
    onSuccess: () => { toast.success("تم تحديث الإحالة"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const stats = {
    total: referrals.length,
    pending: referrals.filter(r => r.status === "pending").length,
    closed: referrals.filter(r => r.status === "deal_closed").length,
    totalCommission: referrals.filter(r => r.status === "deal_closed").reduce((s, r) => s + Number(r.referralCommission || 0), 0),
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إحالات الوسطاء</h1>
          <p className="text-gray-500 text-sm mt-1">تتبع الإحالات بين الوسطاء وعمولات الإحالة</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 gap-2"><Plus className="h-4 w-4" />إضافة إحالة</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader><DialogTitle>تسجيل إحالة جديدة</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>الوسيط المُحيل *</Label>
                  <Select value={form.referringBrokerId} onValueChange={v => setForm(f => ({ ...f, referringBrokerId: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر الوسيط" /></SelectTrigger>
                    <SelectContent>{brokers.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الوسيط المستقبِل</Label>
                  <Select value={form.receivingBrokerId} onValueChange={v => setForm(f => ({ ...f, receivingBrokerId: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختياري" /></SelectTrigger>
                    <SelectContent>{brokers.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>اسم العميل *</Label><Input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} placeholder="اسم العميل" /></div>
                <div><Label>جوال العميل *</Label><Input value={form.clientPhone} onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))} placeholder="05xxxxxxxx" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>نوع الخدمة *</Label>
                  <Select value={form.serviceType} onValueChange={v => setForm(f => ({ ...f, serviceType: v as typeof form.serviceType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(SERVICE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>عمولة الإحالة (ر.س)</Label><Input type="number" value={form.referralCommission} onChange={e => setForm(f => ({ ...f, referralCommission: e.target.value }))} placeholder="0" /></div>
              </div>
              <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
              <Button className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => createMutation.mutate({ ...form, referringBrokerId: Number(form.referringBrokerId), receivingBrokerId: form.receivingBrokerId ? Number(form.receivingBrokerId) : undefined, propertyId: form.propertyId ? Number(form.propertyId) : undefined })}
                disabled={!form.referringBrokerId || !form.clientName || !form.clientPhone || createMutation.isPending}>
                {createMutation.isPending ? "جاري الحفظ..." : "حفظ الإحالة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">{stats.total}</div>
            <div className="text-sm text-purple-600">إجمالي الإحالات</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
            <div className="text-sm text-yellow-600">قيد المتابعة</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{stats.closed}</div>
            <div className="text-sm text-green-600">صفقات مغلقة</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 text-center">
            <div className="text-xl font-bold text-amber-700">{stats.totalCommission.toLocaleString("ar-SA")} ر.س</div>
            <div className="text-sm text-amber-600">عمولات الإحالة</div>
          </CardContent>
        </Card>
      </div>

      {/* Referrals List */}
      <Card>
        <CardHeader><CardTitle className="text-base">قائمة الإحالات</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right p-3 font-medium text-gray-600">العميل</th>
                  <th className="text-right p-3 font-medium text-gray-600">الوسيط المُحيل</th>
                  <th className="text-right p-3 font-medium text-gray-600">الخدمة</th>
                  <th className="text-right p-3 font-medium text-gray-600">العمولة</th>
                  <th className="text-right p-3 font-medium text-gray-600">الحالة</th>
                  <th className="text-right p-3 font-medium text-gray-600">تحديث</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {referrals.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium">{r.clientName}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1"><Phone className="h-3 w-3" />{r.clientPhone}</div>
                    </td>
                    <td className="p-3 text-gray-700">{(r as any).referringBrokerName || `وسيط #${r.referringBrokerId}`}</td>
                    <td className="p-3"><Badge variant="outline">{SERVICE_LABELS[r.serviceType] || r.serviceType}</Badge></td>
                    <td className="p-3 font-medium text-green-700">{r.referralCommission ? `${Number(r.referralCommission).toLocaleString("ar-SA")} ر.س` : "-"}</td>
                    <td className="p-3">
                      <Badge className={STATUS_CONFIG[r.status]?.color || "bg-gray-100 text-gray-800"}>
                        {STATUS_CONFIG[r.status]?.label || r.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Select value={r.status} onValueChange={v => updateMutation.mutate({ id: r.id, data: { status: v as any } })}>
                        <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {referrals.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <ArrowLeftRight className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>لا توجد إحالات مسجلة</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
