import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Bell, AlertTriangle, Calendar, Wrench, Building2,
  Send, RefreshCw, CheckCircle, Clock, TrendingDown
} from "lucide-react";

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

export default function SmartAlerts() {
  const { data: alerts, isLoading, refetch } = trpc.smartAlerts.get.useQuery();
  const sendReport = trpc.smartAlerts.sendDailyReport.useMutation({
    onSuccess: () => toast.success("تم إرسال التقرير اليومي عبر تيليغرام بنجاح ✅"),
    onError: (e) => toast.error(`فشل الإرسال: ${e.message}`),
  });

  const totalAlerts = (alerts?.overduePayments.length ?? 0) +
    (alerts?.expiringContracts.length ?? 0) +
    (alerts?.pendingMaintenance.length ?? 0) +
    (alerts?.vacantUnits.length ?? 0);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-lg">
            <Bell className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">مركز التنبيهات الذكي</h1>
            <p className="text-gray-500 text-sm">
              {isLoading ? "جاري التحميل..." : `${totalAlerts} تنبيه يحتاج متابعة`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
          <Button
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            size="sm"
            onClick={() => sendReport.mutate()}
            disabled={sendReport.isPending}
          >
            <Send className="h-4 w-4" />
            {sendReport.isPending ? "جاري الإرسال..." : "إرسال تقرير يومي تيليغرام"}
          </Button>
        </div>
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

      {totalAlerts === 0 && !isLoading && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-8 flex flex-col items-center gap-3">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h3 className="text-lg font-semibold text-green-800">كل شيء على ما يرام!</h3>
            <p className="text-green-600 text-sm">لا توجد تنبيهات تحتاج متابعة حالياً</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Payments */}
        {(alerts?.overduePayments.length ?? 0) > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                الدفعات المتأخرة
                <Badge className="bg-red-100 text-red-700 mr-auto">{alerts!.overduePayments.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {alerts!.overduePayments.map((p, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <div className="font-medium text-sm text-gray-900">{p.tenantName ?? "غير محدد"}</div>
                      <div className="text-xs text-gray-500">{p.propertyTitle ?? "—"}</div>
                    </div>
                    <div className="text-left flex flex-col items-end gap-1">
                      <div className="font-bold text-red-700 text-sm">{Number(p.amount).toLocaleString("ar-SA")} ر.س</div>
                      <DaysTag days={Number(p.daysOverdue)} type="overdue" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expiring Contracts */}
        {(alerts?.expiringContracts.length ?? 0) > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-500" />
                عقود تنتهي قريباً (60 يوم)
                <Badge className="bg-orange-100 text-orange-700 mr-auto">{alerts!.expiringContracts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {alerts!.expiringContracts.map((c, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <div className="font-medium text-sm text-gray-900">{c.tenantName ?? "غير محدد"}</div>
                      <div className="text-xs text-gray-500">{c.propertyTitle ?? "—"}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-xs text-gray-500">{String(c.endDate)}</div>
                      <DaysTag days={Number(c.daysLeft)} type="expiry" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Maintenance */}
        {(alerts?.pendingMaintenance.length ?? 0) > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4 text-purple-500" />
                صيانة عاجلة معلقة
                <Badge className="bg-purple-100 text-purple-700 mr-auto">{alerts!.pendingMaintenance.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {alerts!.pendingMaintenance.map((m, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <div className="font-medium text-sm text-gray-900">{m.title}</div>
                      <div className="text-xs text-gray-500">{m.propertyTitle ?? "—"}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={m.priority === "urgent" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}>
                        {m.priority === "urgent" ? "عاجل" : "عالي"}
                      </Badge>
                      <DaysTag days={Number(m.daysPending)} type="pending" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vacant Units */}
        {(alerts?.vacantUnits.length ?? 0) > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-yellow-600" />
                وحدات شاغرة
                <Badge className="bg-yellow-100 text-yellow-700 mr-auto">{alerts!.vacantUnits.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {alerts!.vacantUnits.map((u, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <div className="font-medium text-sm text-gray-900">وحدة {u.unitNumber}</div>
                      <div className="text-xs text-gray-500">{u.propertyTitle ?? "—"}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-xs font-medium text-gray-700">{Number(u.rentPrice ?? 0).toLocaleString("ar-SA")} ر.س/شهر</div>
                      <DaysTag days={Number(u.daysVacant ?? 0)} type="vacant" />
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
            <div className="font-medium text-blue-900 text-sm">التقرير اليومي التلقائي</div>
            <div className="text-blue-700 text-xs mt-1">
              يمكنك إرسال التقرير اليومي يدوياً في أي وقت عبر زر "إرسال تقرير يومي تيليغرام" أعلاه.
              يتضمن التقرير: ملخص KPIs، الدفعات المتأخرة، العقود المنتهية، وطلبات الصيانة العاجلة.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
