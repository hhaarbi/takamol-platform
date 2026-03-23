import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Home, FileText, CreditCard, Wrench, AlertCircle, CheckCircle, Clock, Phone } from "lucide-react";
import { toast } from "sonner";

export default function TenantPortal() {
  const [contractCode, setContractCode] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState<{ title: string; description: string; priority: "low" | "medium" | "high" | "urgent" }>({ title: "", description: "", priority: "medium" });

  const { data, isLoading, error } = trpc.tenantPortal.getByContract.useQuery(
    { contractCode: searchCode },
    { enabled: !!searchCode }
  );

  const submitMaintenance = trpc.tenantPortal.submitMaintenance.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال طلب الصيانة بنجاح");
      setMaintenanceOpen(false);
      setMaintenanceForm({ title: "", description: "", priority: "medium" });
    },
    onError: () => toast.error("خطأ في إرسال الطلب"),
  });

  const handleSearch = () => {
    if (contractCode.trim()) setSearchCode(contractCode.trim());
  };

  const getPaymentStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "destructive" | "secondary" | "outline" }> = {
      paid: { label: "مدفوع", variant: "default" },
      pending: { label: "معلق", variant: "secondary" },
      overdue: { label: "متأخر", variant: "destructive" },
      partial: { label: "جزئي", variant: "outline" },
    };
    return map[status] || { label: status, variant: "outline" };
  };

  const getMaintenanceStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      open: { label: "مفتوح", color: "bg-blue-100 text-blue-800" },
      in_progress: { label: "قيد التنفيذ", color: "bg-yellow-100 text-yellow-800" },
      completed: { label: "مكتمل", color: "bg-green-100 text-green-800" },
      cancelled: { label: "ملغي", color: "bg-gray-100 text-gray-800" },
    };
    return map[status] || { label: status, color: "bg-gray-100 text-gray-800" };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 rtl" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-amber-700 to-orange-600 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Home className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">بوابة المستأجر</h1>
            <p className="text-amber-100 text-sm">تكامل لإدارة الأملاك — أدخل رقم عقدك للوصول إلى خدماتك</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Search */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <FileText className="w-5 h-5" />
              الدخول برقم العقد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="مثال: CNT-2025-001"
                value={contractCode}
                onChange={e => setContractCode(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                className="flex-1 text-right"
                dir="ltr"
              />
              <Button onClick={handleSearch} className="bg-amber-600 hover:bg-amber-700 text-white px-6">
                بحث
              </Button>
            </div>
            {error && (
              <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                رقم العقد غير صحيح. تأكد من الرقم وحاول مجدداً.
              </div>
            )}
          </CardContent>
        </Card>

        {isLoading && (
          <div className="text-center py-8 text-amber-600">جاري البحث...</div>
        )}

        {data && (
          <div className="space-y-5">
            {/* Contract Info */}
            <Card className="shadow-md border-0 border-r-4 border-r-amber-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-amber-800 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  معلومات العقد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">رقم العقد</p>
                    <p className="font-semibold" dir="ltr">{data.contract.contractNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">المستأجر</p>
                    <p className="font-semibold">{data.tenant?.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">قيمة الإيجار</p>
                    <p className="font-semibold text-amber-700">{Number(data.contract.rentAmount || 0).toLocaleString("ar-SA")} ر.س</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">تاريخ البداية</p>
                    <p className="font-semibold">{data.contract.startDate ? new Date(data.contract.startDate).toLocaleDateString("ar-SA") : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">تاريخ الانتهاء</p>
                    <p className="font-semibold">{data.contract.endDate ? new Date(data.contract.endDate).toLocaleDateString("ar-SA") : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">حالة العقد</p>
                    <Badge variant={data.contract.status === "active" ? "default" : "secondary"}>
                      {data.contract.status === "active" ? "ساري" : data.contract.status === "expired" ? "منتهي" : data.contract.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payments */}
            <Card className="shadow-md border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-amber-800 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    سجل المدفوعات
                  </CardTitle>
                  <div className="flex gap-3 text-sm">
                    <span className="text-green-600 font-medium">
                      مدفوع: {data.payments.filter(p => p.status === "paid").length}
                    </span>
                    <span className="text-red-600 font-medium">
                      متأخر: {data.payments.filter(p => p.status === "overdue").length}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {data.payments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">لا توجد مدفوعات مسجلة</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {data.payments.slice(0, 12).map(payment => {
                      const statusInfo = getPaymentStatusBadge(payment.status);
                      return (
                        <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {payment.status === "paid" ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : payment.status === "overdue" ? (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-yellow-500" />
                            )}
                            <div>
                              <p className="text-sm font-medium">{Number(payment.amount).toLocaleString("ar-SA")} ر.س</p>
                              <p className="text-xs text-gray-500">
                                استحقاق: {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString("ar-SA") : "—"}
                              </p>
                            </div>
                          </div>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Maintenance */}
            <Card className="shadow-md border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-amber-800 flex items-center gap-2">
                    <Wrench className="w-5 h-5" />
                    طلبات الصيانة
                  </CardTitle>
                  <Dialog open={maintenanceOpen} onOpenChange={setMaintenanceOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                        + طلب صيانة جديد
                      </Button>
                    </DialogTrigger>
                    <DialogContent dir="rtl">
                      <DialogHeader>
                        <DialogTitle>طلب صيانة جديد</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>عنوان المشكلة *</Label>
                          <Input
                            value={maintenanceForm.title}
                            onChange={e => setMaintenanceForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="مثال: تسرب مياه في الحمام"
                          />
                        </div>
                        <div>
                          <Label>الوصف التفصيلي</Label>
                          <Textarea
                            value={maintenanceForm.description}
                            onChange={e => setMaintenanceForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="اشرح المشكلة بالتفصيل..."
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label>الأولوية</Label>
                          <Select value={maintenanceForm.priority} onValueChange={v => setMaintenanceForm(f => ({ ...f, priority: v as "low" | "medium" | "high" | "urgent" }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">منخفضة</SelectItem>
                              <SelectItem value="medium">متوسطة</SelectItem>
                              <SelectItem value="high">عالية</SelectItem>
                              <SelectItem value="urgent">عاجلة</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          className="w-full bg-amber-600 hover:bg-amber-700"
                          onClick={() => submitMaintenance.mutate({ contractCode: searchCode, ...maintenanceForm })}
                          disabled={!maintenanceForm.title || submitMaintenance.isPending}
                        >
                          {submitMaintenance.isPending ? "جاري الإرسال..." : "إرسال الطلب"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {data.maintenance.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">لا توجد طلبات صيانة</p>
                ) : (
                  <div className="space-y-2">
                    {data.maintenance.slice(0, 8).map(req => {
                      const statusInfo = getMaintenanceStatusBadge(req.status);
                      return (
                        <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium">{req.title}</p>
                            <p className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString("ar-SA")}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="shadow-md border-0 bg-amber-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 text-amber-800">
                  <Phone className="w-5 h-5" />
                  <div>
                    <p className="font-medium">للتواصل مع إدارة تكامل</p>
                    <p className="text-sm text-amber-600">يمكنك التواصل معنا عبر تيليغرام أو الاتصال المباشر</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
