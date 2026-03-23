import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "قيد المراجعة", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  approved: { label: "موافق عليه", color: "bg-green-100 text-green-700", icon: CheckCircle },
  rejected: { label: "مرفوض", color: "bg-red-100 text-red-600", icon: XCircle },
};

export default function RenewalRequests() {
  const requests = trpc.renewalRequests.list.useQuery();
  const utils = trpc.useUtils();

  const review = trpc.renewalRequests.review.useMutation({
    onSuccess: () => { toast.success("تم تحديث حالة الطلب"); utils.renewalRequests.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const list = requests.data ?? [];
  const pending = list.filter(r => r.status === "pending");
  const processed = list.filter(r => r.status !== "pending");

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <RefreshCw className="w-6 h-6" />
          طلبات تجديد العقود
        </h1>
        <p className="text-muted-foreground text-sm mt-1">طلبات تجديد العقود الواردة من المستأجرين عبر البوابة</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><div className="text-sm text-muted-foreground">قيد المراجعة</div><div className="text-3xl font-bold text-yellow-600">{pending.length}</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-sm text-muted-foreground">موافق عليها</div><div className="text-3xl font-bold text-green-600">{list.filter(r => r.status === "approved").length}</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-sm text-muted-foreground">مرفوضة</div><div className="text-3xl font-bold text-red-500">{list.filter(r => r.status === "rejected").length}</div></CardContent></Card>
      </div>

      {/* Pending Requests */}
      {pending.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="text-base text-yellow-700">طلبات تحتاج مراجعة ({pending.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pending.map(req => (
                <div key={req.id} className="border rounded-lg p-4 bg-yellow-50/30">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">طلب تجديد عقد #{req.contractId}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        المستأجر #{req.tenantId} — {new Date(req.createdAt).toLocaleDateString("ar-SA")}
                      </div>
                      {req.requestedRentAmount && (
                        <div className="text-sm mt-1">الإيجار المقترح: <strong>{Number(req.requestedRentAmount).toLocaleString()} ر.س</strong></div>
                      )}
                      {req.notes && <div className="text-sm text-muted-foreground mt-1">ملاحظات: {req.notes}</div>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-1" onClick={() => review.mutate({ id: req.id, status: "approved" })} disabled={review.isPending}>
                        <CheckCircle className="w-3 h-3" />
                        موافقة
                      </Button>
                      <Button size="sm" variant="destructive" className="gap-1" onClick={() => review.mutate({ id: req.id, status: "rejected" })} disabled={review.isPending}>
                        <XCircle className="w-3 h-3" />
                        رفض
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processed Requests */}
      {processed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الطلبات المعالجة ({processed.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-right py-2 px-3">رقم العقد</th>
                    <th className="text-right py-2 px-3">المستأجر</th>
                    <th className="text-right py-2 px-3">الإيجار المقترح</th>
                    <th className="text-right py-2 px-3">الحالة</th>
                    <th className="text-right py-2 px-3">تاريخ الطلب</th>
                  </tr>
                </thead>
                <tbody>
                  {processed.map(req => {
                    const status = STATUS_MAP[req.status] ?? STATUS_MAP.pending;
                    const Icon = status.icon;
                    return (
                      <tr key={req.id} className="border-b hover:bg-muted/20">
                        <td className="py-2 px-3 font-medium">#{req.contractId}</td>
                        <td className="py-2 px-3">#{req.tenantId}</td>
                        <td className="py-2 px-3">{req.requestedRentAmount ? `${Number(req.requestedRentAmount).toLocaleString()} ر.س` : "—"}</td>
                        <td className="py-2 px-3">
                          <Badge className={`text-xs gap-1 ${status.color}`}>
                            <Icon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">{new Date(req.createdAt).toLocaleDateString("ar-SA")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {list.length === 0 && !requests.isLoading && (
        <div className="text-center py-16 text-muted-foreground">
          <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد طلبات تجديد عقود بعد</p>
          <p className="text-xs mt-1">ستظهر هنا الطلبات الواردة من المستأجرين عبر بوابة المستأجر</p>
        </div>
      )}
    </div>
  );
}
