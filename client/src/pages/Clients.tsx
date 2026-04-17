import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Search, Briefcase, Mail, Phone, MapPin, Edit, Trash2, Building2 } from 'lucide-react';

export default function Clients() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editClient, setEditClient] = useState<any>(null);
  const [form, setForm] = useState({
    companyName: '', contactName: '', email: '', phone: '',
    address: '', industry: '', notes: '',
  });

  const { data: clients, isLoading, refetch } = trpc.clients.list.useQuery({ search: search || undefined, isActive: true });

  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => { toast.success('تم إضافة العميل'); setShowCreate(false); resetForm(); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => { toast.success('تم تحديث بيانات العميل'); setEditClient(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => { toast.success('تم حذف العميل'); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => setForm({ companyName: '', contactName: '', email: '', phone: '', address: '', industry: '', notes: '' });

  const handleCreate = () => {
    if (!form.companyName) { toast.error('يرجى إدخال اسم الشركة'); return; }
    createMutation.mutate(form);
  };

  const handleUpdate = () => {
    if (!editClient) return;
    updateMutation.mutate({ id: editClient.id, ...form });
  };

  const openEdit = (client: any) => {
    setEditClient(client);
    setForm({
      companyName: client.companyName ?? '',
      contactName: client.contactName ?? '',
      email: client.email ?? '',
      phone: client.phone ?? '',
      address: client.address ?? '',
      industry: client.industry ?? '',
      notes: client.notes ?? '',
    });
  };

  const ClientForm = ({ onSubmit, loading }: { onSubmit: () => void; loading: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label className="text-foreground">اسم الشركة *</Label>
          <Input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
            placeholder="اسم الشركة أو المؤسسة" className="bg-input border-border text-foreground" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground">اسم جهة الاتصال</Label>
          <Input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
            placeholder="اسم المسؤول" className="bg-input border-border text-foreground" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground">القطاع</Label>
          <Input value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
            placeholder="مثال: تجزئة، عقارات" className="bg-input border-border text-foreground" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground">البريد الإلكتروني</Label>
          <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="example@company.com" className="bg-input border-border text-foreground" dir="ltr" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground">رقم الجوال</Label>
          <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="05XXXXXXXX" className="bg-input border-border text-foreground" dir="ltr" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label className="text-foreground">العنوان</Label>
          <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            placeholder="المدينة، الحي" className="bg-input border-border text-foreground" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label className="text-foreground">ملاحظات</Label>
          <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="ملاحظات إضافية عن العميل" className="bg-input border-border text-foreground" rows={2} />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={onSubmit} disabled={loading} className="flex-1">
          {loading ? 'جاري الحفظ...' : 'حفظ'}
        </Button>
        <Button variant="outline" onClick={() => { setShowCreate(false); setEditClient(null); resetForm(); }}
          className="border-border text-foreground">إلغاء</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">العملاء</h1>
          <p className="text-muted-foreground text-sm mt-1">{clients?.length ?? 0} عميل</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />إضافة عميل</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-card border-border" dir="rtl">
            <DialogHeader><DialogTitle className="text-foreground">إضافة عميل جديد</DialogTitle></DialogHeader>
            <ClientForm onSubmit={handleCreate} loading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="البحث في العملاء..." className="pr-9 bg-card border-border text-foreground" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-card animate-pulse border border-border" />
          ))}
        </div>
      ) : (clients ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Briefcase className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">لا يوجد عملاء</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(clients ?? []).map((client) => (
            <div key={client.id} className="rounded-xl p-5 border border-border bg-card card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: 'oklch(0.65 0.20 30 / 0.2)', color: 'oklch(0.65 0.20 30)' }}>
                    {client.companyName?.charAt(0) ?? 'ع'}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{client.companyName}</p>
                    {client.contactName && <p className="text-xs text-muted-foreground">{client.contactName}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(client)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { if (confirm('هل أنت متأكد من حذف هذا العميل؟')) deleteMutation.mutate({ id: client.id }); }}
                    className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {client.industry && (
                  <p className="flex items-center gap-1.5"><Building2 className="w-3 h-3" />{client.industry}</p>
                )}
                {client.email && <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{client.email}</p>}
                {client.phone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{client.phone}</p>}
                {client.address && <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{client.address}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editClient} onOpenChange={(open) => { if (!open) { setEditClient(null); resetForm(); } }}>
        <DialogContent className="max-w-lg bg-card border-border" dir="rtl">
          <DialogHeader><DialogTitle className="text-foreground">تعديل بيانات العميل</DialogTitle></DialogHeader>
          <ClientForm onSubmit={handleUpdate} loading={updateMutation.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
