import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Download, Database, FileSpreadsheet, FileText, BookOpen, Archive, CheckCircle2 } from "lucide-react";
import * as XLSX from "xlsx";

const TABLES = [
  { id: "properties", label: "العقارات", icon: "🏠" },
  { id: "tenants", label: "المستأجرون", icon: "👥" },
  { id: "contracts", label: "العقود", icon: "📋" },
  { id: "payments", label: "المدفوعات", icon: "💰" },
  { id: "owners", label: "الملاك", icon: "🔑" },
  { id: "brokers", label: "الوسطاء", icon: "🤝" },
  { id: "maintenance", label: "الصيانة", icon: "🔧" },
] as const;

type TableId = typeof TABLES[number]["id"];

export default function DataExport() {
  const [selectedTables, setSelectedTables] = useState<TableId[]>(["properties", "tenants", "contracts", "payments"]);
  const [accountingYear, setAccountingYear] = useState(new Date().getFullYear());
  const [exporting, setExporting] = useState(false);

  const accountingSummary = trpc.accounting.summary.useQuery({ year: accountingYear });

  const exportDataQuery = trpc.backup.exportData.useQuery(
    { tables: selectedTables },
    { enabled: false }
  );

  const journalQuery = trpc.accounting.journalEntries.useQuery(
    { startDate: `${accountingYear}-01-01`, endDate: `${accountingYear}-12-31` },
    { enabled: false }
  );

  const toggleTable = (id: TableId) => {
    setSelectedTables(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleBackupExport = async (format: "json" | "excel") => {
    if (!selectedTables.length) { toast.error("اختر جدولاً واحداً على الأقل"); return; }
    setExporting(true);
    try {
      const result = await exportDataQuery.refetch();
      if (!result.data) throw new Error("No data");
      const { data } = result.data;

      if (format === "json") {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `takamol_backup_${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("تم تصدير النسخة الاحتياطية JSON");
      } else {
        const wb = XLSX.utils.book_new();
        for (const [table, rows] of Object.entries(data)) {
          if (!Array.isArray(rows) || rows.length === 0) continue;
          const ws = XLSX.utils.json_to_sheet(rows);
          ws["!cols"] = Object.keys(rows[0] as object).map(() => ({ wch: 18 }));
          const label = TABLES.find(t => t.id === table)?.label ?? table;
          XLSX.utils.book_append_sheet(wb, ws, label);
        }
        XLSX.writeFile(wb, `takamol_backup_${new Date().toISOString().split("T")[0]}.xlsx`);
        toast.success("تم تصدير النسخة الاحتياطية Excel");
      }
    } catch {
      toast.error("فشل التصدير");
    } finally {
      setExporting(false);
    }
  };

  const handleAccountingExport = async (format: "excel" | "csv") => {
    setExporting(true);
    try {
      const result = await journalQuery.refetch();
      if (!result.data) throw new Error("No data");
      const entries = result.data;

      const rows = entries.map(e => ({
        "التاريخ": e.date,
        "المرجع": e.ref,
        "البيان": e.description,
        "مدين": e.debit || "",
        "دائن": e.credit || "",
        "الحساب": e.account,
        "النوع": e.type === "revenue" ? "إيراد" : "مصروف",
      }));

      if (format === "excel") {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        ws["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, ws, `قيود ${accountingYear}`);
        XLSX.writeFile(wb, `takamol_accounting_${accountingYear}.xlsx`);
        toast.success("تم تصدير دفتر اليومية Excel");
      } else {
        const header = Object.keys(rows[0]).join(",");
        const csvRows = rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
        const csv = "\uFEFF" + [header, ...csvRows].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `takamol_accounting_${accountingYear}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("تم تصدير دفتر اليومية CSV");
      }
    } catch {
      toast.error("فشل التصدير المحاسبي");
    } finally {
      setExporting(false);
    }
  };

  const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const summaryData = accountingSummary.data?.months;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">التصدير والنسخ الاحتياطي</h1>
        <p className="text-muted-foreground mt-1">تصدير بيانات النظام للمحاسبة والأرشفة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-blue-500" />
              نسخة احتياطية
            </CardTitle>
            <CardDescription>تصدير بيانات النظام الكاملة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">اختر الجداول:</p>
              <div className="grid grid-cols-2 gap-2">
                {TABLES.map(t => (
                  <label key={t.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox
                      checked={selectedTables.includes(t.id)}
                      onCheckedChange={() => toggleTable(t.id)}
                    />
                    <span className="text-sm">{t.icon} {t.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1 gap-2" variant="outline" disabled={exporting}
                onClick={() => handleBackupExport("excel")}>
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                Excel
              </Button>
              <Button className="flex-1 gap-2" variant="outline" disabled={exporting}
                onClick={() => handleBackupExport("json")}>
                <Database className="h-4 w-4 text-blue-600" />
                JSON
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 inline ml-1 text-green-500" />
              يُنصح بأخذ نسخة احتياطية أسبوعياً
            </p>
          </CardContent>
        </Card>

        {/* Accounting Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-amber-500" />
              دفتر اليومية المحاسبي
            </CardTitle>
            <CardDescription>تصدير القيود المحاسبية بتنسيق متوافق</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">السنة المالية:</label>
              <Select value={String(accountingYear)} onValueChange={(v) => setAccountingYear(Number(v))}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Summary Table */}
            {summaryData && (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-2 text-right font-medium">الشهر</th>
                      <th className="p-2 text-left font-medium text-green-600">إيرادات</th>
                      <th className="p-2 text-left font-medium text-red-500">مصاريف</th>
                      <th className="p-2 text-left font-medium">صافي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(summaryData).map(([m, data]) => (
                      <tr key={m} className="border-t hover:bg-muted/20">
                        <td className="p-2">{months[Number(m) - 1]}</td>
                        <td className="p-2 text-left text-green-600">{data.revenue > 0 ? data.revenue.toLocaleString("ar-SA") : "-"}</td>
                        <td className="p-2 text-left text-red-500">{data.expenses > 0 ? data.expenses.toLocaleString("ar-SA") : "-"}</td>
                        <td className={`p-2 text-left font-medium ${data.net >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {data.net !== 0 ? data.net.toLocaleString("ar-SA") : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-2">
              <Button className="flex-1 gap-2" variant="outline" disabled={exporting}
                onClick={() => handleAccountingExport("excel")}>
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                Excel
              </Button>
              <Button className="flex-1 gap-2" variant="outline" disabled={exporting}
                onClick={() => handleAccountingExport("csv")}>
                <FileText className="h-4 w-4 text-blue-600" />
                CSV
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">متوافق مع QuickBooks</Badge>
              <Badge variant="outline" className="text-xs">متوافق مع Odoo</Badge>
              <Badge variant="outline" className="text-xs">متوافق مع Zoho Books</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Export Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-purple-500" />
            تصدير سريع
          </CardTitle>
          <CardDescription>تصدير تقارير جاهزة بنقرة واحدة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "تقرير المدفوعات", icon: "💰", tables: ["payments"] as TableId[] },
              { label: "قائمة المستأجرين", icon: "👥", tables: ["tenants"] as TableId[] },
              { label: "سجل العقود", icon: "📋", tables: ["contracts"] as TableId[] },
              { label: "نسخة كاملة", icon: "🗄️", tables: TABLES.map(t => t.id) as TableId[] },
            ].map(item => (
              <Button key={item.label} variant="outline" className="h-auto py-3 flex-col gap-1"
                disabled={exporting}
                onClick={async () => {
                  setSelectedTables(item.tables);
                  setExporting(true);
                  try {
                    const result = await exportDataQuery.refetch();
                    if (!result.data) throw new Error("No data");
                    const wb = XLSX.utils.book_new();
                    for (const [table, rows] of Object.entries(result.data.data)) {
                      if (!Array.isArray(rows) || rows.length === 0) continue;
                      const ws = XLSX.utils.json_to_sheet(rows);
                      const label = TABLES.find(t => t.id === table)?.label ?? table;
                      XLSX.utils.book_append_sheet(wb, ws, label);
                    }
                    XLSX.writeFile(wb, `takamol_${item.label}_${new Date().toISOString().split("T")[0]}.xlsx`);
                    toast.success(`تم تصدير ${item.label}`);
                  } catch { toast.error("فشل التصدير"); }
                  finally { setExporting(false); }
                }}>
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs text-center">{item.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
