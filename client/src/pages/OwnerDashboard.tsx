import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Building2, TrendingUp, TrendingDown, DollarSign, Home, FileText, Send, RefreshCw } from "lucide-react";

const MONTH_NAMES = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

export default function OwnerDashboard() {
  const { data, isLoading, refetch } = trpc.ownerMonthlyReport.useQuery({});
  const sendReportMutation = trpc.sendOwnerMonthlyReport.useMutation({
    onSuccess: () => toast.success("تم إرسال التقرير عبر تيليغرام بنجاح"),
    onError: () => toast.error("فشل إرسال التقرير"),
  });

  if (isLoading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

  const d = data;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="h-6 w-6 text-blue-600" /> لوحة تحكم المالك</h1>
          <p className="text-muted-foreground mt-1">
            تقرير شهر {d ? MONTH_NAMES[(d.month ?? 1) - 1] : ""} {d?.year}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}><RefreshCw className="h-4 w-4 ml-2" /> تحديث</Button>
          <Button onClick={() => sendReportMutation.mutate({})} disabled={sendReportMutation.isPending}>
            <Send className="h-4 w-4 ml-2" />
            {sendReportMutation.isPending ? "جاري الإرسال..." : "إرسال عبر تيليغرام"}
          </Button>
        </div>
      </div>

      {/* الملخص المالي */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2"><DollarSign className="h-5 w-5 text-blue-600" /><span className="text-sm text-blue-700">الإيرادات</span></div>
            <p className="text-2xl font-bold text-blue-900">{(d?.totalRevenue ?? 0).toLocaleString("ar-SA")}</p>
            <p className="text-xs text-blue-600 mt-1">ر.س هذا الشهر</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2"><TrendingDown className="h-5 w-5 text-red-600" /><span className="text-sm text-red-700">المصروفات</span></div>
            <p className="text-2xl font-bold text-red-900">{(d?.totalExpenses ?? 0).toLocaleString("ar-SA")}</p>
            <p className="text-xs text-red-600 mt-1">ر.س هذا الشهر</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-5 w-5 text-green-600" /><span className="text-sm text-green-700">الصافي</span></div>
            <p className="text-2xl font-bold text-green-900">{(d?.netIncome ?? 0).toLocaleString("ar-SA")}</p>
            <p className="text-xs text-green-600 mt-1">ر.س صافي الربح</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2"><Home className="h-5 w-5 text-orange-600" /><span className="text-sm text-orange-700">الشاغرة</span></div>
            <p className="text-2xl font-bold text-orange-900">{d?.vacantCount ?? 0}</p>
            <p className="text-xs text-orange-600 mt-1">وحدة شاغرة من {d?.totalProperties ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* إحصائيات إضافية */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{d?.rentedCount ?? 0}</p>
          <p className="text-sm text-muted-foreground">وحدات مؤجرة</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{d?.paymentsCount ?? 0}</p>
          <p className="text-sm text-muted-foreground">دفعات مستلمة</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{d?.expensesCount ?? 0}</p>
          <p className="text-sm text-muted-foreground">مصروفات مسجلة</p>
        </CardContent></Card>
      </div>

      {/* أداء العقارات */}
      {d?.propertyBreakdown && d.propertyBreakdown.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> أداء العقارات هذا الشهر</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="p-3 text-right">العقار</th>
                  <th className="p-3 text-right">الحالة</th>
                  <th className="p-3 text-right">الإيرادات</th>
                  <th className="p-3 text-right">المصروفات</th>
                  <th className="p-3 text-right">الصافي</th>
                </tr></thead>
                <tbody>
                  {d.propertyBreakdown.map((prop: any) => {
                    const net = (prop.revenue ?? 0) - (prop.expenses ?? 0);
                    return (
                      <tr key={prop.id} className="border-b hover:bg-muted/30">
                        <td className="p-3 font-medium">{prop.title}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-xs ${prop.status === "rented" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                            {prop.status === "rented" ? "مؤجر" : "شاغر"}
                          </span>
                        </td>
                        <td className="p-3 text-green-700">{(prop.revenue ?? 0).toLocaleString("ar-SA")} ر.س</td>
                        <td className="p-3 text-red-600">{(prop.expenses ?? 0).toLocaleString("ar-SA")} ر.س</td>
                        <td className={`p-3 font-medium ${net >= 0 ? "text-green-700" : "text-red-600"}`}>
                          {net.toLocaleString("ar-SA")} ر.س
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* نصيحة */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <p className="text-sm text-blue-700">
            💡 يمكنك إرسال هذا التقرير مباشرة عبر تيليغرام بالضغط على زر "إرسال عبر تيليغرام" أعلاه. يمكن جدولة الإرسال التلقائي شهرياً من إعدادات النظام.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
