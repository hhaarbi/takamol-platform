import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Download, Database, FileSpreadsheet, FileText, BookOpen, Archive, CheckCircle2, Cloud } from "lucide-react";
import * as XLSX from "xlsx";

export default function DataExport() {
  const [accountingYear, setAccountingYear] = useState(new Date().getFullYear());
  const [exporting, setExporting] = useState(false);

  const accountingSummary = trpc.accounting.summary.useQuery({ year: accountingYear });

  const journalQuery = trpc.accounting.journalEntries.useQuery(
    { startDate: `${accountingYear}-01-01`, endDate: `${accountingYear}-12-31` },
    { enabled: false }
  );

  const backupMutation = trpc.backup.exportNow.useMutation({
    onSuccess: (data) => {
      toast.success(`تم إنشاء النسخة الاحتياطية وإرسالها عبر تيليغرام (${Math.round(data.size / 1024)} KB)`);
    },
    onError: () => toast.error("فشل إنشاء النسخة الاحتياطية"),
  });

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
        {/* Cloud Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-blue-500" />
              نسخة احتياطية سحابية
            </CardTitle>
            <CardDescription>تصدير جميع البيانات إلى S3 وإرسال رابط عبر تيليغرام</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/30 p-4 space-y-2">
              <p className="text-sm font-medium">تشمل النسخة الاحتياطية:</p>
              <div className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                {["🏠 العقارات", "👥 المستأجرون", "📋 العقود", "💰 المدفوعات", "🔑 الملاك", "🔧 الصيانة"].map(item => (
                  <div key={item} className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button
              className="w-full gap-2"
              disabled={backupMutation.isPending}
              onClick={() => backupMutation.mutate()}
            >
              <Cloud className="h-4 w-4" />
              {backupMutation.isPending ? "جاري الإنشاء..." : "نسخ احتياطي الآن"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              سيتم إرسال رابط التنزيل عبر تيليغرام للمدير
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

      {/* Quick Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-purple-500" />
            تصدير سريع للتقارير
          </CardTitle>
          <CardDescription>تصدير تقارير جاهزة بنقرة واحدة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "تقرير المدفوعات", icon: "💰" },
              { label: "قائمة المستأجرين", icon: "👥" },
              { label: "سجل العقود", icon: "📋" },
              { label: "نسخة كاملة", icon: "🗄️" },
            ].map(item => (
              <Button key={item.label} variant="outline" className="h-auto py-3 flex-col gap-1"
                disabled={backupMutation.isPending}
                onClick={() => backupMutation.mutate()}>
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
