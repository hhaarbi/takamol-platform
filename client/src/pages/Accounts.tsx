import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Search, Shield, User, Mail, Lock, Edit, Trash2, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';

const roleLabels: Record<string, string> = {
  admin: 'مدير النظام',
  manager: 'مدير',
  employee: 'موظف',
  freelancer: 'فريلانسر',
};

const roleColors: Record<string, string> = {
  admin: 'bg-red-500/15 text-red-400',
  manager: 'bg-orange-500/15 text-orange-400',
  employee: 'bg-green-500/15 text-green-400',
  freelancer: 'bg-purple-500/15 text-purple-400',
};

export default function Accounts() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editAccount, setEditAccount] = useState<any>(null);
  const [showResetPwd, setShowResetPwd] = useState<any>(null);
  const [form, setForm] = useState({
    username: '', email: '', password: '', role: 'employee', displayName: '',
  });
  const [newPassword, setNewPassword] = useState('');

  const { data: allAccounts, isLoading, refetch } = trpc.internalAuth.listAccounts.useQuery();
  const accounts = allAccounts?.filter(a => !search || a.username?.toLowerCase().includes(search.toLowerCase()) || (a as any).displayName?.toLowerCase().includes(search.toLowerCase()));

  const createMutation = trpc.internalAuth.createAccount.useMutation({
    onSuccess: () => { toast.success('تم إنشاء الحساب'); setShowCreate(false); resetForm(); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.internalAuth.updateAccount.useMutation({
    onSuccess: () => { toast.success('تم تحديث الحساب'); setEditAccount(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.internalAuth.deleteAccount.useMutation({
    onSuccess: () => { toast.success('تم حذف الحساب'); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const resetPasswordMutation = trpc.internalAuth.updateAccount.useMutation({
    onSuccess: () => { toast.success('تم تغيير كلمة المرور'); setShowResetPwd(null); setNewPassword(''); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => setForm({ username: '', email: '', password: '', role: 'employee', displayName: '' });

  const handleCreate = () => {
    if (!form.username || !form.password) { toast.error('يرجى إدخال اسم المستخدم وكلمة المرور'); return; }
    createMutation.mutate({
      username: form.username,
      password: form.password,
      role: form.role as any,
    });
  };

  const handleUpdate = () => {
    if (!editAccount) return;
    updateMutation.mutate({
      id: editAccount.id,
      role: form.role as any,
    });
  };

  const openEdit = (acc: any) => {
    setEditAccount(acc);
    setForm({
      username: acc.username ?? '',
      email: acc.email ?? '',
      password: '',
      role: acc.role ?? 'employee',
      displayName: acc.displayName ?? '',
    });
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الحسابات</h1>
          <p className="text-muted-foreground text-sm mt-1">{accounts?.length ?? 0} حساب مسجل</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />إنشاء حساب</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-card border-border" dir="rtl">
            <DialogHeader><DialogTitle className="text-foreground">إنشاء حساب جديد</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label className="text-foreground">الاسم الظاهر</Label>
                <Input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                  placeholder="الاسم الكامل" className="bg-input border-border text-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-foreground">اسم المستخدم *</Label>
                  <Input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    placeholder="username" className="bg-input border-border text-foreground" dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground">الدور</Label>
                  <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="admin" className="text-foreground">مدير النظام</SelectItem>
                      <SelectItem value="manager" className="text-foreground">مدير</SelectItem>
                      <SelectItem value="employee" className="text-foreground">موظف</SelectItem>
                      <SelectItem value="freelancer" className="text-foreground">فريلانسر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground">البريد الإلكتروني</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="example@email.com" className="bg-input border-border text-foreground" dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground">كلمة المرور *</Label>
                <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="كلمة المرور" className="bg-input border-border text-foreground" dir="ltr" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={handleCreate} disabled={createMutation.isPending} className="flex-1">
                  {createMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
                </Button>
                <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}
                  className="border-border text-foreground">إلغاء</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="البحث في الحسابات..." className="pr-9 bg-card border-border text-foreground" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-card animate-pulse border border-border" />
          ))}
        </div>
      ) : (accounts ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Shield className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">لا توجد حسابات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(accounts ?? []).map((acc) => (
            <div key={acc.id} className="rounded-xl p-4 border border-border bg-card flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: 'oklch(0.65 0.22 265 / 0.2)', color: 'oklch(0.65 0.22 265)' }}>
                {acc.username?.charAt(0)?.toUpperCase() ?? 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{acc.username}</p>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', roleColors[acc.role] ?? '')}>
                    {roleLabels[acc.role] ?? acc.role}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{acc.username}</span>
                  {acc.employeeId && <span className="flex items-center gap-1">موظف #{acc.employeeId}</span>}
                  {acc.freelancerId && <span className="flex items-center gap-1">فريلانسر #{acc.freelancerId}</span>}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => setShowResetPwd(acc)}
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  title="إعادة تعيين كلمة المرور">
                  <KeyRound className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => openEdit(acc)}
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { if (confirm('هل أنت متأكد من حذف هذا الحساب؟')) deleteMutation.mutate({ id: acc.id }); }}
                  className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editAccount} onOpenChange={(open) => { if (!open) { setEditAccount(null); resetForm(); } }}>
        <DialogContent className="max-w-md bg-card border-border" dir="rtl">
          <DialogHeader><DialogTitle className="text-foreground">تعديل الحساب</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-foreground">الاسم الظاهر</Label>
              <Input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                className="bg-input border-border text-foreground" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">البريد الإلكتروني</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="bg-input border-border text-foreground" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">الدور</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="admin" className="text-foreground">مدير النظام</SelectItem>
                  <SelectItem value="manager" className="text-foreground">مدير</SelectItem>
                  <SelectItem value="employee" className="text-foreground">موظف</SelectItem>
                  <SelectItem value="freelancer" className="text-foreground">فريلانسر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="flex-1">
                {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
              <Button variant="outline" onClick={() => { setEditAccount(null); resetForm(); }}
                className="border-border text-foreground">إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!showResetPwd} onOpenChange={(open) => { if (!open) { setShowResetPwd(null); setNewPassword(''); } }}>
        <DialogContent className="max-w-sm bg-card border-border" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-foreground">إعادة تعيين كلمة المرور</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">تغيير كلمة مرور الحساب: <span className="text-foreground font-medium">{showResetPwd?.username}</span></p>
            <div className="space-y-1.5">
              <Label className="text-foreground">كلمة المرور الجديدة</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="كلمة المرور الجديدة" className="bg-input border-border text-foreground" dir="ltr" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={() => {
                if (!newPassword) { toast.error('يرجى إدخال كلمة المرور الجديدة'); return; }
                resetPasswordMutation.mutate({ id: showResetPwd.id, password: newPassword });
              }} disabled={resetPasswordMutation.isPending} className="flex-1">
                {resetPasswordMutation.isPending ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
              </Button>
              <Button variant="outline" onClick={() => { setShowResetPwd(null); setNewPassword(''); }}
                className="border-border text-foreground">إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
