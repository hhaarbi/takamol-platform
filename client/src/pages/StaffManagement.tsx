import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Users, Plus, Edit2, Trash2, Shield, CheckCircle, XCircle, Settings } from "lucide-react";

const ROLES = [
  { value: "admin", label: "مدير عام", color: "bg-red-100 text-red-700", desc: "صلاحيات كاملة على جميع الأقسام" },
  { value: "accountant", label: "محاسب", color: "bg-blue-100 text-blue-700", desc: "المدفوعات والتقارير المالية والتصدير" },
  { value: "property_manager", label: "مدير عقارات", color: "bg-green-100 text-green-700", desc: "العقارات والمستأجرين والعقود والمدفوعات" },
  { value: "maintenance_supervisor", label: "مشرف صيانة", color: "bg-orange-100 text-orange-700", desc: "طلبات الصيانة والعقارات" },
  { value: "leasing_agent", label: "موظف تأجير", color: "bg-purple-100 text-purple-700", desc: "العقارات والمستأجرين والعقود" },
  { value: "receptionist", label: "موظف استقبال", color: "bg-gray-100 text-gray-700", desc: "عرض فقط: العقارات والمستأجرين والصيانة" },
];

const MODULES = [
  { key: "properties", label: "العقارات" },
  { key: "tenants", label: "المستأجرون" },
  { key: "contracts", label: "العقود" },
  { key: "payments", label: "المدفوعات" },
  { key: "maintenance", label: "الصيانة" },
  { key: "reports", label: "التقارير" },
  { key: "staff", label: "الموظفون" },
  { key: "owners", label: "الملاك" },
  { key: "brokers", label: "الوسطاء" },
  { key: "settings", label: "الإعدادات" },
  { key: "export", label: "التصدير" },
];

const PERM_LABELS = [
  { key: "canView", label: "عرض" },
  { key: "canCreate", label: "إضافة" },
  { key: "canEdit", label: "تعديل" },
  { key: "canDelete", label: "حذف" },
  { key: "canExport", label: "تصدير" },
];

