import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Plus, Search, FileText, TrendingUp, TrendingDown, Scale,
  Printer, X, ChevronLeft, ChevronRight, Eye, Ban
} from "lucide-react";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "نقداً",
  bank_transfer: "تحويل بنكي",
  check: "شيك",
  online: "إلكتروني",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  issued: { label: "صادر", color: "bg-green-100 text-green-700" },
  draft: { label: "مسودة", color: "bg-yellow-100 text-yellow-700" },
  cancelled: { label: "ملغي", color: "bg-red-100 text-red-700" },
};

function formatAmount(amount: string | number) {
  return Number(amount).toLocaleString("ar-SA", { style: "currency", currency: "SAR" });
}

function formatDate(ts: number | null | undefined) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("ar-SA");
}

export default function Vouchers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "receipt" | "payment">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "issued" | "cancelled">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<number | null>(null);
  const [createType, setCreateType] = useState<"receipt" | "payment">("receipt");

  // Form state
  const [form, setForm] = useState<{
    amount: string;
    description: string;
    payerName: string;
    payerPhone: string;
    receiverName: string;
    paymentMethod: "cash" | "bank_transfer" | "check" | "online";
    bankName: string;
    checkNumber: string;
    relatedContractId: string;
    relatedPaymentId: string;
    relatedPropertyId: string;
    notes: string;
  }>({
    amount: "",
    description: "",
    payerName: "",
    payerPhone: "",
    receiverName: "",
    paymentMethod: "cash",
    bankName: "",
    checkNumber: "",
    relatedContractId: "",
    relatedPaymentId: "",
    relatedPropertyId: "",
    notes: "",
  });

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.vouchers.list.useQuery({
    page,
    limit: 20,
    type: typeFilter,
    status: statusFilter,
    search: search || undefined,
  });

  const { data: stats } = trpc.vouchers.stats.useQuery();
  const { data: detail } = trpc.vouchers.getById.useQuery(showDetail!, { enabled: showDetail !== null });

  const createMutation = trpc.vouchers.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء السند بنجاح");
      utils.vouchers.list.invalidate();
      utils.vouchers.stats.invalidate();
      setShowCreate(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const cancelMutation = trpc.vouchers.cancel.useMutation({
    onSuccess: () => {
      toast.success("تم إلغاء السند");
      utils.vouchers.list.invalidate();
      utils.vouchers.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setForm({
      amount: "", description: "", payerName: "", payerPhone: "",
      receiverName: "", paymentMethod: "cash", bankName: "",
      checkNumber: "", relatedContractId: "", relatedPaymentId: "",
      relatedPropertyId: "", notes: "",
    });
  }

  function handleCreate() {
    if (!form.amount || isNaN(Number(form.amount))) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }
    createMutation.mutate({
      type: createType,
      amount: Number(form.amount),
      description: form.description || undefined,
      payerName: form.payerName || undefined,
      payerPhone: form.payerPhone || undefined,
      receiverName: form.receiverName || undefined,
      paymentMethod: form.paymentMethod,
      bankName: form.bankName || undefined,
      checkNumber: form.checkNumber || undefined,
      relatedContractId: form.relatedContractId ? Number(form.relatedContractId) : undefined,
      relatedPaymentId: form.relatedPaymentId ? Number(form.relatedPaymentId) : undefined,
      relatedPropertyId: form.relatedPropertyId ? Number(form.relatedPropertyId) : undefined,
      notes: form.notes || undefined,
    });
  }

  function handlePrint(voucher: NonNullable<typeof detail>) {
    const win = window.open("", "_blank");
    if (!win) return;
    const typeLabel = voucher.type === "receipt" ? "سند قبض" : "سند صرف";
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${typeLabel} رقم ${voucher.voucherNumber}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 0; padding: 20px; color: #1a1a1a; }
          .header { text-align: center; border-bottom: 3px double #1a1a1a; padding-bottom: 15px; margin-bottom: 20px; }
          .header h1 { font-size: 28px; margin: 0 0 5px; }
          .header h2 { font-size: 18px; margin: 0; color: #555; }
          .voucher-number { font-size: 14px; color: #777; margin-top: 5px; }
          .amount-box { background: #f0f0f0; border: 2px solid #333; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0; }
          .amount-box .label { font-size: 14px; color: #555; }
          .amount-box .amount { font-size: 32px; font-weight: bold; color: #1a1a1a; }
          .details { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
          .detail-row { display: flex; gap: 8px; padding: 8px; background: #f9f9f9; border-radius: 4px; }
          .detail-label { font-weight: bold; color: #555; min-width: 120px; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; }
          .sig-box { text-align: center; border-top: 1px solid #333; padding-top: 10px; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>شركة تكامل لإدارة الأملاك</h1>
          <h2>${typeLabel}</h2>
          <div class="voucher-number">رقم السند: ${voucher.voucherNumber}</div>
        </div>
        <div class="amount-box">
          <div class="label">المبلغ</div>
          <div class="amount">${formatAmount(voucher.amount)}</div>
        </div>
        <div class="details">
          <div class="detail-row"><span class="detail-label">التاريخ:</span><span>${formatDate(voucher.issuedAt)}</span></div>
          <div class="detail-row"><span class="detail-label">طريقة الدفع:</span><span>${PAYMENT_METHOD_LABELS[voucher.paymentMethod ?? "cash"] ?? "—"}</span></div>
          ${voucher.payerName ? `<div class="detail-row"><span class="detail-label">المدفوع من:</span><span>${voucher.payerName}</span></div>` : ""}
          ${voucher.receiverName ? `<div class="detail-row"><span class="detail-label">المدفوع لـ:</span><span>${voucher.receiverName}</span></div>` : ""}
          ${voucher.bankName ? `<div class="detail-row"><span class="detail-label">البنك:</span><span>${voucher.bankName}</span></div>` : ""}
          ${voucher.checkNumber ? `<div class="detail-row"><span class="detail-label">رقم الشيك:</span><span>${voucher.checkNumber}</span></div>` : ""}
          ${voucher.description ? `<div class="detail-row" style="grid-column:span 2"><span class="detail-label">البيان:</span><span>${voucher.description}</span></div>` : ""}
          ${voucher.notes ? `<div class="detail-row" style="grid-column:span 2"><span class="detail-label">ملاحظات:</span><span>${voucher.notes}</span></div>` : ""}
        </div>
        <div class="signatures">
          <div class="sig-box"><p>توقيع المستلم</p></div>
          <div class="sig-box"><p>توقيع المحاسب</p></div>
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `;
    win.document.write(html);
    win.document.close();
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">سندات القبض والصرف</h1>
            <p className="text-muted-foreground text-sm mt-1">إدارة سندات القبض والصرف المالية</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { setCreateType("receipt"); setShowCreate(true); }} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 ml-1" /> سند قبض
            </Button>
            <Button onClick={() => { setCreateType("payment"); setShowCreate(true); }} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
              <Plus className="w-4 h-4 ml-1" /> سند صرف
            </Button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">إجمالي المقبوض</p>
                  <p className="text-lg font-bold text-green-700">{formatAmount(stats.receiptAmount)}</p>
                  <p className="text-xs text-muted-foreground">{stats.totalReceipts} سند</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <TrendingDown className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-xs text-muted-foreground">إجمالي المصروف</p>
                  <p className="text-lg font-bold text-red-700">{formatAmount(stats.paymentAmount)}</p>
                  <p className="text-xs text-muted-foreground">{stats.totalPayments} سند</p>
                </div>
              </CardContent>
            </Card>
            <Card className={`border-2 ${stats.balance >= 0 ? "border-blue-200 bg-blue-50 dark:bg-blue-950/20" : "border-orange-200 bg-orange-50 dark:bg-orange-950/20"}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <Scale className={`w-8 h-8 ${stats.balance >= 0 ? "text-blue-600" : "text-orange-600"}`} />
                <div>
                  <p className="text-xs text-muted-foreground">الرصيد الصافي</p>
                  <p className={`text-lg font-bold ${stats.balance >= 0 ? "text-blue-700" : "text-orange-700"}`}>{formatAmount(stats.balance)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <FileText className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">إجمالي السندات</p>
                  <p className="text-lg font-bold">{(stats.totalReceipts + stats.totalPayments)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم السند أو الاسم..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pr-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={(v: any) => { setTypeFilter(v); setPage(1); }}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="receipt">سندات قبض</SelectItem>
                  <SelectItem value="payment">سندات صرف</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v: any) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="issued">صادر</SelectItem>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {isLoading ? "جاري التحميل..." : `${data?.total ?? 0} سند`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-right p-3 font-medium">رقم السند</th>
                    <th className="text-right p-3 font-medium">النوع</th>
                    <th className="text-right p-3 font-medium">المبلغ</th>
                    <th className="text-right p-3 font-medium">البيان</th>
                    <th className="text-right p-3 font-medium">طريقة الدفع</th>
                    <th className="text-right p-3 font-medium">التاريخ</th>
                    <th className="text-right p-3 font-medium">الحالة</th>
                    <th className="text-right p-3 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b animate-pulse">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="p-3"><div className="h-4 bg-muted rounded w-20" /></td>
                        ))}
                      </tr>
                    ))
                  ) : data?.items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>لا توجد سندات</p>
                      </td>
                    </tr>
                  ) : data?.items.map((v) => {
                    const st = STATUS_LABELS[v.status ?? "issued"];
                    return (
                      <tr key={v.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono text-xs font-medium">{v.voucherNumber}</td>
                        <td className="p-3">
                          <Badge className={v.type === "receipt" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}>
                            {v.type === "receipt" ? "قبض" : "صرف"}
                          </Badge>
                        </td>
                        <td className="p-3 font-bold">{formatAmount(v.amount)}</td>
                        <td className="p-3 text-muted-foreground max-w-[200px] truncate">{v.description ?? "—"}</td>
                        <td className="p-3">{PAYMENT_METHOD_LABELS[v.paymentMethod ?? "cash"]}</td>
                        <td className="p-3 text-muted-foreground">{formatDate(v.issuedAt)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setShowDetail(v.id)} title="عرض">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {v.status !== "cancelled" && (
                              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => cancelMutation.mutate(v.id)} title="إلغاء">
                                <Ban className="w-4 h-4" />
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
            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-muted-foreground">
                  صفحة {data.page} من {data.totalPages} — {data.total} سند
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${createType === "receipt" ? "bg-green-500" : "bg-red-500"}`} />
              {createType === "receipt" ? "إنشاء سند قبض" : "إنشاء سند صرف"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>المبلغ (ريال سعودي) *</Label>
                <Input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>البيان / الوصف</Label>
                <Input placeholder="وصف السند..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <Label>{createType === "receipt" ? "المدفوع من" : "المدفوع إليه"}</Label>
                <Input placeholder="الاسم" value={form.payerName} onChange={e => setForm(f => ({ ...f, payerName: e.target.value }))} />
              </div>
              <div>
                <Label>رقم الجوال</Label>
                <Input placeholder="05xxxxxxxx" value={form.payerPhone} onChange={e => setForm(f => ({ ...f, payerPhone: e.target.value }))} />
              </div>
              <div>
                <Label>المستلم</Label>
                <Input placeholder="اسم المستلم" value={form.receiverName} onChange={e => setForm(f => ({ ...f, receiverName: e.target.value }))} />
              </div>
              <div>
                <Label>طريقة الدفع</Label>
                <Select value={form.paymentMethod} onValueChange={(v: any) => setForm(f => ({ ...f, paymentMethod: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">نقداً</SelectItem>
                    <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                    <SelectItem value="check">شيك</SelectItem>
                    <SelectItem value="online">إلكتروني</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(form.paymentMethod === "bank_transfer" || form.paymentMethod === "check") && (
                <>
                  <div>
                    <Label>اسم البنك</Label>
                    <Input placeholder="البنك الأهلي..." value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} />
                  </div>
                  {form.paymentMethod === "check" && (
                    <div>
                      <Label>رقم الشيك</Label>
                      <Input placeholder="رقم الشيك" value={form.checkNumber} onChange={e => setForm(f => ({ ...f, checkNumber: e.target.value }))} />
                    </div>
                  )}
                </>
              )}
              <div>
                <Label>رقم العقد (اختياري)</Label>
                <Input type="number" placeholder="ID العقد" value={form.relatedContractId} onChange={e => setForm(f => ({ ...f, relatedContractId: e.target.value }))} />
              </div>
              <div>
                <Label>رقم الدفعة (اختياري)</Label>
                <Input type="number" placeholder="ID الدفعة" value={form.relatedPaymentId} onChange={e => setForm(f => ({ ...f, relatedPaymentId: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>ملاحظات</Label>
                <Textarea placeholder="ملاحظات إضافية..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>إلغاء</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} className={createType === "receipt" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}>
              {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء السند"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetail !== null} onOpenChange={() => setShowDetail(null)}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل السند</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">رقم السند</p>
                  <p className="font-mono font-bold">{detail.voucherNumber}</p>
                </div>
                <Badge className={detail.type === "receipt" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                  {detail.type === "receipt" ? "سند قبض" : "سند صرف"}
                </Badge>
              </div>
              <div className="text-center py-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">المبلغ</p>
                <p className="text-3xl font-bold">{formatAmount(detail.amount)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {detail.payerName && <div><p className="text-muted-foreground">من</p><p className="font-medium">{detail.payerName}</p></div>}
                {detail.receiverName && <div><p className="text-muted-foreground">إلى</p><p className="font-medium">{detail.receiverName}</p></div>}
                <div><p className="text-muted-foreground">طريقة الدفع</p><p className="font-medium">{PAYMENT_METHOD_LABELS[detail.paymentMethod ?? "cash"]}</p></div>
                <div><p className="text-muted-foreground">التاريخ</p><p className="font-medium">{formatDate(detail.issuedAt)}</p></div>
                {detail.description && <div className="col-span-2"><p className="text-muted-foreground">البيان</p><p className="font-medium">{detail.description}</p></div>}
                {detail.notes && <div className="col-span-2"><p className="text-muted-foreground">ملاحظات</p><p className="font-medium">{detail.notes}</p></div>}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDetail(null)}>
              <X className="w-4 h-4 ml-1" /> إغلاق
            </Button>
            {detail && (
              <Button onClick={() => handlePrint(detail)} className="bg-blue-600 hover:bg-blue-700">
                <Printer className="w-4 h-4 ml-1" /> طباعة السند
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
