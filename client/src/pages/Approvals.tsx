import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, AlertTriangle, Plus, Filter } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "قيد الانتظار", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  approved: { label: "موافق عليه", color: "bg-green-100 text-green-800", icon: CheckCircle },
  rejected: { label: "مرفوض", color: "bg-red-100 text-red-800", icon: XCircle },
  cancelled: { label: "ملغي", color: "bg-gray-100 text-gray-800", icon: XCircle },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "منخفضة", color: "bg-gray-100 text-gray-700" },
  medium: { label: "متوسطة", color: "bg-blue-100 text-blue-700" },
  high: { label: "عالية", color: "bg-orange-100 text-orange-700" },
  urgent: { label: "عاجل", color: "bg-red-100 text-red-700" },
};

const TYPE_LABELS: Record<string, string> = {
  maintenance: "صيانة",
  expense: "مصروف",
  contract: "عقد",
  transfer: "تحويل",
  other: "أخرى",
};

export default function Approvals() {
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected" | "cancelled">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "maintenance" | "expense" | "contract" | "transfer" | "other">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [form, setForm] = useState({ requestType: "maintenance" as const, title: "", description: "", amount: "", priority: "medium" as const });

  const { data: approvals = [], refetch } = trpc.approvals.list.useQuery({ status: statusFilter, requestType: typeFilter });
  const { data: stats } = trpc.approvals.stats.useQuery();
  const createMutation = trpc.approvals.create.useMutation({ onSuccess: () => { refetch(); setShowAdd(false); toast.success("تم إرسال طلب الموافقة"); } });
  const approveMutation = trpc.approvals.approve.useMutation({ onSuccess: () => { refetch(); toast.success("تمت الموافقة"); } });
  const rejectMutation = trpc.approvals.reject.useMutation({ onSuccess: () => { refetch(); setRejectId(null); toast.success("تم الرفض"); } });

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><CheckCircle className="h-6 w-6 text-green-600" /> نظام الموافقات</h1>
          <p className="text-muted-foreground mt-1">إدارة طلبات الموافقة الداخلية للمصروفات والصيانة والعقود</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 ml-2" /> طلب موافقة جديد</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader><DialogTitle>طلب موافقة جديد</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>نوع الطلب</Label>
                  <Select value={form.requestType} onValueChange={v => setForm(f => ({ ...f, requestType: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maintenance">صيانة</SelectItem>
                      <SelectItem value="expense">مصروف</SelectItem>
                      <SelectItem value="contract">عقد</SelectItem>
                      <SelectItem value="transfer">تحويل</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>الأولوية</Label>
                  <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                      <SelectItem value="urgent">عاجل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>عنوان الطلب *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="وصف موجز للطلب" /></div>
              <div><Label>الوصف التفصيلي</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
              <div><Label>المبلغ (ر.س)</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" /></div>
              <Button className="w-full" onClick={() => { if (!form.title) { toast.error("يرجى كتابة عنوان الطلب"); return; } createMutation.mutate(form); }} disabled={createMutation.isPending}>
                إرسال الطلب
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats?.total ?? 0}</p><p className="text-xs text-muted-foreground">إجمالي الطلبات</p></CardContent></Card>
        <Card className="border-yellow-200"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-600">{stats?.pending ?? 0}</p><p className="text-xs text-muted-foreground">قيد الانتظار</p></CardContent></Card>
        <Card className="border-green-200"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{stats?.approved ?? 0}</p><p className="text-xs text-muted-foreground">موافق عليها</p></CardContent></Card>
        <Card className="border-red-200"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{stats?.rejected ?? 0}</p><p className="text-xs text-muted-foreground">مرفوضة</p></CardContent></Card>
        <Card className="border-red-400 bg-red-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-700">{stats?.urgent ?? 0}</p><p className="text-xs text-red-600">عاجلة</p></CardContent></Card>
      </div>

      {/* فلاتر */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2"><Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
            <SelectTrigger className="w-40"><SelectValue placeholder="الحالة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="pending">قيد الانتظار</SelectItem>
              <SelectItem value="approved">موافق عليها</SelectItem>
              <SelectItem value="rejected">مرفوضة</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={v => setTypeFilter(v as any)}>
            <SelectTrigger className="w-40"><SelectValue placeholder="النوع" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="maintenance">صيانة</SelectItem>
              <SelectItem value="expense">مصروف</SelectItem>
              <SelectItem value="contract">عقد</SelectItem>
              <SelectItem value="transfer">تحويل</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* قائمة الطلبات */}
      <div className="space-y-3">
        {approvals.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>لا توجد طلبات موافقة</p>
          </CardContent></Card>
        ) : approvals.map(approval => {
          const StatusIcon = STATUS_CONFIG[approval.status]?.icon ?? Clock;
          return (
            <Card key={approval.id} className={approval.priority === "urgent" ? "border-red-300" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_CONFIG[approval.priority]?.color}`}>
                        {PRIORITY_CONFIG[approval.priority]?.label}
                      </span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {TYPE_LABELS[approval.requestType] ?? approval.requestType}
                      </span>
                    </div>
                    <h3 className="font-semibold">{approval.title}</h3>
                    {approval.description && <p className="text-sm text-muted-foreground mt-1">{approval.description}</p>}
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      {approval.amount && <span>المبلغ: <strong>{Number(approval.amount).toLocaleString("ar-SA")} ر.س</strong></span>}
                      {approval.requestedBy && <span>بواسطة: {approval.requestedBy}</span>}
                      <span>{new Date(approval.createdAt).toLocaleDateString("ar-SA")}</span>
                    </div>
                    {approval.status === "rejected" && approval.rejectionReason && (
                      <p className="text-xs text-red-600 mt-1">سبب الرفض: {approval.rejectionReason}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${STATUS_CONFIG[approval.status]?.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {STATUS_CONFIG[approval.status]?.label}
                    </span>
                    {approval.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50" onClick={() => approveMutation.mutate(approval.id)}>
                          <CheckCircle className="h-3 w-3 ml-1" /> موافقة
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-700 border-red-300 hover:bg-red-50" onClick={() => setRejectId(approval.id)}>
                          <XCircle className="h-3 w-3 ml-1" /> رفض
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog الرفض */}
      <Dialog open={rejectId !== null} onOpenChange={v => { if (!v) setRejectId(null); }}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>رفض الطلب</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>سبب الرفض</Label><Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="اكتب سبب الرفض..." /></div>
            <div className="flex gap-2">
              <Button className="flex-1" variant="destructive" onClick={() => { if (rejectId) rejectMutation.mutate({ id: rejectId, reason: rejectReason }); }}>تأكيد الرفض</Button>
              <Button className="flex-1" variant="outline" onClick={() => setRejectId(null)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