export default function StaffManagement() {
  const [activeTab, setActiveTab] = useState("staff");
  const [selectedRole, setSelectedRole] = useState("admin");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "receptionist", department: "", notes: "" });

  const staffQuery = trpc.staff.list.useQuery();
  const permissionsQuery = trpc.permissions.getAll.useQuery();
  const utils = trpc.useUtils();

  const createStaff = trpc.staff.create.useMutation({
    onSuccess: () => { toast.success("تم إضافة الموظف بنجاح"); utils.staff.list.invalidate(); setShowAddDialog(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateStaff = trpc.staff.update.useMutation({
    onSuccess: () => { toast.success("تم تحديث بيانات الموظف"); utils.staff.list.invalidate(); setEditingStaff(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteStaff = trpc.staff.delete.useMutation({
    onSuccess: () => { toast.success("تم حذف الموظف"); utils.staff.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const upsertPerm = trpc.permissions.upsert.useMutation({
    onSuccess: () => { utils.permissions.getAll.invalidate(); },
  });
  const seedDefaults = trpc.permissions.seedDefaults.useMutation({
    onSuccess: (d) => { toast.success(`تم تطبيق الصلاحيات الافتراضية (${d.count} صلاحية)`); utils.permissions.getAll.invalidate(); },
  });

  const resetForm = () => setForm({ name: "", email: "", phone: "", role: "receptionist", department: "", notes: "" });

  const getPermForRole = (role: string, module: string) => {
    return permissionsQuery.data?.find(p => p.role === role && p.module === module);
  };

  const togglePerm = (role: string, module: string, permKey: string, current: boolean) => {
    const existing = getPermForRole(role, module);
    upsertPerm.mutate({
      role, module,
      canView: permKey === "canView" ? !current : (existing?.canView ?? false),
      canCreate: permKey === "canCreate" ? !current : (existing?.canCreate ?? false),
      canEdit: permKey === "canEdit" ? !current : (existing?.canEdit ?? false),
      canDelete: permKey === "canDelete" ? !current : (existing?.canDelete ?? false),
      canExport: permKey === "canExport" ? !current : (existing?.canExport ?? false),
    });
  };

  const staffList = staffQuery.data ?? [];
  const roleInfo = ROLES.find(r => r.value === selectedRole);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الموظفين والصلاحيات</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة حسابات الموظفين وتحديد صلاحيات كل دور</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة موظف
        </Button>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {ROLES.map(role => {
          const count = staffList.filter(s => s.role === role.value).length;
          return (
            <Card key={role.value} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${role.color}`}>
                  <Shield className="w-5 h-5" />
                </div>
                <div className="font-semibold text-sm">{role.label}</div>
                <div className="text-2xl font-bold text-primary mt-1">{count}</div>
                <div className="text-xs text-muted-foreground">موظف</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="staff" className="gap-2"><Users className="w-4 h-4" />قائمة الموظفين</TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2"><Settings className="w-4 h-4" />الصلاحيات التفصيلية</TabsTrigger>
        </TabsList>

        {/* Staff List Tab */}
        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">الموظفون ({staffList.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {staffList.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>لا يوجد موظفون مضافون بعد</p>
                  <Button variant="outline" className="mt-3" onClick={() => setShowAddDialog(true)}>إضافة أول موظف</Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-right py-3 px-2">الاسم</th>
                        <th className="text-right py-3 px-2">الدور</th>
                        <th className="text-right py-3 px-2">القسم</th>
                        <th className="text-right py-3 px-2">البريد</th>
                        <th className="text-right py-3 px-2">الهاتف</th>
                        <th className="text-right py-3 px-2">الحالة</th>
                        <th className="text-right py-3 px-2">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffList.map(s => {
                        const role = ROLES.find(r => r.value === s.role);
                        return (
                          <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-2 font-medium">{s.name}</td>
                            <td className="py-3 px-2">
                              <Badge className={`text-xs ${role?.color ?? ""}`}>{role?.label ?? s.role}</Badge>
                            </td>
                            <td className="py-3 px-2 text-muted-foreground">{s.department ?? "—"}</td>
                            <td className="py-3 px-2 text-muted-foreground">{s.email ?? "—"}</td>
                            <td className="py-3 px-2 text-muted-foreground">{s.phone ?? "—"}</td>
                            <td className="py-3 px-2">
                              {s.isActive
                                ? <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-3 h-3" />نشط</span>
                                : <span className="flex items-center gap-1 text-red-500"><XCircle className="w-3 h-3" />موقوف</span>}
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex gap-1">
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingStaff(s); setForm({ name: s.name, email: s.email ?? "", phone: s.phone ?? "", role: s.role, department: s.department ?? "", notes: s.notes ?? "" }); }}>
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => { if (confirm("حذف الموظف؟")) deleteStaff.mutate(s.id); }}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">الصلاحيات التفصيلية حسب الدور</CardTitle>
                <Button variant="outline" size="sm" onClick={() => seedDefaults.mutate()} disabled={seedDefaults.isPending}>
                  {seedDefaults.isPending ? "جاري التطبيق..." : "تطبيق الإعدادات الافتراضية"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Role selector */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {ROLES.map(role => (
                  <button
                    key={role.value}
                    onClick={() => setSelectedRole(role.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedRole === role.value ? "bg-primary text-primary-foreground shadow" : "bg-muted hover:bg-muted/80"}`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>

              {roleInfo && (
                <div className="mb-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  <strong>{roleInfo.label}:</strong> {roleInfo.desc}
                </div>
              )}

              {/* Permissions matrix */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-3 font-semibold">الوحدة</th>
                      {PERM_LABELS.map(p => (
                        <th key={p.key} className="text-center py-3 px-3 font-semibold">{p.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map(mod => {
                      const perm = getPermForRole(selectedRole, mod.key);
                      return (
                        <tr key={mod.key} className="border-b hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-3 font-medium">{mod.label}</td>
                          {PERM_LABELS.map(p => {
                            const val = perm ? (perm as any)[p.key] : false;
                            return (
                              <td key={p.key} className="py-3 px-3 text-center">
                                <Switch
                                  checked={val}
                                  onCheckedChange={() => togglePerm(selectedRole, mod.key, p.key, val)}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Staff Dialog */}
      <Dialog open={showAddDialog || !!editingStaff} onOpenChange={(o) => { if (!o) { setShowAddDialog(false); setEditingStaff(null); resetForm(); } }}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingStaff ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">الاسم الكامل *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="اسم الموظف" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الدور الوظيفي *</label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">{ROLES.find(r => r.value === form.role)?.desc}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">البريد الإلكتروني</label>
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" type="email" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">رقم الهاتف</label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="05xxxxxxxx" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">القسم</label>
              <Input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="مثال: قسم التأجير" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">ملاحظات</label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="ملاحظات اختيارية" />
            </div>
            {editingStaff && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingStaff.isActive}
                  onCheckedChange={(v) => setEditingStaff((s: any) => ({ ...s, isActive: v }))}
                />
                <label className="text-sm">الحساب نشط</label>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                disabled={createStaff.isPending || updateStaff.isPending || !form.name}
                onClick={() => {
                  if (editingStaff) {
                    updateStaff.mutate({ id: editingStaff.id, data: { ...form, isActive: editingStaff.isActive } as any });
                  } else {
                    createStaff.mutate(form as any);
                  }
                }}
              >
                {createStaff.isPending || updateStaff.isPending ? "جاري الحفظ..." : editingStaff ? "حفظ التعديلات" : "إضافة الموظف"}
              </Button>
              <Button variant="outline" onClick={() => { setShowAddDialog(false); setEditingStaff(null); resetForm(); }}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
