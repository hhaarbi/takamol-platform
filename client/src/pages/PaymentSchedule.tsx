import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle2, Clock, Search, Filter, TrendingUp, DollarSign, Calendar, AlertCircle } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  paid:    { label: "مدفوعة",   color: "bg-green-500/15 text-green-400 border-green-500/30",  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  pending: { label: "معلقة",    color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: <Clock className="w-3.5 h-3.5" /> },
  overdue: { label: "متأخرة",   color: "bg-red-500/15 text-red-400 border-red-500/30",        icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  partial: { label: "جزئية",   color: "bg-blue-500/15 text-blue-400 border-blue-500/30",     icon: <AlertCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: "ملغاة", color: "bg-gray-500/15 text-gray-400 border-gray-500/30",    icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

const ESCALATION_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: "—",              color: "text-gray-500" },
  1: { label: "تذكير أول",      color: "text-yellow-400" },
  2: { label: "تذكير ثانٍ",     color: "text-orange-400" },
  3: { label: "إشعار رسمي",    color: "text-red-400" },
  4: { label: "إجراء قانوني",   color: "text-red-600 font-bold" },
};

export default function PaymentSchedule() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [contractFilter, setContractFilter] = useState<string>("all");

  const { data: payments = [], isLoading } = trpc.payments.list.useQuery({});
  const { data: contracts = [] } = trpc.contracts.list.useQuery({});
  const { data: tenants = [] } = trpc.tenants.list.useQuery({});

  const tenantMap = useMemo(() => {
    const m: Record<number, string> = {};
    tenants.forEach((t: any) => { m[t.id] = t.nameAr || t.name || "—"; });
    return m;
  }, [tenants]);

  const contractMap = useMemo(() => {
    const m: Record<number, string> = {};
    contracts.forEach((c: any) => { m[c.id] = c.contractNumber || `#${c.id}`; });
    return m;
  }, [contracts]);

  const filtered = useMemo(() => {
    return payments.filter((p: any) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (contractFilter !== "all" && String(p.contractId) !== contractFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const tenant = tenantMap[p.tenantId] ?? "";
        const contract = contractMap[p.contractId ?? 0] ?? "";
        if (!tenant.toLowerCase().includes(q) && !contract.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [payments, statusFilter, contractFilter, search, tenantMap, contractMap]);

  // إحصائيات سريعة
  const stats = useMemo(() => {
    const all = payments as any[];
    const paid = all.filter(p => p.status === "paid");
    const overdue = all.filter(p => p.status === "overdue");
    const pending = all.filter(p => p.status === "pending");
    const totalRevenue = paid.reduce((s: number, p: any) => s + parseFloat(p.amount ?? "0"), 0);
    const totalOverdue = overdue.reduce((s: number, p: any) => s + parseFloat(p.amount ?? "0"), 0);
    const totalLateFees = all.reduce((s: number, p: any) => s + parseFloat(p.lateFeeAmount ?? "0"), 0);
    return { paid: paid.length, overdue: overdue.length, pending: pending.length, totalRevenue, totalOverdue, totalLateFees };
  }, [payments]);

  const uniqueContracts = useMemo(() => {
    const ids = new Set((payments as any[]).map((p: any) => p.contractId).filter(Boolean));
    return Array.from(ids) as number[];
  }, [payments]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">جدول الدفعات</h1>
            <p className="text-gray-400 text-sm mt-1">متابعة دورة حياة كل دفعة — مدفوعة، معلقة، متأخرة</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="bg-gray-900/60 border-gray-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">مدفوعة</span>
              </div>
              <p className="text-xl font-bold text-green-400">{stats.paid}</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/60 border-gray-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-gray-400">معلقة</span>
              </div>
              <p className="text-xl font-bold text-yellow-400">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/60 border-gray-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-xs text-gray-400">متأخرة</span>
              </div>
              <p className="text-xl font-bold text-red-400">{stats.overdue}</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/60 border-gray-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-gray-400">إجمالي محصّل</span>
              </div>
              <p className="text-lg font-bold text-emerald-400">{stats.totalRevenue.toLocaleString("ar-SA")} ر</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/60 border-gray-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-red-400" />
                <span className="text-xs text-gray-400">إجمالي متأخر</span>
              </div>
              <p className="text-lg font-bold text-red-400">{stats.totalOverdue.toLocaleString("ar-SA")} ر</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/60 border-gray-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-gray-400">غرامات تأخير</span>
              </div>
              <p className="text-lg font-bold text-orange-400">{stats.totalLateFees.toLocaleString("ar-SA")} ر</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-gray-900/60 border-gray-700/50">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="بحث بالمستأجر أو رقم العقد..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pr-9 bg-gray-800 border-gray-600 text-white placeholder-gray-500 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-gray-800 border-gray-600 text-white text-sm">
                  <Filter className="w-3.5 h-3.5 ml-1" />
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="paid">مدفوعة</SelectItem>
                  <SelectItem value="pending">معلقة</SelectItem>
                  <SelectItem value="overdue">متأخرة</SelectItem>
                  <SelectItem value="partial">جزئية</SelectItem>
                </SelectContent>
              </Select>
              <Select value={contractFilter} onValueChange={setContractFilter}>
                <SelectTrigger className="w-[160px] bg-gray-800 border-gray-600 text-white text-sm">
                  <Calendar className="w-3.5 h-3.5 ml-1" />
                  <SelectValue placeholder="العقد" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">جميع العقود</SelectItem>
                  {uniqueContracts.map(id => (
                    <SelectItem key={id} value={String(id)}>
                      {contractMap[id] ?? `عقد #${id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(statusFilter !== "all" || contractFilter !== "all" || search) && (
                <Button variant="ghost" size="sm" onClick={() => { setStatusFilter("all"); setContractFilter("all"); setSearch(""); }}
                  className="text-gray-400 hover:text-white text-xs">
                  مسح الفلاتر
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-gray-900/60 border-gray-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base">
              جدول الدفعات
              <span className="text-gray-400 font-normal text-sm mr-2">({filtered.length} دفعة)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400">جاري التحميل...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>لا توجد دفعات تطابق الفلاتر المحددة</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700/50 hover:bg-transparent">
                      <TableHead className="text-gray-400 text-xs font-medium text-right">المستأجر</TableHead>
                      <TableHead className="text-gray-400 text-xs font-medium text-right">العقد</TableHead>
                      <TableHead className="text-gray-400 text-xs font-medium text-right">النوع</TableHead>
                      <TableHead className="text-gray-400 text-xs font-medium text-right">المبلغ</TableHead>
                      <TableHead className="text-gray-400 text-xs font-medium text-right">تاريخ الاستحقاق</TableHead>
                      <TableHead className="text-gray-400 text-xs font-medium text-right">تاريخ الدفع</TableHead>
                      <TableHead className="text-gray-400 text-xs font-medium text-right">الحالة</TableHead>
                      <TableHead className="text-gray-400 text-xs font-medium text-right">أيام التأخر</TableHead>
                      <TableHead className="text-gray-400 text-xs font-medium text-right">غرامة التأخير</TableHead>
                      <TableHead className="text-gray-400 text-xs font-medium text-right">مستوى التصعيد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p: any) => {
                      const statusInfo = STATUS_LABELS[p.status] ?? STATUS_LABELS.pending;
                      const escalation = ESCALATION_LABELS[p.escalationLevel ?? 0];
                      const lateFee = parseFloat(p.lateFeeAmount ?? "0");
                      const daysOverdue = p.daysOverdue ?? 0;
                      return (
                        <TableRow key={p.id} className="border-gray-700/30 hover:bg-gray-800/40 transition-colors">
                          <TableCell className="text-white text-sm font-medium">
                            {tenantMap[p.tenantId] ?? "—"}
                          </TableCell>
                          <TableCell className="text-gray-300 text-sm">
                            {contractMap[p.contractId ?? 0] ?? "—"}
                            {p.installmentNumber && p.totalInstallments && (
                              <span className="text-gray-500 text-xs mr-1">
                                ({p.installmentNumber}/{p.totalInstallments})
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-400 text-xs">
                            {p.type === "rent" ? "إيجار" : p.type === "deposit" ? "تأمين" : p.type === "maintenance_fee" ? "صيانة" : p.type}
                          </TableCell>
                          <TableCell className="text-white font-semibold text-sm">
                            {parseFloat(p.amount ?? "0").toLocaleString("ar-SA")} ر
                          </TableCell>
                          <TableCell className="text-gray-300 text-sm">
                            {p.dueDate ? new Date(p.dueDate).toLocaleDateString("ar-SA") : "—"}
                          </TableCell>
                          <TableCell className="text-gray-300 text-sm">
                            {p.paidDate ? new Date(p.paidDate).toLocaleDateString("ar-SA") : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusInfo.color} border text-xs flex items-center gap-1 w-fit`}>
                              {statusInfo.icon}
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {daysOverdue > 0 ? (
                              <span className={`text-sm font-medium ${daysOverdue > 30 ? "text-red-400" : daysOverdue > 7 ? "text-orange-400" : "text-yellow-400"}`}>
                                {daysOverdue} يوم
                              </span>
                            ) : (
                              <span className="text-gray-500 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {lateFee > 0 ? (
                              <span className="text-orange-400 font-semibold text-sm">
                                {lateFee.toLocaleString("ar-SA")} ر
                              </span>
                            ) : (
                              <span className="text-gray-500 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs font-medium ${escalation.color}`}>
                              {escalation.label}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
