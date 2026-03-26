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
import { Plus, FileText, QrCode, CheckCircle2, Clock, XCircle, AlertTriangle, Download, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "مسودة", color: "bg-gray-100 text-gray-700", icon: <Clock className="h-3 w-3" /> },
  issued: { label: "صادرة", color: "bg-blue-100 text-blue-700", icon: <FileText className="h-3 w-3" /> },
  paid: { label: "مدفوعة", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="h-3 w-3" /> },
  overdue: { label: "متأخرة", color: "bg-red-100 text-red-700", icon: <AlertTriangle className="h-3 w-3" /> },
  cancelled: { label: "ملغاة", color: "bg-gray-100 text-gray-500", icon: <XCircle className="h-3 w-3" /> },
};

type InvoiceItem = {
  id: number;
  invoiceNumber: string;
  amount: string;
  vatAmount: string | null;
  vatRate?: number | null;
  totalAmount: string;
  description: string | null;
  notes: string | null;
  issueDate: number;
  dueDate: number | null;
  status: string | null;
  qrCode: string | null;
  [key: string]: unknown;
};

export default function Invoices() {
  const [open, setOpen] = useState(false);
  const [qrDialog, setQrDialog] = useState<{ open: boolean; qr: string; number: string; inv?: InvoiceItem }>({ open: false, qr: "", number: "" });
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

  const buildPDF = (inv: InvoiceItem, qrDataUrl?: string) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Blue header
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, 210, 42, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Takaml Real Estate Management", 105, 14, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Al-Madinah Al-Munawwarah, Saudi Arabia  |  VAT No: 300000000000003", 105, 23, { align: "center" });
    doc.text("ZATCA Compliant Electronic Invoice", 105, 31, { align: "center" });
    doc.setFontSize(9);
    doc.text("Tel: +966 14 000 0000  |  info@takaml.sa  |  www.takaml.sa", 105, 38, { align: "center" });

    // Invoice title
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE  /  فاتورة إلكترونية", 105, 52, { align: "center" });

    // Info box
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 57, 182, 30, 3, 3, "FD");
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Invoice Number:", 18, 65);
    doc.text("Issue Date:", 18, 72);
    doc.text("Due Date:", 18, 79);
    doc.setFont("helvetica", "normal");
    doc.text(inv.invoiceNumber, 55, 65);
    doc.text(new Date(inv.issueDate).toLocaleDateString("en-GB"), 55, 72);
    doc.text(inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-GB") : "—", 55, 79);

    doc.setFont("helvetica", "bold");
    doc.text("Status:", 120, 65);
    doc.text("VAT Rate:", 120, 72);
    doc.setFont("helvetica", "normal");
    const st = STATUS_MAP[inv.status || "draft"];
    doc.text(st.label, 145, 65);
    doc.text(`${inv.vatRate || 15}%`, 145, 72);

    // Amounts table
    autoTable(doc, {
      startY: 93,
      head: [["Description / البيان", "Amount (SAR)", "VAT Rate", "VAT Amount", "Total (SAR)"]],
      body: [[
        inv.description || "Real Estate Service",
        parseFloat(inv.amount || "0").toFixed(2),
        `${inv.vatRate || 15}%`,
        parseFloat(inv.vatAmount || "0").toFixed(2),
        parseFloat(inv.totalAmount || "0").toFixed(2),
      ]],
      foot: [["", "", "", "Grand Total / الإجمالي:", parseFloat(inv.totalAmount || "0").toFixed(2) + " SAR"]],
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: "bold", fontSize: 9, halign: "center" },
      footStyles: { fillColor: [240, 245, 255], textColor: [30, 64, 175], fontStyle: "bold", fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 70 }, 1: { halign: "right" }, 2: { halign: "center" }, 3: { halign: "right" }, 4: { halign: "right", fontStyle: "bold" } },
      margin: { left: 14, right: 14 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;

    // QR section
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(14, finalY, 80, 58, 3, 3, "FD");
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("ZATCA QR Code", 54, finalY + 8, { align: "center" });
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, "PNG", 24, finalY + 12, 40, 40);
    }
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.text("Scan with ZATCA Fatoora App", 54, finalY + 55, { align: "center" });

    // Notes
    if (inv.notes) {
      doc.setFillColor(255, 251, 235);
      doc.setDrawColor(251, 191, 36);
      doc.roundedRect(100, finalY, 96, 30, 3, 3, "FD");
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Notes / ملاحظات:", 104, finalY + 8);
      doc.setFont("helvetica", "normal");
      const noteLines = doc.splitTextToSize(inv.notes, 88);
      doc.text(noteLines.slice(0, 3), 104, finalY + 15);
    }

    // Footer
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 280, 210, 17, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("This is a ZATCA-compliant electronic invoice generated by Takaml Real Estate Management System", 105, 288, { align: "center" });
    doc.text("هذه فاتورة إلكترونية متوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك", 105, 293, { align: "center" });

    doc.save(`invoice_${inv.invoiceNumber}.pdf`);
    toast.success(`تم تصدير الفاتورة ${inv.invoiceNumber} بصيغة PDF ✅`);
  };

  const exportInvoicePDF = (inv: InvoiceItem) => {
    // Try to get QR SVG from DOM
    const svgEl = document.querySelector(`[data-invoice-id="${inv.id}"] svg`) as SVGElement | null;
    if (svgEl) {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const canvas = document.createElement("canvas");
      canvas.width = 200; canvas.height = 200;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        ctx?.drawImage(img, 0, 0);
        buildPDF(inv, canvas.toDataURL("image/png"));
      };
      img.onerror = () => buildPDF(inv);
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    } else if (inv.qrCode) {
      // Render hidden QR then capture
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      document.body.appendChild(tempDiv);
      // Use a timeout to let React render
      setTimeout(() => {
        document.body.removeChild(tempDiv);
        buildPDF(inv);
      }, 100);
    } else {
      buildPDF(inv);
    }
  };

  const downloadQR = (qrCode: string, invoiceNumber: string) => {
    const svgEl = document.getElementById("qr-svg-container")?.querySelector("svg") as SVGElement | null;
    if (!svgEl) { toast.error("QR Code غير موجود"); return; }
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement("canvas");
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.download = `qr_${invoiceNumber}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      toast.success("تم تنزيل QR Code");
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
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
                            {/* Hidden QR for PDF capture */}
                            {inv.qrCode && (
                              <div data-invoice-id={inv.id} className="hidden">
                                <QRCodeSVG value={inv.qrCode} size={200} level="M" includeMargin />
                              </div>
                            )}
                            {inv.qrCode && (
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="عرض QR Code"
                                onClick={() => setQrDialog({ open: true, qr: inv.qrCode!, number: inv.invoiceNumber, inv })}>
                                <QrCode className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700" title="تحميل PDF"
                              onClick={() => exportInvoicePDF(inv as unknown as InvoiceItem)}>
                              <Printer className="h-3.5 w-3.5" />
                            </Button>
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
            <div className="bg-muted/30 rounded-lg p-3 text-xs font-mono break-all text-muted-foreground max-h-16 overflow-auto">
              {qrDialog.qr}
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 gap-2" onClick={() => downloadQR(qrDialog.qr, qrDialog.number)}>
                <Download className="h-4 w-4" />
                تنزيل QR
              </Button>
                {qrDialog.inv && (
                <Button variant="outline" className="flex-1 gap-2" onClick={() => { exportInvoicePDF(qrDialog.inv as unknown as InvoiceItem); }}>
                  <Printer className="h-4 w-4" />
                  PDF
                </Button>
              )}
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
