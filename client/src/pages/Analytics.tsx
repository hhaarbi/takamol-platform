import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, Building2, Users, DollarSign, Wrench, Target, Download, Bell } from "lucide-react";
import { useLocation } from "wouter";

const COLORS = ["#d97706", "#059669", "#2563eb", "#7c3aed", "#dc2626", "#0891b2"];

export default function Analytics() {
  const { data: kpis } = trpc.analytics.kpis.useQuery();
  const { data: revenueByProperty = [] } = trpc.analytics.revenueByProperty.useQuery(undefined);
  const { data: collectionData = [] } = trpc.analytics.collectionRate.useQuery(6);
  const { data: maintenanceCost = [] } = trpc.analytics.maintenanceCost.useQuery();
  const { data: brokerPerf = [] } = trpc.analytics.brokerPerformance.useQuery();

  const kpiCards = kpis ? [
    { label: "معدل الإشغال", value: `${(kpis.occupancyRate ?? 0).toFixed(1)}%`, icon: <Building2 className="h-5 w-5" />, color: "text-blue-600", bg: "bg-blue-50", trend: (kpis.occupancyRate ?? 0) >= 80 ? "up" : "down" },
    { label: "إيرادات الشهر", value: `${Number(kpis.thisMonthRevenue ?? 0).toLocaleString("ar-SA")} ر.س`, icon: <DollarSign className="h-5 w-5" />, color: "text-green-600", bg: "bg-green-50", trend: (kpis.revenueGrowth ?? 0) >= 0 ? "up" : "down" },
    { label: "نمو الإيرادات", value: `${(kpis.revenueGrowth ?? 0).toFixed(1)}%`, icon: <TrendingUp className="h-5 w-5" />, color: "text-amber-600", bg: "bg-amber-50", trend: (kpis.revenueGrowth ?? 0) >= 0 ? "up" : "down" },
    { label: "طلبات الصيانة", value: kpis.openMaintenance ?? 0, icon: <Wrench className="h-5 w-5" />, color: "text-red-600", bg: "bg-red-50", trend: (kpis.openMaintenance ?? 0) > 5 ? "down" : "up" },
    { label: "إجمالي العقارات", value: kpis.totalProperties ?? 0, icon: <Users className="h-5 w-5" />, color: "text-purple-600", bg: "bg-purple-50", trend: "up" },
    { label: "عقود منتهية قريباً", value: kpis.expiringContracts ?? 0, icon: <Target className="h-5 w-5" />, color: "text-orange-600", bg: "bg-orange-50", trend: (kpis.expiringContracts ?? 0) > 3 ? "down" : "up" },
  ] : [];

  const [, navigate] = useLocation();

  const exportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const kpiHtml = kpis ? `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px">
        <div style="background:#f0fdf4;padding:16px;border-radius:8px;text-align:center">
          <div style="font-size:24px;font-weight:bold;color:#16a34a">${(kpis.occupancyRate ?? 0).toFixed(1)}%</div>
          <div style="font-size:12px;color:#666;margin-top:4px">معدل الإشغال</div>
        </div>
        <div style="background:#fffbeb;padding:16px;border-radius:8px;text-align:center">
          <div style="font-size:24px;font-weight:bold;color:#d97706">${Number(kpis.thisMonthRevenue ?? 0).toLocaleString("ar-SA")} ر.س</div>
          <div style="font-size:12px;color:#666;margin-top:4px">إيرادات الشهر</div>
        </div>
        <div style="background:#fef2f2;padding:16px;border-radius:8px;text-align:center">
          <div style="font-size:24px;font-weight:bold;color:#dc2626">${kpis.overduePayments ?? 0}</div>
          <div style="font-size:12px;color:#666;margin-top:4px">دفعات متأخرة</div>
        </div>
        <div style="background:#f0f9ff;padding:16px;border-radius:8px;text-align:center">
          <div style="font-size:24px;font-weight:bold;color:#0284c7">${kpis.totalProperties ?? 0}</div>
          <div style="font-size:12px;color:#666;margin-top:4px">إجمالي العقارات</div>
        </div>
        <div style="background:#faf5ff;padding:16px;border-radius:8px;text-align:center">
          <div style="font-size:24px;font-weight:bold;color:#7c3aed">${kpis.openMaintenance ?? 0}</div>
          <div style="font-size:12px;color:#666;margin-top:4px">طلبات صيانة مفتوحة</div>
        </div>
        <div style="background:#fff7ed;padding:16px;border-radius:8px;text-align:center">
          <div style="font-size:24px;font-weight:bold;color:#ea580c">${kpis.expiringContracts ?? 0}</div>
          <div style="font-size:12px;color:#666;margin-top:4px">عقود تنتهي قريباً</div>
        </div>
      </div>` : "";
    const revenueTableHtml = revenueByProperty.length > 0 ? `
      <h3 style="margin-bottom:12px;color:#374151">الإيرادات حسب العقار</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <thead><tr style="background:#f3f4f6">
          <th style="padding:8px;text-align:right;border:1px solid #e5e7eb">رقم العقار</th>
          <th style="padding:8px;text-align:right;border:1px solid #e5e7eb">إجمالي الإيرادات</th>
          <th style="padding:8px;text-align:right;border:1px solid #e5e7eb">عدد الدفعات</th>
        </tr></thead>
        <tbody>${revenueByProperty.map((r: any) => `<tr><td style="padding:8px;border:1px solid #e5e7eb">عقار #${r.propertyId}</td><td style="padding:8px;border:1px solid #e5e7eb">${Number(r.total).toLocaleString("ar-SA")} ر.س</td><td style="padding:8px;border:1px solid #e5e7eb">${r.count}</td></tr>`).join("")}</tbody>
      </table>` : "";
    printWindow.document.write(`
      <!DOCTYPE html><html dir="rtl"><head>
        <meta charset="UTF-8"><title>تقرير تكامل - التحليلات</title>
        <style>body{font-family:Arial,sans-serif;padding:24px;color:#111;direction:rtl}h1{color:#d97706;border-bottom:2px solid #d97706;padding-bottom:8px}h2{color:#374151;margin-top:24px}</style>
      </head><body>
        <h1>تقرير تكامل - التحليلات المتقدمة</h1>
        <p style="color:#6b7280;margin-bottom:24px">تاريخ التقرير: ${new Date().toLocaleDateString("ar-SA")} | المدينة المنورة</p>
        <h2>مؤشرات الأداء الرئيسية</h2>
        ${kpiHtml}
        ${revenueTableHtml}
      </body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التحليلات المتقدمة</h1>
          <p className="text-gray-500 text-sm mt-1">مؤشرات الأداء الرئيسية والتقارير التفصيلية</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/smart-alerts")}>
            <Bell className="h-4 w-4 text-red-500" />
            مركز التنبيهات
          </Button>
          <Button size="sm" className="gap-2 bg-amber-600 hover:bg-amber-700" onClick={exportPDF}>
            <Download className="h-4 w-4" />
            تصدير PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((kpi, i) => (
          <Card key={i} className={`${kpi.bg} border-0`}>
            <CardContent className="p-4">
              <div className={`${kpi.color} mb-2`}>{kpi.icon}</div>
              <div className="text-xl font-bold text-gray-900">{kpi.value}</div>
              <div className="text-xs text-gray-600 mt-1">{kpi.label}</div>
              <div className={`flex items-center gap-1 mt-1 text-xs ${kpi.trend === "up" ? "text-green-600" : "text-red-500"}`}>
                {kpi.trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Property */}
        <Card>
          <CardHeader><CardTitle className="text-base">الإيرادات حسب العقار</CardTitle></CardHeader>
          <CardContent>
            {revenueByProperty.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueByProperty} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={v => `${(Number(v)/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="propertyId" width={80} tick={{ fontSize: 11 }} tickFormatter={v => `عقار #${v}`} />
                  <Tooltip formatter={(v: number) => [`${Number(v).toLocaleString("ar-SA")} ر.س`, "الإيرادات"]} labelFormatter={l => `عقار #${l}`} />
                  <Bar dataKey="total" fill="#d97706" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">لا توجد بيانات كافية</div>
            )}
          </CardContent>
        </Card>

        {/* Collection Rate Trend */}
        <Card>
          <CardHeader><CardTitle className="text-base">معدل التحصيل الشهري</CardTitle></CardHeader>
          <CardContent>
            {collectionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={collectionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v: number) => [`${Number(v).toFixed(1)}%`, "معدل التحصيل"]} />
                  <Line type="monotone" dataKey="rate" stroke="#059669" strokeWidth={2} dot={{ fill: "#059669" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">لا توجد بيانات كافية</div>
            )}
          </CardContent>
        </Card>

        {/* Maintenance Cost by Property */}
        <Card>
          <CardHeader><CardTitle className="text-base">تكاليف الصيانة حسب العقار</CardTitle></CardHeader>
          <CardContent>
            {maintenanceCost.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={maintenanceCost}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="propertyId" tick={{ fontSize: 10 }} tickFormatter={v => `عقار #${v}`} />
                  <YAxis tickFormatter={v => `${(Number(v)/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`${Number(v).toLocaleString("ar-SA")} ر.س`, "تكلفة الصيانة"]} labelFormatter={l => `عقار #${l}`} />
                  <Bar dataKey="totalCost" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">لا توجد بيانات كافية</div>
            )}
          </CardContent>
        </Card>

        {/* Broker Performance */}
        <Card>
          <CardHeader><CardTitle className="text-base">أداء الوسطاء</CardTitle></CardHeader>
          <CardContent>
            {brokerPerf.length > 0 ? (
              <div className="space-y-3">
                {brokerPerf.map((b, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                      {b.brokerId}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">وسيط #{b.brokerId}</span>
                        <span className="text-xs text-gray-500">{b.totalDeals} صفقة</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: `${Math.min((Number(b.totalRevenue) / (Number(brokerPerf[0]?.totalRevenue) || 1)) * 100, 100)}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{Number(b.totalRevenue ?? 0).toLocaleString("ar-SA")} ر.س عمولات</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">لا توجد بيانات كافية</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Table */}
      {revenueByProperty.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">ملخص الإيرادات</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right p-3 font-medium text-gray-600">العقار</th>
                  <th className="text-right p-3 font-medium text-gray-600">عدد المدفوعات</th>
                  <th className="text-right p-3 font-medium text-gray-600">إجمالي الإيرادات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {revenueByProperty.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">عقار #{item.propertyId}</td>
                    <td className="p-3 text-gray-600">{item.count}</td>
                    <td className="p-3 font-bold text-green-700">{Number(item.total).toLocaleString("ar-SA")} ر.س</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
