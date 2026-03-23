import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  rent: "إيجار",
  sale: "بيع",
  management: "إدارة",
};

const STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  expired: "منتهي",
  terminated: "مُنهى",
  pending: "معلق",
  renewed: "مجدد",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  expired: "bg-gray-100 text-gray-600",
  terminated: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
  renewed: "bg-blue-100 text-blue-700",
};

export default function ArchivedContracts() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = trpc.getArchivedContracts.useQuery({ page, limit: 20 });

  const unarchive = trpc.unarchiveContract.useMutation({
    onSuccess: () => {
      toast.success("تم إلغاء أرشفة العقد بنجاح");
      refetch();
    },
    onError: () => toast.error("حدث خطأ أثناء إلغاء الأرشفة"),
  });

  const contracts = data?.contracts ?? [];

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">أرشيف العقود</h1>
        <p className="text-muted-foreground text-sm mt-1">العقود المنتهية والمؤرشفة</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">العقود المؤرشفة</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>
          ) : contracts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              لا توجد عقود مؤرشفة حتى الآن
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">رقم العقد</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">النوع</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">الحالة</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">تاريخ البداية</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">تاريخ الانتهاء</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">الإيجار السنوي</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">تاريخ الأرشفة</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">سبب الأرشفة</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map(c => (
                    <tr key={c.id} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium">{c.contractNumber}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{CONTRACT_TYPE_LABELS[c.type] ?? c.type}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {STATUS_LABELS[c.status] ?? c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.startDate ? new Date(String(c.startDate)).toLocaleDateString("ar-SA") : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.endDate ? new Date(String(c.endDate)).toLocaleDateString("ar-SA") : "—"}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {c.rentAmount ? Number(c.rentAmount).toLocaleString("ar-SA") + " ر.س" : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.archivedAt ? new Date(c.archivedAt).toLocaleDateString("ar-SA") : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-32 truncate">
                        {c.archivedReason ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => unarchive.mutate({ contractId: c.id })}
                          disabled={unarchive.isPending}
                        >
                          إلغاء الأرشفة
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ترقيم الصفحات */}
      {contracts.length > 0 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            السابق
          </Button>
          <span className="text-sm text-muted-foreground">صفحة {page}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={contracts.length < 20}
          >
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}
