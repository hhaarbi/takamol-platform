import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Activity, TrendingUp, Zap } from "lucide-react";

export default function ApiStats() {
  const stats = trpc.apiStats.getUsage.useQuery({ days: 30 });

  const data = stats.data;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Activity className="w-6 h-6" />
          إحصائيات استخدام API
        </h1>
        <p className="text-muted-foreground text-sm mt-1">تتبع استخدام مفاتيح API خلال آخر 30 يوماً</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Zap className="w-4 h-4" />إجمالي الطلبات</div>
            <div className="text-3xl font-bold text-foreground">{data?.total?.toLocaleString() ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><TrendingUp className="w-4 h-4" />أيام نشطة</div>
            <div className="text-3xl font-bold text-foreground">{data?.byDay?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Activity className="w-4 h-4" />أكثر endpoint استخداماً</div>
            <div className="text-sm font-medium text-foreground truncate">{data?.byEndpoint?.[0]?.endpoint ?? "—"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Chart */}
      {data && data.byDay.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الطلبات اليومية</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.byDay}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Endpoints */}
      {data && data.byEndpoint.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">أكثر الـ Endpoints استخداماً</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.byEndpoint.map((ep, i) => {
                const maxCount = data.byEndpoint[0]?.count ?? 1;
                const pct = Math.round((ep.count / maxCount) * 100);
                return (
                  <div key={ep.endpoint}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-mono text-xs">{ep.endpoint}</span>
                      <span className="font-semibold">{ep.count.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {(!data || (data.byDay.length === 0 && data.byEndpoint.length === 0)) && !stats.isLoading && (
        <div className="text-center py-16 text-muted-foreground">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد بيانات استخدام API بعد</p>
          <p className="text-xs mt-1">ستظهر هنا الإحصائيات عند استخدام مفاتيح API</p>
        </div>
      )}
    </div>
  );
}
