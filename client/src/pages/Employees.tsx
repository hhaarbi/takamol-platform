import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Search, Users, Mail, Phone, Briefcase, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Employees() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editEmployee, setEditEmployee] = useState<any>(null);
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', departmentId: '',
    jobTitle: '', salary: '', hireDate: '', notes: '', skills: '',
  });

  const { data: employees, isLoading, refetch } = trpc.employees.list.useQuery({ search: search || undefined, isActive: true });
  const { data: departments } = trpc.departments.list.useQuery();

  const createMutation = trpc.employees.create.useMutation({
    onSuccess: () => { toast.success('تم إضافة الموظف'); setShowCreate(false); resetForm(); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.employees.update.useMutation({
    onSuccess: () => { toast.success('تم تحديث بيانات الموظف'); setEditEmployee(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.employees.delete.useMutation({
    onSuccess: () => { toast.success('تم حذف الموظف'); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => setForm({ fullName: '', email: '', phone: '', departmentId: '', jobTitle: '', salary: '', hireDate: '', notes: '', skills: '' });

  const handleCreate = () => {
    if (!form.fullName) { toast.error('يرجى إدخال الاسم'); return; }
    createMutation.mutate({
      fullName: form.fullName,
      email: form.email || undefined,
      phone: form.phone || undefined,
      departmentId: form.departmentId ? parseInt(form.departmentId) : undefined,
      jobTitle: form.jobTitle || undefined,
      salary: form.salary || undefined,
      hireDate: form.hireDate ? new Date(form.hireDate) : undefined,
      notes: form.notes || undefined,
      skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : undefined,
    });
  };

  const handleUpdate = () => {
    if (!editEmployee) return;
    updateMutation.mutate({
      id: editEmployee.id,
      fullName: form.fullName || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      departmentId: form.departmentId ? parseInt(form.departmentId) : undefined,
      jobTitle: form.jobTitle || undefined,
      salary: form.salary || undefined,
      notes: form.notes || undefined,
      skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : undefined,
    });
  };

  const openEdit = (emp: any) => {
    setEditEmployee(emp);
    setForm({
      fullName: emp.fullName ?? '',
      email: emp.email ?? '',
      phone: emp.phone ?? '',
      departmentId: emp.departmentId ? String(emp.departmentId) : '',
      jobTitle: emp.jobTitle ?? '',
      salary: emp.salary ?? '',
      hireDate: emp.hireDate ? new Date(emp.hireDate).toISOString().split('T')[0] : '',
      notes: emp.notes ?? '',
      skills: Array.isArray(emp.skills) ? emp.skills.join(', ') : '',
    });
  };

  const EmployeeForm = ({ onSubmit, loading }: { onSubmit: () => void; loading: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label className="text-foreground">الاسم الكامل *</Label>
          <Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
            placeholder="الاسم الكامل" className="bg-input border-border text-foreground" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground">البريد الإلكتروني</Label>
          <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="example@email.com" className="bg-input border-border text-foreground" dir="ltr" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground">رقم الجوال</Label>
          <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="05XXXXXXXX" className="bg-input border-border text-foreground" dir="ltr" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground">القسم</Label>
          <Select value={form.departmentId} onValueChange={v => setForm(f => ({ ...f, departmentId: v }))}>
            <SelectTrigger className="bg-input border-border text-foreground">
              <SelectValue placeholder="اختر القسم" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {(departments ?? []).map(d => (
                <SelectItem key={d.id} value={String(d.id)} className="text-foreground">{d.nameAr}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground">المسمى الوظيفي</Label>
          <Input value={form.jobTitle} onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))}
            placeholder="مثال: مصمم جرافيك" className="bg-input border-border text-foreground" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground">الراتب (ريال)</Label>
          <Input type="number" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))}
            placeholder="0.00" className="bg-input border-border text-foreground" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground">تاريخ التعيين</Label>
          <Input type="date" value={form.hireDate} onChange={e => setForm(f => ({ ...f, hireDate: e.target.value }))}
            className="bg-input border-border text-foreground" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label className="text-foreground">المهارات (مفصولة بفاصلة)</Label>
          <Input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
            placeholder="Photoshop, Illustrator, After Effects" className="bg-input border-border text-foreground" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label className="text-foreground">ملاحظات</Label>
          <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="ملاحظات إضافية" className="bg-input border-border text-foreground" rows={2} />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={onSubmit} disabled={loading} className="flex-1">
          {loading ? 'جاري الحفظ...' : 'حفظ'}
        </Button>
        <Button variant="outline" onClick={() => { setShowCreate(false); setEditEmployee(null); resetForm(); }}
          className="border-border text-foreground">إلغاء</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الموظفون</h1>
          <p className="text-muted-foreground text-sm mt-1">{employees?.length ?? 0} موظف نشط</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />إضافة موظف</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-card border-border" dir="rtl">
            <DialogHeader><DialogTitle className="text-foreground">إضافة موظف جديد</DialogTitle></DialogHeader>
            <EmployeeForm onSubmit={handleCreate} loading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="البحث في الموظفين..." className="pr-9 bg-card border-border text-foreground" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-card animate-pulse border border-border" />
          ))}
        </div>
      ) : (employees ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">لا يوجد موظفون</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(employees ?? []).map((emp) => (
            <div key={emp.id} className="rounded-xl p-5 border border-border bg-card card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: 'oklch(0.70 0.18 160 / 0.2)', color: 'oklch(0.70 0.18 160)' }}>
                    {emp.fullName?.charAt(0) ?? 'م'}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{emp.fullName}</p>
                    <p className="text-xs text-muted-foreground">{emp.jobTitle ?? 'غير محدد'}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(emp)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { if (confirm('هل أنت متأكد من حذف هذا الموظف؟')) deleteMutation.mutate({ id: emp.id }); }}
                    className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {emp.email && (
                  <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{emp.email}</p>
                )}
                {emp.phone && (
                  <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{emp.phone}</p>
                )}
                {emp.departmentId && (
                  <p className="flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3" />
                    {departments?.find(d => d.id === emp.departmentId)?.nameAr ?? `قسم #${emp.departmentId}`}
                  </p>
                )}
              </div>
              {Array.isArray(emp.skills) && emp.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {(emp.skills as string[]).slice(0, 3).map((skill: string, i: number) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary">{skill}</span>
                  ))}
                  {(emp.skills as string[]).length > 3 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">+{(emp.skills as string[]).length - 3}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editEmployee} onOpenChange={(open) => { if (!open) { setEditEmployee(null); resetForm(); } }}>
        <DialogContent className="max-w-lg bg-card border-border" dir="rtl">
          <DialogHeader><DialogTitle className="text-foreground">تعديل بيانات الموظف</DialogTitle></DialogHeader>
          <EmployeeForm onSubmit={handleUpdate} loading={updateMutation.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
