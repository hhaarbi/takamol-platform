import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, BarChart3, MapPin, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const typeLabels: Record<string, string> = {
  apartment: "شقة", villa: "فيلا", land: "أرض", commercial: "تجاري",
  office: "مكتب", warehouse: "مستودع", building: "مبنى", farm: "مزرعة",
};

const opportunityConfig = {
  raise: { label: "فرصة رفع السعر", color: "bg-green-100 text-green-800", icon: TrendingUp },
  lower: { label: "السعر مرتفع", color: "bg-red-100 text-red-800", icon: TrendingDown },
  optimal: { label: "سعر مثالي", color: "bg-blue-100 text-blue-800", icon: Minus },
  unknown: { label: "لا توجد بيانات", color: "bg-gray-100 text-gray-600", icon: Minus },
};

export default function MarketComparison() {
  const { data: comparison, isLoading: loadingComp } = trpc.market.getComparison.useQuery();
  const { data: marketPrices, isLoading: loadingPrices } = trpc.market.getPrices.useQuery();

  const raiseCount = comparison?.filter(p => p.pricingOpportunity === "raise").length || 0;
  const lowerCount = comparison?.filter(p => p.pricingOpportunity === "lower").length || 0;
  const optimalCount = comparison?.filter(p => p.pricingOpportunity === "optimal").length || 0;

  const chartData = comparison?.slice(0, 10).map(p => ({
    name: p.titleAr.substring(0, 15) + (p.titleAr.length > 15 ? "..." : ""),
    سعرنا: Number(p.price),
    متوسط_السوق: p.marketAvgRent || 0,
  })) || [];

  return (
    <div className="p-6 space-y-6 rtl" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مقارنة أسعار السوق</h1>
          <p className="text-gray-500 text-sm">مقارنة أسعار عقاراتك بمتوسط السوق في المدينة المنورة</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-green-50">
          <CardContent className="pt-4 text-center">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-green-700">{raiseCount}</p>
            <p className="text-sm text-green-600">فرصة رفع السعر</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-blue-50">
          <CardContent className="pt-4 text-center">
            <Minus className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-blue-700">{optimalCount}</p>
            <p className="text-sm text-blue-600">سعر مثالي</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-red-50">
          <CardContent className="pt-4 text-center">
            <TrendingDown className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-red-700">{lowerCount}</p>
            <p className="text-sm text-red-600">سعر مرتفع عن السوق</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">مقارنة الأسعار (أول 10 عقارات)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString("ar-SA")} ر.س`} />
                <Bar dataKey="سعرنا" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="متوسط_السوق" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 justify-center mt-2 text-sm">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-500 rounded-sm inline-block" /> سعرنا</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-300 rounded-sm inline-block" /> متوسط السوق</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Properties Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">تفاصيل المقارنة لكل عقار</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingComp ? (
            <div className="text-center py-8 text-gray-400">جاري التحميل...</div>
          ) : !comparison || comparison.length === 0 ? (
            <div className="text-center py-8 text-gray-400">لا توجد عقارات للإيجار مسجلة</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-right p-3 font-medium text-gray-600">العقار</th>
                    <th className="text-right p-3 font-medium text-gray-600">النوع</th>
                    <th className="text-right p-3 font-medium text-gray-600">الحي</th>
                    <th className="text-right p-3 font-medium text-gray-600">سعرنا</th>
                    <th className="text-right p-3 font-medium text-gray-600">متوسط السوق</th>
                    <th className="text-right p-3 font-medium text-gray-600">الفرق</th>
                    <th className="text-right p-3 font-medium text-gray-600">التوصية</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map(prop => {
                    const opp = opportunityConfig[prop.pricingOpportunity as keyof typeof opportunityConfig] || opportunityConfig.unknown;
                    const OppIcon = opp.icon;
                    const diff = prop.priceDiff;
                    return (
                      <tr key={prop.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-medium">{prop.titleAr}</td>
                        <td className="p-3 text-gray-600">{typeLabels[prop.type] || prop.type}</td>
                        <td className="p-3 text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {prop.district || "—"}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-purple-700">
                          {Number(prop.price).toLocaleString("ar-SA")} ر.س
                        </td>
                        <td className="p-3 text-gray-600">
                          {prop.marketAvgRent ? `${Number(prop.marketAvgRent).toLocaleString("ar-SA")} ر.س` : "—"}
                        </td>
                        <td className="p-3">
                          {diff !== null ? (
                            <span className={diff > 0 ? "text-green-600 font-medium" : diff < 0 ? "text-red-600 font-medium" : "text-gray-500"}>
                              {diff > 0 ? "+" : ""}{diff.toLocaleString("ar-SA")} ر.س
                            </span>
                          ) : "—"}
                        </td>
                        <td className="p-3">
                          <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${opp.color}`}>
                            <OppIcon className="w-3 h-3" />
                            {opp.label}
                          </span>
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

      {/* Market Reference Prices */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            أسعار السوق المرجعية — المدينة المنورة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPrices ? (
            <div className="text-center py-4 text-gray-400">جاري التحميل...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-right p-3 font-medium text-gray-600">النوع</th>
                    <th className="text-right p-3 font-medium text-gray-600">الحي</th>
                    <th className="text-right p-3 font-medium text-gray-600">الحد الأدنى</th>
                    <th className="text-right p-3 font-medium text-gray-600">المتوسط</th>
                    <th className="text-right p-3 font-medium text-gray-600">الحد الأقصى</th>
                    <th className="text-right p-3 font-medium text-gray-600">المصدر</th>
                  </tr>
                </thead>
                <tbody>
                  {(marketPrices || []).map(mp => (
                    <tr key={mp.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{typeLabels[mp.propertyType] || mp.propertyType}</td>
                      <td className="p-3 text-gray-600">{mp.district || "عام"}</td>
                      <td className="p-3 text-gray-600">{Number(mp.minRent || 0).toLocaleString("ar-SA")} ر.س</td>
                      <td className="p-3 font-medium text-purple-700">{Number(mp.avgAnnualRent || 0).toLocaleString("ar-SA")} ر.س</td>
                      <td className="p-3 text-gray-600">{Number(mp.maxRent || 0).toLocaleString("ar-SA")} ر.س</td>
                      <td className="p-3 text-xs text-gray-400">{mp.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
