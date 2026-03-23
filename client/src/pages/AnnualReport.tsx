import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, TrendingUp, DollarSign, Home, Users, Printer } from "lucide-react";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function AnnualReport() {
  const [year, setYear] = useState(currentYear);
  const { data, isLoading } = trpc.annualReport.get.useQuery({ year });

  const handlePrint = () => {
    window.print();
  };

  const kpiCards = data ? [
    { label: "إجمالي الإيرادات", value: `${Number(data.totalRevenue).toLocaleString("ar-SA")} ر.س`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { label: "إجمالي المصروفات", value: `${Number(data.totalExpenses).toLocaleString("ar-SA")} ر.س`, icon: TrendingUp, color: "text-red-600", bg: "bg-red-50" },
    { label: "صافي الربح", value: `${Number(data.netProfit).toLocaleString("ar-SA")} ر.س`, icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "هامش الربح", value: `${data.profitMargin}%`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "العقارات الكلية", value: data.totalProperties, icon: Home, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "العقود النشطة", value: data.activeContracts, icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "نسبة الإشغال", value: `${data.occupancyRate}%`, icon: Users, color: "text-teal-600", bg: "bg-teal-50" },
  ] : [];

  return (
    <div className="p-6 space-y-6 rtl" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">التقرير السنوي</h1>
            <p className="text-gray-500 text-sm">ملخص الأداء السنوي الشامل</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            طباعة / PDF
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-400">جاري تحميل بيانات سنة {year}...</div>
      ) : !data ? (
        <div className="text-center py-16 text-gray-400">لا توجد بيانات لسنة {year}</div>
      ) : (
        <>
          {/* Header Banner */}
          <div className="bg-gradient-to-l from-indigo-600 to-purple-600 text-white rounded-2xl p-6 print:bg-indigo-600">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">تكامل لإدارة الأملاك</h2>
                <p className="text-indigo-200 text-sm">التقرير السنوي الشامل — {year}</p>
              </div>
              <div className="text-left">
                <p className="text-3xl font-bold">{Number(data.netProfit).toLocaleString("ar-SA")}</p>
                <p className="text-indigo-200 text-sm">صافي الربح (ر.س)</p>
              </div>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpiCards.map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <Card key={i} className={`border-0 shadow-sm ${kpi.bg}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-5 h-5 ${kpi.color}`} />
                      <p className="text-xs text-gray-500">{kpi.label}</p>
                    </div>
                    <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Financial Summary Table */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">الملخص المالي السنوي</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <tbody className="divide-y">
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 font-medium">إجمالي الإيرادات</td>
                    <td className="py-3 text-left text-green-700 font-bold">{Number(data.totalRevenue).toLocaleString("ar-SA")} ر.س</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 font-medium">إجمالي المصروفات والصيانة</td>
                    <td className="py-3 text-left text-red-600 font-bold">({Number(data.totalExpenses).toLocaleString("ar-SA")}) ر.س</td>
                  </tr>
                  <tr className="bg-indigo-50 font-bold">
                    <td className="py-3 text-indigo-800">صافي الربح</td>
                    <td className="py-3 text-left text-indigo-700 text-lg">{Number(data.netProfit).toLocaleString("ar-SA")} ر.س</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 font-medium">هامش الربح</td>
                    <td className="py-3 text-left font-bold">{data.profitMargin}%</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 font-medium">نسبة الإشغال</td>
                    <td className="py-3 text-left font-bold">{data.occupancyRate}%</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 font-medium">إجمالي العقارات</td>
                    <td className="py-3 text-left font-bold">{data.totalProperties}</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 font-medium">العقود النشطة</td>
                    <td className="py-3 text-left font-bold">{data.activeContracts}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Footer Note */}
          <div className="text-center text-xs text-gray-400 print:block">
            <p>تم إنشاء هذا التقرير بواسطة منصة تكامل لإدارة الأملاك — {new Date().toLocaleDateString("ar-SA")}</p>
            <p>جميع المبالغ بالريال السعودي (ر.س)</p>
          </div>
        </>
      )}
    </div>
  );
}
