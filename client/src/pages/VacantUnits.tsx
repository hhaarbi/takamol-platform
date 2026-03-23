import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const VACANCY_REASON_LABELS: Record<string, string> = {
  new: "وحدة جديدة",
  eviction: "إخلاء",
  maintenance: "صيانة",
  end_of_contract: "انتهاء عقد",
  other: "أخرى",
};

const UNIT_TYPE_LABELS: Record<string, string> = {
  apartment: "شقة",
  room: "غرفة",
  shop: "محل",
  office: "مكتب",
  warehouse: "مستودع",
  studio: "استوديو",
};

function formatCurrency(v: number) {
  return v.toLocaleString("ar-SA") + " ر.س";
}

export default function VacantUnits() {
  const { data, isLoading } = trpc.vacantUnitsReport.useQuery();
  const [search, setSearch] = useState("");
  const [filterReason, setFilterReason] = useState("all");
  const [sortBy, setSortBy] = useState<"days" | "loss" | "price">("days");

  const units = data?.units ?? [];

  const filtered = units
    .filter(u => {
      const matchSearch =
        !search ||
        u.unitNumber?.toLowerCase().includes(search.toLowerCase()) ||
        u.propertyTitle?.toLowerCase().includes(search.toLowerCase()) ||
        u.district?.toLowerCase().includes(search.toLowerCase());
      const matchReason = filterReason === "all" || u.vacancyReason === filterReason;
      return matchSearch && matchReason;
    })
    .sort((a, b) => {
      if (sortBy === "days") return (b.vacancyDays ?? 0) - (a.vacancyDays ?? 0);
      if (sortBy === "loss") return b.totalLoss - a.totalLoss;
      return Number(b.rentPrice ?? 0) - Number(a.rentPrice ?? 0);
    });

  const getDaysColor = (days: number | null) => {
    if (!days) return "bg-gray-100 text-gray-600";
    if (days > 90) return "bg-red-100 text-red-700";
    if (days > 30) return "bg-amber-100 text-amber-700";
    return "bg-green-100 text-green-700";
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">تقرير الوحدات الشاغرة</h1>
          <p className="text-muted-foreground text-sm mt-1">تفاصيل الوحدات الشاغرة مع مدة الشغور وخسارة الإيراد</p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          طباعة التقرير
        </Button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground mb-1">إجمالي الوحدات الشاغرة</p>
            <p className="text-3xl font-bold text-foreground">{data?.count ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground mb-1">إجمالي خسارة الإيراد</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(data?.totalLoss ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground mb-1">متوسط مدة الشغور</p>
            <p className="text-3xl font-bold text-amber-600">{data?.avgDays ?? 0} يوم</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground mb-1">توزيع أسباب الشغور</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(data?.byReason ?? {}).map(([reason, count]) => (
                <span key={reason} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                  {VACANCY_REASON_LABELS[reason] ?? reason}: {count}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* فلاتر */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="بحث بالوحدة أو العقار أو الحي..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filterReason} onValueChange={setFilterReason}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="سبب الشغور" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأسباب</SelectItem>
            {Object.entries(VACANCY_REASON_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="ترتيب حسب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="days">الأطول شغوراً</SelectItem>
            <SelectItem value="loss">الأعلى خسارة</SelectItem>
            <SelectItem value="price">الأعلى إيجاراً</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* جدول الوحدات */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            الوحدات الشاغرة ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {data?.count === 0 ? "لا توجد وحدات شاغرة حالياً" : "لا توجد نتائج تطابق البحث"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">الوحدة</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">العقار</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">النوع</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">الإيجار/سنة</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">شاغرة منذ</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">مدة الشغور</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">الخسارة المتراكمة</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">السبب</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{u.unitNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{u.propertyTitle ?? "—"}</div>
                        {u.district && <div className="text-xs text-muted-foreground">{u.district}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{UNIT_TYPE_LABELS[u.type] ?? u.type}</Badge>
                        {u.area && <div className="text-xs text-muted-foreground mt-0.5">{u.area} م²</div>}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {u.rentPrice ? formatCurrency(Number(u.rentPrice)) : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u.vacantSince ? new Date(String(u.vacantSince)).toLocaleDateString("ar-SA") : "غير محدد"}
                      </td>
                      <td className="px-4 py-3">
                        {u.vacancyDays !== null ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDaysColor(u.vacancyDays)}`}>
                            {u.vacancyDays} يوم
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-red-600">
                        {u.totalLoss > 0 ? formatCurrency(u.totalLoss) : "—"}
                        {u.dailyLoss > 0 && (
                          <div className="text-xs text-muted-foreground">{formatCurrency(u.dailyLoss)}/يوم</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">
                          {VACANCY_REASON_LABELS[u.vacancyReason ?? "other"] ?? "أخرى"}
                        </Badge>
                      </td>
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
