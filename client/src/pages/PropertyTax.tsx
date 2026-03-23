import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Download, Building2, Calculator, TrendingUp } from "lucide-react";
import * as XLSX from "xlsx";

export default function PropertyTax() {
  const [year, setYear] = useState(new Date().getFullYear());
  const { data, isLoading } = trpc.propertyTax.report.useQuery({ year });

  const exportToExcel = () => {
    if (!data?.length) { toast.error("لا توجد بيانات للتصدير"); return; }
    const rows = data.map(p => ({
      "العقار": p.propertyTitle,
      "الحي": p.district || "-",
      "الإيجار السنوي": p.annualRent,
      "الضريبة العقارية (2.5%)": p.annualTax,
      "ضريبة ربعية": p.quarterlyTax,
      "القيمة الخاضعة للضريبة": p.taxableValue,
      "الحالة": p.status,
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 25 }, { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, `الضريبة العقارية ${year}`);
    XLSX.writeFile(wb, `property_tax_${year}.xlsx`);
    toast.success("تم تصدير تقرير الضريبة العقارية");
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">تقرير الضريبة العقارية</h1>
          <p className="text-muted-foreground mt-1">الضريبة العقارية السنوية وضريبة القيمة المضافة لكل عقار</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={exportToExcel}>
            <Download className="h-4 w-4" />
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* Summary */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "إجمالي الإيجارات", value: `${data.reduce((s,p)=>s+p.annualRent,0).toLocaleString("ar-SA")} ر.س`, icon: <TrendingUp className="h-5 w-5 text-green-500" />, color: "text-green-600" },
            { label: "الضريبة العقارية (2.5%)", value: `${data.reduce((s,p)=>s+p.annualTax,0).toLocaleString("ar-SA")} ر.س`, icon: <Building2 className="h-5 w-5 text-blue-500" />, color: "text-blue-600" },
            { label: "ضريبة ربعية", value: `${data.reduce((s,p)=>s+p.quarterlyTax,0).toLocaleString("ar-SA")} ر.س`, icon: <Calculator className="h-5 w-5 text-amber-500" />, color: "text-amber-600" },
            { label: "إجمالي الضرائب السنوية", value: `${data.reduce((s,p)=>s+p.annualTax,0).toLocaleString("ar-SA")} ر.س`, icon: <FileText className="h-5 w-5 text-red-500" />, color: "text-red-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 flex items-center gap-3">
                {s.icon}
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            تفاصيل الضريبة لكل عقار — {year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : !data?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد بيانات لهذه السنة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="p-3 text-right font-medium">العقار</th>
                    <th className="p-3 text-right font-medium">الحي</th>
                    <th className="p-3 text-left font-medium">الإيجار السنوي</th>
                    <th className="p-3 text-left font-medium text-blue-600">ضريبة سنوية 2.5%</th>
                    <th className="p-3 text-left font-medium text-amber-600">ضريبة ربعية</th>
                    <th className="p-3 text-right font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(p => (
                    <tr key={p.propertyId} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-medium">{p.propertyTitle}</td>
                      <td className="p-3 text-muted-foreground">{p.district || "-"}</td>
                      <td className="p-3 text-left text-green-600 font-medium">{p.annualRent.toLocaleString("ar-SA")}</td>
                      <td className="p-3 text-left text-blue-600">{p.annualTax.toLocaleString("ar-SA")}</td>
                      <td className="p-3 text-left text-amber-600">{p.quarterlyTax.toLocaleString("ar-SA")}</td>
                      <td className="p-3 text-right">
                        <span className={p.annualTax > 0 ? "text-red-600 font-medium" : "text-green-600"}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30 font-bold">
                    <td className="p-3" colSpan={2}>الإجمالي</td>
                    <td className="p-3 text-left text-green-600">{data.reduce((s,p)=>s+p.annualRent,0).toLocaleString("ar-SA")}</td>
                    <td className="p-3 text-left text-blue-600">{data.reduce((s,p)=>s+p.annualTax,0).toLocaleString("ar-SA")}</td>
                    <td className="p-3 text-left text-amber-600">{data.reduce((s,p)=>s+p.quarterlyTax,0).toLocaleString("ar-SA")}</td>
                    <td className="p-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/30">
        <CardContent className="pt-4 pb-3">
          <p className="text-sm text-amber-800 font-medium">ملاحظة قانونية</p>
          <p className="text-xs text-amber-700 mt-1">
            الضريبة العقارية بنسبة 2.5% مفروضة على الأراضي البيضاء وفق نظام ضريبة الأراضي البيضاء السعودي.
            ضريبة القيمة المضافة 15% تُطبق على عقود الإيجار التجارية وفق متطلبات هيئة الزكاة والضريبة والجمارك (ZATCA).
            يُنصح بمراجعة محاسب قانوني معتمد لتأكيد الأرقام النهائية.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
