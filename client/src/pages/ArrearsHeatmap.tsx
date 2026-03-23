import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";

function getHeatColor(amount: number, maxAmount: number): string {
  if (amount === 0) return "bg-green-50 text-green-700";
  const ratio = amount / Math.max(maxAmount, 1);
  if (ratio < 0.2) return "bg-yellow-100 text-yellow-800";
  if (ratio < 0.5) return "bg-orange-200 text-orange-900";
  if (ratio < 0.8) return "bg-red-300 text-red-900";
  return "bg-red-500 text-white";
}

function formatMonth(m: string): string {
  const [year, month] = m.split("-");
  const names = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  return `${names[parseInt(month) - 1]} ${year}`;
}

export default function ArrearsHeatmap() {
  const { data, isLoading } = trpc.arrearsHeatmap.useQuery();

  const allAmounts = data?.matrix.flatMap(r => r.months.map(m => m.amount)) ?? [];
  const maxAmount = Math.max(...allAmounts, 1);
  const totalArrears = allAmounts.reduce((s, a) => s + a, 0);
  const propertiesWithArrears = data?.matrix.filter(r => r.months.some(m => m.amount > 0)).length ?? 0;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
          <Flame className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">خريطة المتأخرات الحرارية</h1>
          <p className="text-muted-foreground text-sm">توزيع المتأخرات حسب العقار والشهر — آخر 6 أشهر</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">إجمالي المتأخرات</div>
            <div className="text-xl font-bold text-red-600">{totalArrears.toLocaleString()} ر.س</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">عقارات بها متأخرات</div>
            <div className="text-xl font-bold text-orange-600">{propertiesWithArrears}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">إجمالي العقارات</div>
            <div className="text-xl font-bold">{data?.matrix.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">نسبة الانتظام</div>
            <div className="text-xl font-bold text-green-600">
              {data?.matrix.length ? Math.round(((data.matrix.length - propertiesWithArrears) / data.matrix.length) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-sm font-medium">مستوى المتأخرات:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-green-50 border border-green-200"></div>
          <span className="text-xs">لا متأخرات</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-yellow-100 border border-yellow-200"></div>
          <span className="text-xs">منخفض</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-orange-200 border border-orange-300"></div>
          <span className="text-xs">متوسط</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-red-300 border border-red-400"></div>
          <span className="text-xs">مرتفع</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-red-500"></div>
          <span className="text-xs">حرج</span>
        </div>
      </div>

      {/* Heatmap Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            الخريطة الحرارية للمتأخرات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
          ) : !data || data.matrix.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
              <p className="text-muted-foreground">لا توجد عقارات مسجلة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground min-w-[180px]">العقار</th>
                    {data.months.map(m => (
                      <th key={m} className="text-center py-2 px-2 font-medium text-muted-foreground whitespace-nowrap min-w-[100px]">
                        {formatMonth(m)}
                      </th>
                    ))}
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {data.matrix.map(row => {
                    const rowTotal = row.months.reduce((s, m) => s + m.amount, 0);
                    return (
                      <tr key={row.propertyId} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="py-2 px-3">
                          <div className="font-medium text-sm truncate max-w-[180px]">{row.propertyTitle}</div>
                        </td>
                        {row.months.map((m, i) => (
                          <td key={i} className="py-1 px-1 text-center">
                            <div className={`rounded-md py-1.5 px-2 text-xs font-medium ${getHeatColor(m.amount, maxAmount)}`}>
                              {m.amount > 0 ? (
                                <div>
                                  <div>{m.count} دفعة</div>
                                  <div className="text-[10px] opacity-80">{m.amount.toLocaleString()}</div>
                                </div>
                              ) : (
                                <span className="text-[10px]">✓</span>
                              )}
                            </div>
                          </td>
                        ))}
                        <td className="py-2 px-3 text-center">
                          {rowTotal > 0 ? (
                            <Badge variant="destructive" className="text-xs">
                              {rowTotal.toLocaleString()} ر.س
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">منتظم</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/30">
                    <td className="py-2 px-3 font-medium text-sm">الإجمالي الشهري</td>
                    {data.months.map((m, i) => {
                      const monthTotal = data.matrix.reduce((s, r) => s + r.months[i].amount, 0);
                      return (
                        <td key={m} className="py-2 px-2 text-center">
                          <span className={`text-xs font-medium ${monthTotal > 0 ? "text-red-600" : "text-green-600"}`}>
                            {monthTotal > 0 ? monthTotal.toLocaleString() : "✓"}
                          </span>
                        </td>
                      );
                    })}
                    <td className="py-2 px-3 text-center">
                      <span className="text-sm font-bold text-red-600">{totalArrears.toLocaleString()} ر.س</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert for high arrears */}
      {propertiesWithArrears > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <div className="font-medium mb-1">تنبيه: يوجد {propertiesWithArrears} عقار بها متأخرات</div>
                <p>يُنصح بمراجعة العقارات ذات اللون الأحمر الداكن فوراً والتواصل مع المستأجرين المتأخرين.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
