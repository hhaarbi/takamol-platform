import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Upload, Home, CreditCard, Wrench, Search, CheckCircle, Clock, AlertCircle, Download, Eye } from "lucide-react";

type PortalData = {
  contract: {
    id: number;
    contractNumber: string | null;
    startDate: string | Date | null;
    endDate: string | Date | null;
    rentAmount: string | null;
    status: string | null;
    propertyId: number | null;
    unitId: number | null;
  };
  tenant: { name: string; phone: string; email?: string | null } | null;
  payments: Array<{
    id: number;
    amount: string | null;
    dueDate: string | Date | null;
    paidDate: string | Date | null;
    status: string | null;
    type: string | null;
  }>;
  maintenance: Array<{
    id: number;
    title: string;
    status: string | null;
    priority: string | null;
    createdAt: Date | null;
  }>;
};

export default function TenantPortalFull() {
  const [contractCode, setContractCode] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({ title: "", description: "", priority: "medium" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("other");

  const getByContract = trpc.tenantPortal.getByContract.useQuery(
    { contractCode: searchCode },
    { enabled: !!searchCode, retry: false }
  );

  const submitMaintenance = trpc.tenantPortal.submitMaintenance.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال طلب الصيانة بنجاح");
      setMaintenanceOpen(false);
      setMaintenanceForm({ title: "", description: "", priority: "medium" });
    },
    onError: (err) => toast.error(err.message),
  });

  const uploadDocument = trpc.tenantPortal.uploadDocument.useMutation({
    onSuccess: () => {
      toast.success("تم رفع الوثيقة بنجاح");
      setUploadOpen(false);
      setSelectedFile(null);
      getDocuments.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const getDocuments = trpc.tenantPortal.getDocuments.useQuery(
    { contractCode: searchCode },
    { enabled: !!searchCode && !!portalData }
  );

  const handleSearch = () => {
    if (!contractCode.trim()) return;
    setSearchCode(contractCode.trim());
  };

  // Update portal data when query succeeds
  if (getByContract.data && !portalData && !getByContract.isLoading) {
    setPortalData(getByContract.data as PortalData);
  }
  if (getByContract.error && portalData) {
    setPortalData(null);
  }

  const handleFileUpload = async () => {
    if (!selectedFile || !searchCode) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      uploadDocument.mutate({
        contractCode: searchCode,
        base64,
        filename: selectedFile.name,
        mimeType: selectedFile.type,
        docType,
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const getStatusBadge = (status: string | null) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      paid: { label: "مدفوع", variant: "default" },
      pending: { label: "معلق", variant: "secondary" },
      overdue: { label: "متأخر", variant: "destructive" },
      open: { label: "مفتوح", variant: "secondary" },
      "in-progress": { label: "قيد التنفيذ", variant: "default" },
      completed: { label: "مكتمل", variant: "outline" },
      active: { label: "نشط", variant: "default" },
      expired: { label: "منتهي", variant: "destructive" },
    };
    const info = map[status ?? ""] ?? { label: status ?? "-", variant: "outline" as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const getPriorityBadge = (priority: string | null) => {
    const map: Record<string, string> = { low: "منخفض", medium: "متوسط", high: "عالي", urgent: "عاجل" };
    const colors: Record<string, string> = { low: "bg-blue-100 text-blue-800", medium: "bg-yellow-100 text-yellow-800", high: "bg-orange-100 text-orange-800", urgent: "bg-red-100 text-red-800" };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[priority ?? "medium"] ?? "bg-gray-100 text-gray-800"}`}>
        {map[priority ?? "medium"] ?? priority}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white" dir="rtl">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">بوابة المستأجر — تكامل</h1>
            <p className="text-xs text-white/60">إدارة عقدك، مدفوعاتك، وطلبات الصيانة</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Search Section */}
        {!portalData && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">أدخل رقم عقدك</h2>
              <p className="text-white/60">يمكنك الاطلاع على تفاصيل عقدك، مدفوعاتك، وتقديم طلبات الصيانة</p>
            </div>
            <div className="w-full max-w-md flex gap-2">
              <Input
                placeholder="رقم العقد (مثال: CNT-001)"
                value={contractCode}
                onChange={(e) => setContractCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-right"
              />
              <Button onClick={handleSearch} disabled={getByContract.isLoading} className="bg-blue-600 hover:bg-blue-700">
                {getByContract.isLoading ? "جاري البحث..." : "بحث"}
              </Button>
            </div>
            {getByContract.error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>{getByContract.error.message}</span>
              </div>
            )}
          </div>
        )}

        {/* Portal Data */}
        {portalData && (
          <div className="space-y-6">
            {/* Tenant Info Card */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">مرحباً، {portalData.tenant?.name ?? "المستأجر"}</h2>
                <p className="text-white/60 text-sm">رقم العقد: {portalData.contract.contractNumber}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setPortalData(null); setSearchCode(""); setContractCode(""); }}
                className="border-white/20 text-white hover:bg-white/10"
              >
                تغيير العقد
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-white/10 border-white/10 text-white">
                <CardContent className="p-4">
                  <div className="text-xs text-white/60 mb-1">حالة العقد</div>
                  {getStatusBadge(portalData.contract.status)}
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/10 text-white">
                <CardContent className="p-4">
                  <div className="text-xs text-white/60 mb-1">الإيجار الشهري</div>
                  <div className="font-bold text-blue-300">{Number(portalData.contract.rentAmount ?? 0).toLocaleString("ar-SA")} ر.س</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/10 text-white">
                <CardContent className="p-4">
                  <div className="text-xs text-white/60 mb-1">تاريخ الانتهاء</div>
                  <div className="font-bold text-sm">{portalData.contract.endDate ? new Date(portalData.contract.endDate).toLocaleDateString("ar-SA") : "-"}</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/10 text-white">
                <CardContent className="p-4">
                  <div className="text-xs text-white/60 mb-1">المدفوعات</div>
                  <div className="font-bold">{portalData.payments.filter(p => p.status === "paid").length} / {portalData.payments.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="payments" className="w-full">
              <TabsList className="bg-white/10 border-white/10 w-full grid grid-cols-4">
                <TabsTrigger value="payments" className="data-[state=active]:bg-blue-600 text-white">
                  <CreditCard className="w-4 h-4 ml-1" /> المدفوعات
                </TabsTrigger>
                <TabsTrigger value="maintenance" className="data-[state=active]:bg-blue-600 text-white">
                  <Wrench className="w-4 h-4 ml-1" /> الصيانة
                </TabsTrigger>
                <TabsTrigger value="documents" className="data-[state=active]:bg-blue-600 text-white">
                  <FileText className="w-4 h-4 ml-1" /> الوثائق
                </TabsTrigger>
                <TabsTrigger value="contract" className="data-[state=active]:bg-blue-600 text-white">
                  <Home className="w-4 h-4 ml-1" /> العقد
                </TabsTrigger>
              </TabsList>

              {/* Payments Tab */}
              <TabsContent value="payments">
                <Card className="bg-white/5 border-white/10 text-white">
                  <CardHeader>
                    <CardTitle className="text-base">سجل المدفوعات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {portalData.payments.length === 0 ? (
                      <div className="text-center py-8 text-white/40">لا توجد مدفوعات مسجلة</div>
                    ) : (
                      <div className="space-y-2">
                        {portalData.payments.map(p => (
                          <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center gap-3">
                              {p.status === "paid" ? (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              ) : p.status === "overdue" ? (
                                <AlertCircle className="w-5 h-5 text-red-400" />
                              ) : (
                                <Clock className="w-5 h-5 text-yellow-400" />
                              )}
                              <div>
                                <div className="text-sm font-medium">{Number(p.amount ?? 0).toLocaleString("ar-SA")} ر.س</div>
                                <div className="text-xs text-white/50">
                                  استحقاق: {p.dueDate ? new Date(p.dueDate).toLocaleDateString("ar-SA") : "-"}
                                  {p.paidDate && ` | دفع: ${new Date(p.paidDate).toLocaleDateString("ar-SA")}`}
                                </div>
                              </div>
                            </div>
                            {getStatusBadge(p.status)}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Maintenance Tab */}
              <TabsContent value="maintenance">
                <Card className="bg-white/5 border-white/10 text-white">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">طلبات الصيانة</CardTitle>
                    <Dialog open={maintenanceOpen} onOpenChange={setMaintenanceOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          + طلب جديد
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-white/20 text-white" dir="rtl">
                        <DialogHeader>
                          <DialogTitle>طلب صيانة جديد</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>عنوان الطلب *</Label>
                            <Input
                              value={maintenanceForm.title}
                              onChange={e => setMaintenanceForm(f => ({ ...f, title: e.target.value }))}
                              placeholder="مثال: تسريب في الحمام"
                              className="bg-white/10 border-white/20 text-white mt-1"
                            />
                          </div>
                          <div>
                            <Label>الوصف</Label>
                            <Textarea
                              value={maintenanceForm.description}
                              onChange={e => setMaintenanceForm(f => ({ ...f, description: e.target.value }))}
                              placeholder="وصف تفصيلي للمشكلة..."
                              className="bg-white/10 border-white/20 text-white mt-1"
                            />
                          </div>
                          <div>
                            <Label>الأولوية</Label>
                            <Select value={maintenanceForm.priority} onValueChange={v => setMaintenanceForm(f => ({ ...f, priority: v }))}>
                              <SelectTrigger className="bg-white/10 border-white/20 text-white mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">منخفض</SelectItem>
                                <SelectItem value="medium">متوسط</SelectItem>
                                <SelectItem value="high">عالي</SelectItem>
                                <SelectItem value="urgent">عاجل</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            onClick={() => submitMaintenance.mutate({ contractCode: searchCode, ...maintenanceForm, priority: maintenanceForm.priority as "low" | "medium" | "high" | "urgent" })}
                            disabled={submitMaintenance.isPending || !maintenanceForm.title}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            {submitMaintenance.isPending ? "جاري الإرسال..." : "إرسال الطلب"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    {portalData.maintenance.length === 0 ? (
                      <div className="text-center py-8 text-white/40">لا توجد طلبات صيانة</div>
                    ) : (
                      <div className="space-y-2">
                        {portalData.maintenance.map(m => (
                          <div key={m.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div>
                              <div className="text-sm font-medium">{m.title}</div>
                              <div className="text-xs text-white/50 mt-1">
                                {m.createdAt ? new Date(m.createdAt).toLocaleDateString("ar-SA") : "-"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getPriorityBadge(m.priority)}
                              {getStatusBadge(m.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents">
                <Card className="bg-white/5 border-white/10 text-white">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">وثائقي</CardTitle>
                    <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Upload className="w-4 h-4 ml-1" /> رفع وثيقة
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-white/20 text-white" dir="rtl">
                        <DialogHeader>
                          <DialogTitle>رفع وثيقة جديدة</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>نوع الوثيقة</Label>
                            <Select value={docType} onValueChange={setDocType}>
                              <SelectTrigger className="bg-white/10 border-white/20 text-white mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="id">هوية وطنية / إقامة</SelectItem>
                                <SelectItem value="contract">عقد إيجار</SelectItem>
                                <SelectItem value="payment_proof">إثبات دفع</SelectItem>
                                <SelectItem value="maintenance_photo">صورة صيانة</SelectItem>
                                <SelectItem value="other">أخرى</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>اختر الملف</Label>
                            <div
                              className="mt-1 border-2 border-dashed border-white/20 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              {selectedFile ? (
                                <div className="text-green-400">
                                  <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                                  <p className="text-sm">{selectedFile.name}</p>
                                  <p className="text-xs text-white/50">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                              ) : (
                                <div className="text-white/40">
                                  <Upload className="w-8 h-8 mx-auto mb-2" />
                                  <p className="text-sm">اضغط لاختيار ملف</p>
                                  <p className="text-xs">PDF, JPG, PNG (حد أقصى 5MB)</p>
                                </div>
                              )}
                            </div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file && file.size > 5 * 1024 * 1024) {
                                  toast.error("حجم الملف يتجاوز 5MB");
                                  return;
                                }
                                setSelectedFile(file ?? null);
                              }}
                            />
                          </div>
                          <Button
                            onClick={handleFileUpload}
                            disabled={!selectedFile || uploadDocument.isPending}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            {uploadDocument.isPending ? "جاري الرفع..." : "رفع الوثيقة"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    {!getDocuments.data || getDocuments.data.length === 0 ? (
                      <div className="text-center py-8 text-white/40">لا توجد وثائق مرفوعة</div>
                    ) : (
                      <div className="space-y-2">
                        {getDocuments.data.map((doc: any) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-blue-400" />
                              <div>
                                <div className="text-sm font-medium">{doc.fileName}</div>
                                <div className="text-xs text-white/50">
                                  {doc.docType} | {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("ar-SA") : "-"}
                                </div>
                              </div>
                            </div>
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Contract Tab */}
              <TabsContent value="contract">
                <Card className="bg-white/5 border-white/10 text-white">
                  <CardHeader>
                    <CardTitle className="text-base">تفاصيل العقد</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: "رقم العقد", value: portalData.contract.contractNumber },
                        { label: "حالة العقد", value: getStatusBadge(portalData.contract.status) },
                        { label: "تاريخ البداية", value: portalData.contract.startDate ? new Date(portalData.contract.startDate).toLocaleDateString("ar-SA") : "-" },
                        { label: "تاريخ الانتهاء", value: portalData.contract.endDate ? new Date(portalData.contract.endDate).toLocaleDateString("ar-SA") : "-" },
                        { label: "قيمة الإيجار", value: `${Number(portalData.contract.rentAmount ?? 0).toLocaleString("ar-SA")} ر.س` },
                        { label: "الاسم", value: portalData.tenant?.name },
                        { label: "الجوال", value: portalData.tenant?.phone },
                        { label: "البريد الإلكتروني", value: portalData.tenant?.email ?? "-" },
                      ].map((item, i) => (
                        <div key={i} className="p-3 bg-white/5 rounded-lg">
                          <div className="text-xs text-white/50 mb-1">{item.label}</div>
                          <div className="font-medium">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
