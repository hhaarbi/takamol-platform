import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";

const MONTH_NAMES = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

function TrendIcon({ change }: { change: number }) {
  if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
}

export default function YearlyComparison() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const { data } = trpc.yearlyComparison.useQuery({ year: selectedYear });

  const maxRevenue = data ? Math.max(...data.monthlyData.map(m => Math.max(m.curRevenue, m.prevRevenue)), 1) : 1;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6 text-purple-600" /> المقارنة السنوية</h1>
          <p className="text-muted-foreground mt-1">مقارنة الأداء المالي بين السنوات</p>
        </div>
        <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[currentYear, currentYear - 1, currentYear - 2].map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ملخص إجمالي */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-5">
              <p className="text-sm text-purple-700 mb-1">إجمالي {data.currentYear}</p>
              <p className="text-3xl font-bold text-purple-900">{data.curTotal.toLocaleString("ar-SA")} ر.س</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardContent className="p-5">
              <p className="text-sm text-gray-600 mb-1">إجمالي {data.prevYear}</p>
              <p className="text-3xl font-bold text-gray-700">{data.prevTotal.toLocaleString("ar-SA")} ر.س</p>
            </CardContent>
          </Card>
          <Card className={`bg-gradient-to-br border ${data.totalChange >= 0 ? "from-green-50 to-green-100 border-green-200" : "from-red-50 to-red-100 border-red-200"}`}>
            <CardContent className="p-5">
              <p className={`text-sm mb-1 ${data.totalChange >= 0 ? "text-green-700" : "text-red-700"}`}>التغيير</p>
              <div className="flex items-center gap-2">
                <p className={`text-3xl font-bold ${data.totalChange >= 0 ? "text-green-800" : "text-red-800"}`}>
                  {data.totalChange >= 0 ? "+" : ""}{data.totalChange.toLocaleString("ar-SA")} ر.س
                </p>
                <TrendIcon change={data.totalChange} />
              </div>
              {data.totalChangePercent && (
                <p className={`text-sm mt-1 ${data.totalChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {data.totalChange >= 0 ? "▲" : "▼"} {Math.abs(Number(data.totalChangePercent))}%
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* رسم بياني شهري */}
      {data && (
        <Card>
          <CardHeader><CardTitle>المقارنة الشهرية</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.monthlyData.map(month => (
                <div key={month.month} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="w-16 text-muted-foreground">{MONTH_NAMES[month.month - 1]}</span>
                    <div className="flex-1 mx-3 space-y-1">
                      {/* شريط السنة الحالية */}
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                        <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${(month.curRevenue / maxRevenue) * 100}%` }} />
                        </div>
                        <span className="text-xs w-24 text-left">{month.curRevenue.toLocaleString("ar-SA")}</span>
                      </div>
                      {/* شريط السنة السابقة */}
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
                        <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                          <div className="h-full bg-gray-400 rounded-full transition-all" style={{ width: `${(month.prevRevenue / maxRevenue) * 100}%` }} />
                        </div>
                        <span className="text-xs w-24 text-left text-muted-foreground">{month.prevRevenue.toLocaleString("ar-SA")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 w-20 justify-end">
                      <TrendIcon change={month.change} />
                      <span className={`text-xs font-medium ${month.change > 0 ? "text-green-600" : month.change < 0 ? "text-red-600" : "text-gray-400"}`}>
                        {month.changePercent ? `${month.change > 0 ? "+" : ""}${month.changePercent}%` : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-6 mt-4 pt-4 border-t text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500" /><span>{data?.currentYear}</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-400" /><span>{data?.prevYear}</span></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* أداء العقارات */}
      {data && data.propertyStats.length > 0 && (
        <Card>
          <CardHeader><CardTitle>أداء العقارات مقارنةً بالعام السابق</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="p-3 text-right">العقار</th>
                  <th className="p-3 text-right">{data.currentYear}</th>
                  <th className="p-3 text-right">{data.prevYear}</th>
                  <th className="p-3 text-right">التغيير</th>
                </tr></thead>
                <tbody>
                  {data.propertyStats.sort((a, b) => b.curRevenue - a.curRevenue).map(prop => (
                    <tr key={prop.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{prop.title}</td>
                      <td className="p-3 text-purple-700 font-medium">{prop.curRevenue.toLocaleString("ar-SA")} ر.س</td>
                      <td className="p-3 text-muted-foreground">{prop.prevRevenue.toLocaleString("ar-SA")} ر.س</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <TrendIcon change={prop.change} />
                          <span className={`font-medium ${prop.change > 0 ? "text-green-600" : prop.change < 0 ? "text-red-600" : "text-gray-400"}`}>
                            {prop.change > 0 ? "+" : ""}{prop.change.toLocaleString("ar-SA")} ر.س
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
