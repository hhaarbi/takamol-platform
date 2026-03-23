import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Bell, AlertTriangle, Calendar, Wrench, Building2,
  Send, RefreshCw, CheckCircle, Clock, TrendingDown, Filter, X
} from "lucide-react";

type AlertPriority = "all" | "urgent" | "important" | "info";

function DaysTag({ days, type }: { days: number; type: "overdue" | "expiry" | "vacant" | "pending" }) {
  if (type === "overdue") {
    const cls = days > 30 ? "bg-red-100 text-red-700" : days > 14 ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700";
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>تأخر {days} يوم</span>;
  }
  if (type === "expiry") {
    const cls = days <= 14 ? "bg-red-100 text-red-700" : days <= 30 ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700";
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>بعد {days} يوم</span>;
  }
  if (type === "vacant") {
    const cls = days > 60 ? "bg-red-100 text-red-700" : days > 30 ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700";
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>شاغرة {days} يوم</span>;
  }
  return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">معلق {days} يوم</span>;
}

function getAlertPriority(type: string, days: number, extra?: string): AlertPriority {
  if (type === "overdue" && days > 30) return "urgent";
  if (type === "overdue" && days > 14) return "important";
  if (type === "overdue") return "info";
  if (type === "expiry" && days <= 14) return "urgent";
  if (type === "expiry" && days <= 30) return "important";
  if (type === "expiry") return "info";
  if (type === "maintenance" && extra === "urgent") return "urgent";
  if (type === "maintenance") return "important";
  if (type === "vacant" && days > 60) return "important";
  return "info";
}

