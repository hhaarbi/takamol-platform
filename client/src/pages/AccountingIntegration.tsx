import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calculator, Download, Clock, CheckCircle, RefreshCw, FileText, TrendingUp, DollarSign, Receipt } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AccountingIntegration() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [activeSystem, setActiveSystem] = useState<"quickbooks" | "odoo" | "sap" | "vat" | null>(null);
  const [vatYear, setVatYear] = useState<number>(new Date().getFullYear());
  const [vatQuarter, setVatQuarter] = useState<number>(Math.ceil((new Date().getMonth() + 1) / 3));

  const { data: history, refetch: refetchHistory } = trpc.accountingDirect.getHistory.useQuery();

  const exportQB = trpc.accountingDirect.exportQuickBooks.useMutation({
    onSuccess: (data) => {
      toast.success(`تم تصدير ${data.recordsCount} سجل بتنسيق QuickBooks IIF`);
      downloadFile(data.content, `quickbooks-export-${dateFrom}-${dateTo}.iif`, "text/plain");
      refetchHistory();
      setActiveSystem(null);
    },
    onError: (err) => { toast.error(err.message); setActiveSystem(null); },
  });

  const exportOdoo = trpc.accountingDirect.exportOdoo.useMutation({
    onSuccess: (data) => {
      toast.success(`تم تصدير ${data.recordsCount} سجل بتنسيق Odoo CSV`);
      downloadFile(data.content, `odoo-export-${dateFrom}-${dateTo}.csv`, "text/csv;charset=utf-8;");
      refetchHistory();
      setActiveSystem(null);
    },
    onError: (err) => { toast.error(err.message); setActiveSystem(null); },
  });

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob(["\uFEFF" + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = (system: "quickbooks" | "odoo") => {
    setActiveSystem(system);
    const from = new Date(dateFrom).getTime();
    const to = new Date(dateTo + "T23:59:59").getTime();
    if (system === "quickbooks") {
      exportQB.mutate({ dateFrom: from, dateTo: to });
    } else {
      exportOdoo.mutate({ dateFrom: from, dateTo: to });
    }
  };

  const exportSAP = trpc.sapExport.useMutation({
    onSuccess: (data) => {
      toast.success(`تم تصدير ${data.recordsCount} سجل بتنسيق SAP IDOC XML`);
      if (data.url) window.open(data.url, '_blank');
      refetchHistory();
      setActiveSystem(null);
    },
    onError: (err) => { toast.error(err.message); setActiveSystem(null); },
  });

  const exportVAT = trpc.vatReport.useMutation({
    onSuccess: (data) => {
      toast.success(`تقرير VAT: إجمالي ${data.totalRevenue.toLocaleString()} ر.س | ضريبة ${data.vatAmount.toLocaleString()} ر.س`);
      if (data.url) window.open(data.url, '_blank');
      refetchHistory();
      setActiveSystem(null);
    },
    onError: (err) => { toast.error(err.message); setActiveSystem(null); },
  });

  const handleExportSAP = () => {
    setActiveSystem('sap');
    exportSAP.mutate({ dateFrom: new Date(dateFrom).getTime(), dateTo: new Date(dateTo + 'T23:59:59').getTime() });
  };

  const handleExportVAT = () => {
    setActiveSystem('vat');
    exportVAT.mutate({ year: vatYear, quarter: vatQuarter });
  };

  const exportTypeMap: Record<string, { label: string; color: string }> = {
    quickbooks: { label: "QuickBooks", color: "bg-green-100 text-green-800" },
    odoo: { label: "Odoo", color: "bg-purple-100 text-purple-800" },
    sap_xml: { label: "SAP IDOC", color: "bg-orange-100 text-orange-800" },
    zoho: { label: "Zoho Books", color: "bg-blue-100 text-blue-800" },
  };
  const vatQuarterMap: Record<string, string> = {};
  for (let y = new Date().getFullYear(); y >= new Date().getFullYear() - 2; y--) {
    for (let q = 4; q >= 1; q--) {
      vatQuarterMap[`vat_q${q}_${y}`] = `VAT Q${q} ${y}`;
    }
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
          <Calculator className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">التكامل المحاسبي</h1>
          <p className="text-muted-foreground text-sm">تصدير البيانات المالية مباشرة إلى أنظمة المحاسبة</p>
        </div>
      </div>

      {/* System Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QuickBooks */}
        <Card className="border-2 hover:border-green-300 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">QB</div>
              <div>
                <CardTitle>QuickBooks</CardTitle>
                <p className="text-sm text-muted-foreground">تنسيق IIF للاستيراد المباشر</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">من تاريخ</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">إلى تاريخ</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                />
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-sm text-green-800 space-y-1">
              <div className="font-medium">ما يتم تصديره:</div>
              <ul className="text-xs space-y-0.5 list-disc list-inside">
                <li>الفواتير والمدفوعات (INVOICE)</li>
                <li>إيرادات الإيجار (Rental Income)</li>
                <li>الحسابات المدينة (Accounts Receivable)</li>
              </ul>
            </div>
            <Button
              onClick={() => handleExport("quickbooks")}
              disabled={exportQB.isPending}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {exportQB.isPending && activeSystem === "quickbooks" ? (
                <><RefreshCw className="w-4 h-4 ml-1 animate-spin" /> جاري التصدير...</>
              ) : (
                <><Download className="w-4 h-4 ml-1" /> تصدير IIF</>
              )}
            </Button>
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">طريقة الاستيراد:</span> في QuickBooks → File → Utilities → Import → IIF Files
            </div>
          </CardContent>
        </Card>

        {/* Odoo */}
        <Card className="border-2 hover:border-purple-300 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">OD</div>
              <div>
                <CardTitle>Odoo</CardTitle>
                <p className="text-sm text-muted-foreground">تنسيق CSV للاستيراد المباشر</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">من تاريخ</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">إلى تاريخ</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                />
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-sm text-purple-800 space-y-1">
              <div className="font-medium">ما يتم تصديره:</div>
              <ul className="text-xs space-y-0.5 list-disc list-inside">
                <li>قيود اليومية (Journal Entries)</li>
                <li>حسابات الشركاء (Partners)</li>
                <li>رموز الحسابات المحاسبية</li>
              </ul>
            </div>
            <Button
              onClick={() => handleExport("odoo")}
              disabled={exportOdoo.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {exportOdoo.isPending && activeSystem === "odoo" ? (
                <><RefreshCw className="w-4 h-4 ml-1 animate-spin" /> جاري التصدير...</>
              ) : (
                <><Download className="w-4 h-4 ml-1" /> تصدير CSV</>
              )}
            </Button>
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">طريقة الاستيراد:</span> في Odoo → Accounting → Journal Entries → Import
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SAP + VAT Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SAP */}
        <Card className="border-2 hover:border-orange-300 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">SAP</div>
              <div>
                <CardTitle>SAP ERP</CardTitle>
                <p className="text-sm text-muted-foreground">تنسيق IDOC XML للاستيراد المباشر</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">من تاريخ</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">إلى تاريخ</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-sm text-orange-800 space-y-1">
              <div className="font-medium">ما يتم تصديره:</div>
              <ul className="text-xs space-y-0.5 list-disc list-inside">
                <li>IDOC بتنسيق FIDCCP02</li>
                <li>بيانات الشركة (COMP_CODE: 1000)</li>
                <li>قيود الإيرادات (DOC_TYPE: RV)</li>
              </ul>
            </div>
            <Button onClick={handleExportSAP} disabled={exportSAP.isPending} className="w-full bg-orange-600 hover:bg-orange-700">
              {exportSAP.isPending && activeSystem === 'sap' ? (
                <><RefreshCw className="w-4 h-4 ml-1 animate-spin" /> جاري التصدير...</>
              ) : (
                <><Download className="w-4 h-4 ml-1" /> تصدير SAP XML</>
              )}
            </Button>
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">طريقة الاستيراد:</span> SAP → IDOC → File Port → Import IDOC
            </div>
          </CardContent>
        </Card>

        {/* VAT Report */}
        <Card className="border-2 hover:border-red-300 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <CardTitle>ضريبة القيمة المضافة (VAT)</CardTitle>
                <p className="text-sm text-muted-foreground">تقرير ربعي VAT 15% لهيئة الزكاة</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">السنة</label>
                <Select value={String(vatYear)} onValueChange={v => setVatYear(Number(v))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[0,1,2].map(i => (
                      <SelectItem key={i} value={String(new Date().getFullYear() - i)}>{new Date().getFullYear() - i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">الربع</label>
                <Select value={String(vatQuarter)} onValueChange={v => setVatQuarter(Number(v))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Q1 (يناير - مارس)</SelectItem>
                    <SelectItem value="2">Q2 (أبريل - يونيو)</SelectItem>
                    <SelectItem value="3">Q3 (يوليو - سبتمبر)</SelectItem>
                    <SelectItem value="4">Q4 (أكتوبر - ديسمبر)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-sm text-red-800 space-y-1">
              <div className="font-medium">ما يتضمنه التقرير:</div>
              <ul className="text-xs space-y-0.5 list-disc list-inside">
                <li>إجمالي الإيرادات الخاضعة للضريبة</li>
                <li>مبلغ ضريبة القيمة المضافة (15%)</li>
                <li>صافي الإيرادات بعد الضريبة</li>
              </ul>
            </div>
            <Button onClick={handleExportVAT} disabled={exportVAT.isPending} className="w-full bg-red-600 hover:bg-red-700">
              {exportVAT.isPending && activeSystem === 'vat' ? (
                <><RefreshCw className="w-4 h-4 ml-1 animate-spin" /> جاري إنشاء التقرير...</>
              ) : (
                <><Receipt className="w-4 h-4 ml-1" /> إنشاء تقرير VAT</>
              )}
            </Button>
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">تقديم إلكتروني:</span> هيئة الزكاة → بوابة المكلف → إقرار ضريبة القيمة المضافة
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" /> سجل التصديرات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!history || history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">لا توجد تصديرات سابقة</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${exportTypeMap[h.exportType]?.color ?? "bg-gray-100 text-gray-800"}`}>
                        {exportTypeMap[h.exportType]?.label ?? h.exportType}
                      </span>
                      <span className="text-sm mr-2">{h.recordsCount} سجل</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {h.createdAt ? new Date(h.createdAt).toLocaleDateString("ar-SA") : "-"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">نصيحة للتكامل الأمثل</div>
              <p>يُنصح بتصدير البيانات أسبوعياً أو شهرياً. تأكد من مطابقة رموز الحسابات مع مخطط الحسابات في نظامك المحاسبي قبل الاستيراد.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
