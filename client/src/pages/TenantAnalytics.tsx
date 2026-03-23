import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, TrendingUp, TrendingDown, Minus, Users, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

const SCORE_COLOR = (score: number) => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
};

const SCORE_LABEL = (score: number) => {
  if (score >= 80) return { label: "ممتاز", color: "bg-green-100 text-green-700" };
  if (score >= 60) return { label: "جيد", color: "bg-amber-100 text-amber-700" };
  if (score >= 40) return { label: "متوسط", color: "bg-orange-100 text-orange-700" };
  return { label: "ضعيف", color: "bg-red-100 text-red-700" };
};

export default function TenantAnalytics() {
  const { data, isLoading } = trpc.tenantAnalysis.list.useQuery();

  const summary = data ? {
    total: data.length,
    excellent: data.filter(t => t.reliabilityScore >= 80).length,
    needsAttention: data.filter(t => t.reliabilityScore < 60).length,
    avgDelayDays: data.length > 0 ? data.reduce((s, t) => s + t.avgDelay, 0) / data.length : 0,
  } : null;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">تحليل سلوك المستأجرين</h1>
        <p className="text-muted-foreground mt-1">درجة الموثوقية ومعدل الالتزام بالدفع لكل مستأجر</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "إجمالي المستأجرين", value: summary.total, icon: <Users className="h-5 w-5 text-blue-500" />, color: "text-foreground" },
            { label: "ممتاز (80+)", value: summary.excellent, icon: <CheckCircle2 className="h-5 w-5 text-green-500" />, color: "text-green-600" },
            { label: "يحتاج متابعة (< 60)", value: summary.needsAttention, icon: <AlertTriangle className="h-5 w-5 text-amber-500" />, color: "text-amber-600" },
            { label: "متوسط التأخير (أيام)", value: summary.avgDelayDays.toFixed(1), icon: <Clock className="h-5 w-5 text-red-500" />, color: "text-red-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 flex items-center gap-3">
                {s.icon}
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            تقييم المستأجرين
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : !data?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>لا يوجد مستأجرون بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.map(t => {
                const scoreInfo = SCORE_LABEL(t.reliabilityScore);
                const trend = t.reliabilityScore >= 80 ? <TrendingUp className="h-4 w-4 text-green-500" /> :
                  t.reliabilityScore < 60 ? <TrendingDown className="h-4 w-4 text-red-500" /> :
                  <Minus className="h-4 w-4 text-gray-400" />;

                return (
                  <div key={t.id} className="rounded-xl border p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{t.name}</h3>
                          <Badge className={`text-xs border-0 ${scoreInfo.color}`}>{scoreInfo.label}</Badge>
                          {trend}
                        </div>
                          <p className="text-xs text-muted-foreground">{t.phone}</p>
                      </div>
                      <div className="text-left shrink-0">
                        <p className={`text-2xl font-bold ${SCORE_COLOR(t.reliabilityScore)}`}>{t.reliabilityScore}</p>
                        <p className="text-xs text-muted-foreground">/ 100</p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <Progress value={t.reliabilityScore} className="h-2" />

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div className="bg-muted/30 rounded-lg p-2">
                          <p className="text-muted-foreground">معدل الالتزام</p>
                          <p className="font-semibold text-green-600">{t.commitmentRate}%</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-2">
                          <p className="text-muted-foreground">متوسط التأخير</p>
                          <p className={`font-semibold ${t.avgDelay > 7 ? "text-red-500" : "text-amber-500"}`}>
                            {t.avgDelay} يوم
                          </p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-2">
                          <p className="text-muted-foreground">إجمالي المدفوع</p>
                          <p className="font-semibold">{t.onTimePayments} / {t.totalPayments}</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-2">
                          <p className="text-muted-foreground">المتأخرات الحالية</p>
                          <p className={`font-semibold ${t.latePayments > 0 ? "text-red-500" : "text-green-600"}`}>
                            {t.latePayments > 0 ? `${t.latePayments} دفعة` : "لا يوجد"}
                          </p>
                        </div>
                      </div>


                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
