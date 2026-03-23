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
import { Plus, FileText, QrCode, CheckCircle2, Clock, XCircle, AlertTriangle, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "مسودة", color: "bg-gray-100 text-gray-700", icon: <Clock className="h-3 w-3" /> },
  issued: { label: "صادرة", color: "bg-blue-100 text-blue-700", icon: <FileText className="h-3 w-3" /> },
  paid: { label: "مدفوعة", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="h-3 w-3" /> },
  overdue: { label: "متأخرة", color: "bg-red-100 text-red-700", icon: <AlertTriangle className="h-3 w-3" /> },
  cancelled: { label: "ملغاة", color: "bg-gray-100 text-gray-500", icon: <XCircle className="h-3 w-3" /> },
};

export default function Invoices() {
  const [open, setOpen] = useState(false);
  const [qrDialog, setQrDialog] = useState<{ open: boolean; qr: string; number: string }>({ open: false, qr: "", number: "" });
  const [form, setForm] = useState({
    amount: "",
    vatRate: 15,
    description: "",
    notes: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
  });

  const utils = trpc.useUtils();
  const { data: invoiceList, isLoading } = trpc.invoices.list.useQuery({ limit: 100 });
  const { data: stats } = trpc.invoices.stats.useQuery();

  const createMutation = trpc.invoices.create.useMutation({
    onSuccess: (data) => {
      toast.success(`تم إنشاء الفاتورة ${data.invoiceNumber}`);
      setOpen(false);
      setQrDialog({ open: true, qr: data.qrCode, number: data.invoiceNumber });
      utils.invoices.list.invalidate();
      utils.invoices.stats.invalidate();
    },
    onError: () => toast.error("فشل إنشاء الفاتورة"),
  });

  const updateStatusMutation = trpc.invoices.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة الفاتورة");
      utils.invoices.list.invalidate();
      utils.invoices.stats.invalidate();
    },
  });

  const deleteMutation = trpc.invoices.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الفاتورة");
      utils.invoices.list.invalidate();
      utils.invoices.stats.invalidate();
    },
  });

  const handleCreate = () => {
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error("أدخل مبلغاً صحيحاً"); return; }
    createMutation.mutate({
      amount: form.amount,
      vatRate: form.vatRate,
      description: form.description,
      notes: form.notes,
      issueDate: new Date(form.issueDate).getTime(),
      dueDate: new Date(form.dueDate).getTime(),
    });
  };

  const downloadQR = (qrCode: string, invoiceNumber: string) => {
    const svgEl = document.getElementById('qr-svg-container')?.querySelector('svg') as SVGElement | null;
    if (!svgEl) { toast.error('QR Code غير موجود'); return; }
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.download = `qr_${invoiceNumber}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
      toast.success('تم تنزيل QR Code');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const vatAmount = form.amount ? (parseFloat(form.amount) * form.vatRate) / 100 : 0;
  const totalAmount = form.amount ? parseFloat(form.amount) + vatAmount : 0;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الفواتير الإلكترونية</h1>
          <p className="text-muted-foreground mt-1">إصدار فواتير متوافقة مع متطلبات هيئة الزكاة والضريبة (ZATCA)</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              فاتورة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>إصدار فاتورة إلكترونية</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>المبلغ (ر.س)</Label>
                  <Input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>نسبة الضريبة %</Label>
                  <Select value={String(form.vatRate)} onValueChange={v => setForm(p => ({ ...p, vatRate: Number(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0% (معفى)</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="15">15% (قياسي)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {form.amount && (
                <div className="rounded-lg bg-muted/30 p-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span>المبلغ قبل الضريبة:</span><span>{parseFloat(form.amount).toLocaleString("ar-SA")} ر.س</span></div>
                  <div className="flex justify-between text-amber-600"><span>ضريبة القيمة المضافة ({form.vatRate}%):</span><span>{vatAmount.toLocaleString("ar-SA")} ر.س</span></div>
                  <div className="flex justify-between font-bold border-t pt-1"><span>الإجمالي:</span><span>{totalAmount.toLocaleString("ar-SA")} ر.س</span></div>
                </div>
              )}

              <div className="space-y-1">
                <Label>البيان</Label>
                <Input placeholder="إيجار شهر يناير 2026..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>تاريخ الإصدار</Label>
                  <Input type="date" value={form.issueDate} onChange={e => setForm(p => ({ ...p, issueDate: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>تاريخ الاستحقاق</Label>
                  <Input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-1">
                <Label>ملاحظات</Label>
                <Input placeholder="ملاحظات اختيارية..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>

              <Button className="w-full" onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "جاري الإصدار..." : "إصدار الفاتورة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "إجمالي الفواتير", value: stats.total, color: "text-foreground" },
            { label: "مدفوعة", value: stats.paid, color: "text-green-600" },
            { label: "معلقة", value: stats.pending, color: "text-blue-600" },
            { label: "متأخرة", value: stats.overdue, color: "text-red-600" },
            { label: "إجمالي المبالغ", value: `${stats.totalAmount.toLocaleString("ar-SA")} ر.س`, color: "text-foreground" },
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

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            قائمة الفواتير
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : !invoiceList?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد فواتير بعد</p>
              <p className="text-sm">أنشئ أول فاتورة إلكترونية متوافقة مع ZATCA</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="p-3 text-right font-medium">رقم الفاتورة</th>
                    <th className="p-3 text-right font-medium">البيان</th>
                    <th className="p-3 text-left font-medium">المبلغ</th>
                    <th className="p-3 text-left font-medium">الضريبة</th>
                    <th className="p-3 text-left font-medium">الإجمالي</th>
                    <th className="p-3 text-right font-medium">تاريخ الإصدار</th>
                    <th className="p-3 text-right font-medium">الحالة</th>
                    <th className="p-3 text-right font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceList.map(inv => {
                    const st = STATUS_MAP[inv.status || "draft"];
                    return (
                      <tr key={inv.id} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-mono text-xs font-medium">{inv.invoiceNumber}</td>
                        <td className="p-3 text-muted-foreground">{inv.description || "—"}</td>
                        <td className="p-3 text-left">{parseFloat(inv.amount || "0").toLocaleString("ar-SA")}</td>
                        <td className="p-3 text-left text-amber-600">{parseFloat(inv.vatAmount || "0").toLocaleString("ar-SA")}</td>
                        <td className="p-3 text-left font-medium">{parseFloat(inv.totalAmount || "0").toLocaleString("ar-SA")}</td>
                        <td className="p-3">{new Date(inv.issueDate).toLocaleDateString("ar-SA")}</td>
                        <td className="p-3">
                          <Badge className={`gap-1 ${st.color} border-0`}>
                            {st.icon}{st.label}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            {inv.qrCode && (
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                                onClick={() => setQrDialog({ open: true, qr: inv.qrCode!, number: inv.invoiceNumber })}>
                                <QrCode className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {inv.status === "issued" && (
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-green-600 hover:text-green-700"
                                onClick={() => updateStatusMutation.mutate({ id: inv.id, status: "paid", paidDate: Date.now() })}>
                                تحصيل
                              </Button>
                            )}
                            {(inv.status === "draft" || inv.status === "issued") && (
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500 hover:text-red-600"
                                onClick={() => deleteMutation.mutate(inv.id)}>
                                حذف
                              </Button>
                            )}
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

      {/* QR Dialog */}
      <Dialog open={qrDialog.open} onOpenChange={v => setQrDialog(p => ({ ...p, open: v }))}>
        <DialogContent className="max-w-sm text-center" dir="rtl">
          <DialogHeader>
            <DialogTitle>QR Code الفاتورة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground font-mono">{qrDialog.number}</p>
            <div id="qr-svg-container" className="bg-white p-4 rounded-xl border-2 border-dashed border-muted mx-auto w-fit">
              {qrDialog.qr ? (
                <QRCodeSVG value={qrDialog.qr} size={200} level="M" includeMargin />
              ) : (
                <QrCode className="h-24 w-24 text-gray-800" />
              )}
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-xs font-mono break-all text-muted-foreground">
              {qrDialog.qr}
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 gap-2" onClick={() => downloadQR(qrDialog.qr, qrDialog.number)}>
                <Download className="h-4 w-4" />
                تنزيل QR
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setQrDialog(p => ({ ...p, open: false }))}>
                إغلاق
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              هذا الـ QR Code متوافق مع متطلبات هيئة الزكاة والضريبة والجمارك (ZATCA)
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