export default function SmartAlerts() {
  const { data: alerts, isLoading, refetch } = trpc.smartAlerts.get.useQuery();
  const sendReport = trpc.smartAlerts.sendDailyReport.useMutation({
    onSuccess: () => toast.success("تم إرسال التقرير اليومي عبر تيليغرام بنجاح ✅"),
    onError: (e) => toast.error(`فشل الإرسال: ${e.message}`),
  });

  const [filter, setFilter] = useState<AlertPriority>("all");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const dismiss = (key: string) => {
    setDismissed(prev => new Set(Array.from(prev).concat(key)));
    toast.success("تم تحديد التنبيه كـ 'تمت المعالجة'");
  };

  const overdueFiltered = useMemo(() => {
    if (!alerts?.overduePayments) return [];
    return alerts.overduePayments.filter(p => {
      const key = `overdue-${p.id}`;
      if (dismissed.has(key)) return false;
      const priority = getAlertPriority("overdue", Number(p.daysOverdue));
      return filter === "all" || priority === filter;
    });
  }, [alerts, filter, dismissed]);

  const expiringFiltered = useMemo(() => {
    if (!alerts?.expiringContracts) return [];
    return alerts.expiringContracts.filter(c => {
      const key = `expiry-${c.id}`;
      if (dismissed.has(key)) return false;
      const priority = getAlertPriority("expiry", Number(c.daysLeft));
      return filter === "all" || priority === filter;
    });
  }, [alerts, filter, dismissed]);

  const maintenanceFiltered = useMemo(() => {
    if (!alerts?.pendingMaintenance) return [];
    return alerts.pendingMaintenance.filter(m => {
      const key = `maint-${m.id}`;
      if (dismissed.has(key)) return false;
      const priority = getAlertPriority("maintenance", 0, m.priority);
      return filter === "all" || priority === filter;
    });
  }, [alerts, filter, dismissed]);

  const vacantFiltered = useMemo(() => {
    if (!alerts?.vacantUnits) return [];
    return alerts.vacantUnits.filter(u => {
      const key = `vacant-${u.id}`;
      if (dismissed.has(key)) return false;
      const priority = getAlertPriority("vacant", Number(u.daysVacant ?? 0));
      return filter === "all" || priority === filter;
    });
  }, [alerts, filter, dismissed]);

  const totalAlerts = (alerts?.overduePayments.length ?? 0) +
    (alerts?.expiringContracts.length ?? 0) +
    (alerts?.pendingMaintenance.length ?? 0) +
    (alerts?.vacantUnits.length ?? 0);

  const urgentCount = (alerts?.overduePayments.filter(p => getAlertPriority("overdue", Number(p.daysOverdue)) === "urgent").length ?? 0) +
    (alerts?.expiringContracts.filter(c => getAlertPriority("expiry", Number(c.daysLeft)) === "urgent").length ?? 0) +
    (alerts?.pendingMaintenance.filter(m => m.priority === "urgent").length ?? 0);

  const visibleCount = overdueFiltered.length + expiringFiltered.length + maintenanceFiltered.length + vacantFiltered.length;

  const FILTER_OPTIONS: { value: AlertPriority; label: string; color: string; activeColor: string }[] = [
    { value: "all", label: "الكل", color: "border-gray-300 text-gray-700", activeColor: "bg-gray-800 text-white border-gray-800" },
    { value: "urgent", label: "🚨 عاجل", color: "border-red-300 text-red-700", activeColor: "bg-red-600 text-white border-red-600" },
    { value: "important", label: "⚠️ مهم", color: "border-orange-300 text-orange-700", activeColor: "bg-orange-500 text-white border-orange-500" },
    { value: "info", label: "ℹ️ تنبيه", color: "border-blue-300 text-blue-700", activeColor: "bg-blue-500 text-white border-blue-500" },
  ];

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="relative p-2 bg-red-50 rounded-lg">
            <Bell className="h-5 w-5 text-red-600" />
            {urgentCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">{urgentCount}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">مركز التنبيهات الذكي</h1>
            <p className="text-gray-500 text-sm">
              {isLoading ? "جاري التحميل..." : `${totalAlerts} تنبيه إجمالي${dismissed.size > 0 ? ` • ${dismissed.size} تمت معالجته` : ""}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
          {dismissed.size > 0 && (
            <Button variant="outline" size="sm" onClick={() => setDismissed(new Set())} className="gap-2 text-gray-500">
              <X className="h-4 w-4" />
              إعادة عرض المعالجة ({dismissed.size})
            </Button>
          )}
          <Button
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            size="sm"
            onClick={() => sendReport.mutate()}
            disabled={sendReport.isPending}
          >
            <Send className="h-4 w-4" />
            {sendReport.isPending ? "جاري الإرسال..." : "إرسال تقرير تيليغرام"}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">فلتر الأولوية:</span>
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${filter === opt.value ? opt.activeColor : opt.color + " bg-white hover:bg-gray-50"}`}
          >
            {opt.label}
            {opt.value !== "all" && (
              <span className="mr-1 opacity-70">
                ({opt.value === "urgent" ? urgentCount :
                  opt.value === "important" ? (alerts?.overduePayments.filter(p => getAlertPriority("overdue", Number(p.daysOverdue)) === "important").length ?? 0) + (alerts?.expiringContracts.filter(c => getAlertPriority("expiry", Number(c.daysLeft)) === "important").length ?? 0) + (alerts?.pendingMaintenance.filter(m => m.priority === "high").length ?? 0) + (alerts?.vacantUnits.filter(u => getAlertPriority("vacant", Number(u.daysVacant ?? 0)) === "important").length ?? 0) :
                  totalAlerts - urgentCount})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={`border-0 ${(alerts?.overduePayments.length ?? 0) > 0 ? "bg-red-50" : "bg-green-50"}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className={`h-8 w-8 ${(alerts?.overduePayments.length ?? 0) > 0 ? "text-red-500" : "text-green-500"}`} />
            <div>
              <div className="text-2xl font-bold">{alerts?.overduePayments.length ?? 0}</div>
              <div className="text-xs text-gray-600">دفعة متأخرة</div>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-0 ${(alerts?.expiringContracts.length ?? 0) > 0 ? "bg-orange-50" : "bg-green-50"}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className={`h-8 w-8 ${(alerts?.expiringContracts.length ?? 0) > 0 ? "text-orange-500" : "text-green-500"}`} />
            <div>
              <div className="text-2xl font-bold">{alerts?.expiringContracts.length ?? 0}</div>
              <div className="text-xs text-gray-600">عقد ينتهي قريباً</div>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-0 ${(alerts?.pendingMaintenance.length ?? 0) > 0 ? "bg-purple-50" : "bg-green-50"}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <Wrench className={`h-8 w-8 ${(alerts?.pendingMaintenance.length ?? 0) > 0 ? "text-purple-500" : "text-green-500"}`} />
            <div>
              <div className="text-2xl font-bold">{alerts?.pendingMaintenance.length ?? 0}</div>
              <div className="text-xs text-gray-600">صيانة عاجلة</div>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-0 ${(alerts?.vacantUnits.length ?? 0) > 0 ? "bg-yellow-50" : "bg-green-50"}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <Building2 className={`h-8 w-8 ${(alerts?.vacantUnits.length ?? 0) > 0 ? "text-yellow-600" : "text-green-500"}`} />
            <div>
              <div className="text-2xl font-bold">{alerts?.vacantUnits.length ?? 0}</div>
              <div className="text-xs text-gray-600">وحدة شاغرة</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {visibleCount === 0 && !isLoading && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-8 flex flex-col items-center gap-3">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h3 className="text-lg font-semibold text-green-800">
              {filter === "all" ? "كل شيء على ما يرام!" : `لا توجد تنبيهات بمستوى "${FILTER_OPTIONS.find(f => f.value === filter)?.label}"`}
            </h3>
            <p className="text-green-600 text-sm">
              {dismissed.size > 0 ? `تمت معالجة ${dismissed.size} تنبيه` : "لا توجد تنبيهات تحتاج متابعة حالياً"}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Payments */}
        {overdueFiltered.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                الدفعات المتأخرة
                <Badge className="bg-red-100 text-red-700 mr-auto">{overdueFiltered.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {overdueFiltered.map((p, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 group">
                    <div>
                      <div className="font-medium text-sm text-gray-900">{p.tenantName ?? "غير محدد"}</div>
                      <div className="text-xs text-gray-500">{p.propertyTitle ?? "—"}</div>
                    </div>
                    <div className="text-left flex flex-col items-end gap-1">
                      <div className="font-bold text-red-700 text-sm">{Number(p.amount).toLocaleString("ar-SA")} ر.س</div>
                      <div className="flex items-center gap-1">
                        <DaysTag days={Number(p.daysOverdue)} type="overdue" />
                        <button
                          onClick={() => dismiss(`overdue-${p.id}`)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-green-600 hover:text-green-800 flex items-center gap-0.5"
                          title="تمت المعالجة"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expiring Contracts */}
        {expiringFiltered.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-500" />
                عقود تنتهي قريباً (60 يوم)
                <Badge className="bg-orange-100 text-orange-700 mr-auto">{expiringFiltered.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {expiringFiltered.map((c, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 group">
                    <div>
                      <div className="font-medium text-sm text-gray-900">{c.tenantName ?? "غير محدد"}</div>
                      <div className="text-xs text-gray-500">{c.propertyTitle ?? "—"}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-xs text-gray-500">{String(c.endDate)}</div>
                      <div className="flex items-center gap-1">
                        <DaysTag days={Number(c.daysLeft)} type="expiry" />
                        <button
                          onClick={() => dismiss(`expiry-${c.id}`)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-green-600 hover:text-green-800"
                          title="تمت المعالجة"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Maintenance */}
        {maintenanceFiltered.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4 text-purple-500" />
                صيانة عاجلة معلقة
                <Badge className="bg-purple-100 text-purple-700 mr-auto">{maintenanceFiltered.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {maintenanceFiltered.map((m, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 group">
                    <div>
                      <div className="font-medium text-sm text-gray-900">{m.title}</div>
                      <div className="text-xs text-gray-500">{m.propertyTitle ?? "—"}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={m.priority === "urgent" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}>
                        {m.priority === "urgent" ? "عاجل" : "عالي"}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <DaysTag days={Number(m.daysPending)} type="pending" />
                        <button
                          onClick={() => dismiss(`maint-${m.id}`)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-green-600 hover:text-green-800"
                          title="تمت المعالجة"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vacant Units */}
        {vacantFiltered.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-yellow-600" />
                وحدات شاغرة
                <Badge className="bg-yellow-100 text-yellow-700 mr-auto">{vacantFiltered.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {vacantFiltered.map((u, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 group">
                    <div>
                      <div className="font-medium text-sm text-gray-900">وحدة {u.unitNumber}</div>
                      <div className="text-xs text-gray-500">{u.propertyTitle ?? "—"}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-xs font-medium text-gray-700">{Number(u.rentPrice ?? 0).toLocaleString("ar-SA")} ر.س/شهر</div>
                      <div className="flex items-center gap-1">
                        <DaysTag days={Number(u.daysVacant ?? 0)} type="vacant" />
                        <button
                          onClick={() => dismiss(`vacant-${u.id}`)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-green-600 hover:text-green-800"
                          title="تمت المعالجة"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Telegram Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 flex items-start gap-3">
          <Clock className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <div className="font-medium text-blue-900 text-sm">التقرير اليومي التلقائي — 8:00 صباحاً</div>
            <div className="text-blue-700 text-xs mt-1">
              يُرسل النظام تقريراً يومياً تلقائياً عبر تيليغرام كل صباح الساعة 8:00 (توقيت الرياض).
              يمكنك أيضاً إرسال التقرير يدوياً في أي وقت. مرّر على أي تنبيه وانقر ✓ لتحديده كـ "تمت المعالجة".
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
