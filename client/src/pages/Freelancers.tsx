import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Search, UserCheck, Mail, Phone, Star, Globe, Edit, Trash2 } from 'lucide-react';

export default function Freelancers() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editFreelancer, setEditFreelancer] = useState<any>(null);
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', specialty: '',
    hourlyRate: '', portfolio: '', notes: '', skills: '',
  });

  const { data: freelancers, isLoading, refetch } = trpc.freelancers.list.useQuery({ search: search || undefined, isActive: true });

  const createMutation = trpc.freelancers.create.useMutation({
    onSuccess: () => { toast.success('تم إضافة الفريلانسر'); setShowCreate(false); resetForm(); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.freelancers.update.useMutation({
    onSuccess: () => { toast.success('تم تحديث البيانات'); setEditFreelancer(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => setForm({ fullName: '', email: '', phone: '', specialty: '', hourlyRate: '', portfolio: '', notes: '', skills: '' });

  const handleCreate = () => {
    if (!form.fullName || !form.email) { toast.error('يرجى إدخال الاسم والبريد الإلكتروني'); return; }
    createMutation.mutate({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone || undefined,
      specialty: form.specialty || undefined,
      hourlyRate: form.hourlyRate || undefined,
      portfolio: form.portfolio || undefined,
      notes: form.notes || undefined,
      skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : undefined,
    });
  };

  const handleUpdate = () => {
    if (!editFreelancer) return;
    updateMutation.mutate({
      id: editFreelancer.id,
      fullName: form.fullName || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      specialty: form.specialty || undefined,
      hourlyRate: form.hourlyRate || undefined,
      portfolio: form.portfolio || undefined,
      notes: form.notes || undefined,
      skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : undefined,
    });
  };

  const openEdit = (fl: any) => {
    setEditFreelancer(fl);
    setForm({
      fullName: fl.fullName ?? '',
      email: fl.email ?? '',
      phone: fl.phone ?? '',
      specialty: fl.specialty ?? '',
      hourlyRate: fl.hourlyRate ?? '',
      portfolio: fl.portfolio ?? '',
      notes: fl.notes ?? '',
      skills: Array.isArray(fl.skills) ? fl.skills.join(', ') : '',
    });
  };

  const FreelancerForm = ({ onSubmit, loading }: { onSubmit: () => void; loading: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label className="text-foreground">الاسم الكامل *</Label>
          <Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
            placeholder="الاسم الكامل" className="bg-input border-border text-foreground" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground">البريد الإلكتروني *</Label>
          <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="example@email.com" className="bg-input border-border text-foreground" dir="ltr" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground">رقم الجوال</Label>
          <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="05XXXXXXXX" className="bg-input border-border text-foreground" dir="ltr" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground">التخصص</Label>
          <Input value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
            placeholder="مثال: مصمم جرافيك" className="bg-input border-border text-foreground" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground">سعر الساعة (ريال)</Label>
          <Input type="number" value={form.hourlyRate} onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))}
            placeholder="0.00" className="bg-input border-border text-foreground" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label className="text-foreground">رابط الأعمال (Portfolio)</Label>
          <Input value={form.portfolio} onChange={e => setForm(f => ({ ...f, portfolio: e.target.value }))}
            placeholder="https://..." className="bg-input border-border text-foreground" dir="ltr" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label className="text-foreground">المهارات (مفصولة بفاصلة)</Label>
          <Input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
            placeholder="Photoshop, Video Editing, Motion Graphics" className="bg-input border-border text-foreground" />
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
        <Button variant="outline" onClick={() => { setShowCreate(false); setEditFreelancer(null); resetForm(); }}
          className="border-border text-foreground">إلغاء</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الفريلانسرز</h1>
          <p className="text-muted-foreground text-sm mt-1">{freelancers?.length ?? 0} فريلانسر نشط</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />إضافة فريلانسر</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-card border-border" dir="rtl">
            <DialogHeader><DialogTitle className="text-foreground">إضافة فريلانسر جديد</DialogTitle></DialogHeader>
            <FreelancerForm onSubmit={handleCreate} loading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="البحث في الفريلانسرز..." className="pr-9 bg-card border-border text-foreground" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-card animate-pulse border border-border" />
          ))}
        </div>
      ) : (freelancers ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <UserCheck className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">لا يوجد فريلانسرز</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(freelancers ?? []).map((fl) => (
            <div key={fl.id} className="rounded-xl p-5 border border-border bg-card card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: 'oklch(0.70 0.18 300 / 0.2)', color: 'oklch(0.70 0.18 300)' }}>
                    {fl.fullName?.charAt(0) ?? 'ف'}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{fl.fullName}</p>
                    <p className="text-xs text-muted-foreground">{fl.specialty ?? 'غير محدد'}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(fl)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {fl.email && <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{fl.email}</p>}
                {fl.phone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{fl.phone}</p>}
                {fl.hourlyRate && (
                  <p className="flex items-center gap-1.5 text-foreground font-medium">
                    <Star className="w-3 h-3 text-yellow-400" />
                    {fl.hourlyRate} ر.س/ساعة
                  </p>
                )}
                {fl.portfolio && (
                  <a href={fl.portfolio} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-primary hover:underline">
                    <Globe className="w-3 h-3" />Portfolio
                  </a>
                )}
              </div>
              {Array.isArray(fl.skills) && fl.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {(fl.skills as string[]).slice(0, 3).map((skill: string, i: number) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400">{skill}</span>
                  ))}
                  {(fl.skills as string[]).length > 3 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">+{(fl.skills as string[]).length - 3}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editFreelancer} onOpenChange={(open) => { if (!open) { setEditFreelancer(null); resetForm(); } }}>
        <DialogContent className="max-w-lg bg-card border-border" dir="rtl">
          <DialogHeader><DialogTitle className="text-foreground">تعديل بيانات الفريلانسر</DialogTitle></DialogHeader>
          <FreelancerForm onSubmit={handleUpdate} loading={updateMutation.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
