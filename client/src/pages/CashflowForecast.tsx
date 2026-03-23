import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, DollarSign, AlertCircle, BarChart3, ArrowUpRight } from "lucide-react";

function formatMonth(m: string): string {
  const [year, month] = m.split("-");
  const names = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  return `${names[parseInt(month) - 1]} ${year}`;
}

export default function CashflowForecast() {
  const { data, isLoading } = trpc.cashflowForecast.useQuery();

  const totalForecast = data?.forecast.reduce((s, f) => s + f.expected, 0) ?? 0;
  const avgHistorical = data?.historical.length
    ? data.historical.reduce((s, h) => s + Number(h.revenue), 0) / data.historical.length
    : 0;
  const maxBar = Math.max(
    ...(data?.historical.map(h => Number(h.revenue)) ?? [0]),
    ...(data?.forecast.map(f => f.expected) ?? [0]),
    1
  );

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">توقع التدفق النقدي</h1>
          <p className="text-muted-foreground text-sm">توقع الإيرادات للأشهر الثلاثة القادمة بناءً على العقود الحالية</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-blue-700 mb-0.5">الإيرادات المتوقعة (3 أشهر)</div>
                <div className="text-2xl font-bold text-blue-800">{totalForecast.toLocaleString()} ر.س</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-green-700 mb-0.5">متوسط الإيراد الشهري (تاريخي)</div>
                <div className="text-2xl font-bold text-green-800">{Math.round(avgHistorical).toLocaleString()} ر.س</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-white">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-purple-700 mb-0.5">عدد العقود النشطة</div>
                <div className="text-2xl font-bold text-purple-800">
                  {data?.forecast[0]?.contractsCount ?? 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            الإيرادات التاريخية والمتوقعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
          ) : (
            <div className="space-y-3">
              {/* Historical */}
              {data?.historical.map(h => (
                <div key={h.month} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-muted-foreground text-left shrink-0">{formatMonth(h.month)}</div>
                  <div className="flex-1 bg-muted/30 rounded-full h-7 relative overflow-hidden">
                    <div
                      className="h-full bg-green-400 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${Math.max((Number(h.revenue) / maxBar) * 100, 2)}%` }}
                    >
                      <span className="text-xs font-medium text-white whitespace-nowrap">
                        {Number(h.revenue).toLocaleString()} ر.س
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0 bg-green-100 text-green-700">فعلي</Badge>
                </div>
              ))}

              {/* Divider */}
              {data?.historical.length && data?.forecast.length ? (
                <div className="flex items-center gap-3 py-1">
                  <div className="w-28"></div>
                  <div className="flex-1 border-t-2 border-dashed border-muted-foreground/30 relative">
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                      توقع
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Forecast */}
              {data?.forecast.map(f => (
                <div key={f.month} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-muted-foreground text-left shrink-0">{formatMonth(f.month)}</div>
                  <div className="flex-1 bg-muted/30 rounded-full h-7 relative overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full transition-all duration-500 flex items-center justify-end pr-2 border-2 border-dashed border-blue-500"
                      style={{ width: `${Math.max((f.expected / maxBar) * 100, 2)}%` }}
                    >
                      <span className="text-xs font-medium text-white whitespace-nowrap">
                        {f.expected.toLocaleString()} ر.س
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">متوقع</Badge>
                    {f.endingContracts > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {f.endingContracts} عقد ينتهي
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forecast Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">تفاصيل التوقع الشهري</CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.forecast.length ? (
            <div className="text-center py-8 text-muted-foreground text-sm">لا توجد عقود نشطة</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">الشهر</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">الإيراد المتوقع</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">عدد العقود</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">عقود تنتهي</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {data.forecast.map(f => (
                    <tr key={f.month} className="border-b hover:bg-muted/20">
                      <td className="py-3 px-3 font-medium">{formatMonth(f.month)}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-blue-600 font-bold">{f.expected.toLocaleString()} ر.س</span>
                      </td>
                      <td className="py-3 px-3 text-center">{f.contractsCount}</td>
                      <td className="py-3 px-3 text-center">
                        {f.endingContracts > 0 ? (
                          <span className="text-red-600 font-medium">{f.endingContracts}</span>
                        ) : (
                          <span className="text-green-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {f.endingContracts > 0 ? (
                          <Badge variant="destructive" className="text-xs">يحتاج متابعة</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">مستقر</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <div className="font-medium mb-1">ملاحظة حول دقة التوقع</div>
              <p>التوقع مبني على العقود النشطة حالياً ومبالغ الإيجار المتفق عليها. لا يأخذ في الحسبان المتأخرات المحتملة أو التجديدات المستقبلية. يُنصح بمراجعة العقود المنتهية قريباً وتجديدها مسبقاً.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
