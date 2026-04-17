import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/StatusBadge';
import { toast } from 'sonner';
import { Plus, FileText, Calendar, DollarSign, Building2, Edit } from 'lucide-react';

export default function Contracts() {
  const [showCreate, setShowCreate] = useState(false);
  const [editContract, setEditContract] = useState<any>(null);
  const [form, setForm] = useState({
    clientId: '', title: '', value: '', startDate: '', endDate: '', status: 'draft', notes: '',
  });

  const { data: contracts, isLoading, refetch } = trpc.contracts.list.useQuery({});
  const { data: clients } = trpc.clients.list.useQuery({});

  const createMutation = trpc.contracts.create.useMutation({
    onSuccess: () => { toast.success('تم إنشاء العقد'); setShowCreate(false); resetForm(); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.contracts.update.useMutation({
    onSuccess: () => { toast.success('تم تحديث العقد'); setEditContract(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => setForm({ clientId: '', title: '', value: '', startDate: '', endDate: '', status: 'draft', notes: '' });

  const handleCreate = () => {
    if (!form.clientId || !form.title) { toast.error('يرجى اختيار العميل وإدخال عنوان العقد'); return; }
    createMutation.mutate({
      clientId: parseInt(form.clientId),
      title: form.title,
      value: form.value || undefined,
      startDate: form.startDate ? new Date(form.startDate) : undefined,
      endDate: form.endDate ? new Date(form.endDate) : undefined,
      status: form.status as any,
      notes: form.notes || undefined,
    });
  };

  const handleUpdate = () => {
    if (!editContract) return;
    updateMutation.mutate({
      id: editContract.id,
      title: form.title || undefined,
      value: form.value || undefined,
      status: form.status as any,
      notes: form.notes || undefined,
    });
  };

  const openEdit = (contract: any) => {
    setEditContract(contract);
    setForm({
      clientId: String(contract.clientId),
      title: contract.title ?? '',
      value: contract.value ?? '',
      startDate: contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : '',
      endDate: contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : '',
      status: contract.status ?? 'draft',
      notes: contract.notes ?? '',
    });
  };

  const ContractForm = ({ onSubmit, loading, isEdit = false }: { onSubmit: () => void; loading: boolean; isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {!isEdit && (
          <div className="space-y-1.5 col-span-2">
            <Label className="text-foreground">العميل *</Label>
            <Select value={form.clientId} onValueChange={v => setForm(f => ({ ...f, clientId: v }))}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue placeholder="اختر العميل" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {(clients ?? []).map(c => (
                  <SelectItem key={c.id} value={String(c.id)} className="text-foreground">{c.companyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1.5 col-span-2">
          <Label className="text-foreground">عنوان العقد *</Label>
          <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="عنوان العقد أو الاتفاقية" className="bg-input border-border text-foreground" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground">قيمة العقد (ريال)</Label>
          <Input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
            placeholder="0.00" className="bg-input border-border text-foreground" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground">الحالة</Label>
          <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
            <SelectTrigger className="bg-input border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="draft" className="text-foreground">مسودة</SelectItem>
              <SelectItem value="active" className="text-foreground">نشط</SelectItem>
              <SelectItem value="completed" className="text-foreground">مكتمل</SelectItem>
              <SelectItem value="cancelled" className="text-foreground">ملغي</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground">تاريخ البداية</Label>
          <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
            className="bg-input border-border text-foreground" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground">تاريخ الانتهاء</Label>
          <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
            className="bg-input border-border text-foreground" />
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
        <Button variant="outline" onClick={() => { setShowCreate(false); setEditContract(null); resetForm(); }}
          className="border-border text-foreground">إلغاء</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">العقود</h1>
          <p className="text-muted-foreground text-sm mt-1">{contracts?.length ?? 0} عقد</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />إضافة عقد</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-card border-border" dir="rtl">
            <DialogHeader><DialogTitle className="text-foreground">إنشاء عقد جديد</DialogTitle></DialogHeader>
            <ContractForm onSubmit={handleCreate} loading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-card animate-pulse border border-border" />
          ))}
        </div>
      ) : (contracts ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">لا توجد عقود</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(contracts ?? []).map((contract) => (
            <div key={contract.id} className="rounded-xl p-5 border border-border bg-card card-hover">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground">{contract.title}</h3>
                    <StatusBadge status={contract.status} />
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3 h-3" />
                      {clients?.find(c => c.id === contract.clientId)?.companyName ?? `عميل #${contract.clientId}`}
                    </span>
                    {contract.value && (
                      <span className="flex items-center gap-1.5 text-green-400 font-medium">
                        <DollarSign className="w-3 h-3" />
                        {Number(contract.value).toLocaleString('ar-SA')} ر.س
                      </span>
                    )}
                    {contract.startDate && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(contract.startDate).toLocaleDateString('ar-SA')}
                        {contract.endDate && ` - ${new Date(contract.endDate).toLocaleDateString('ar-SA')}`}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => openEdit(contract)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editContract} onOpenChange={(open) => { if (!open) { setEditContract(null); resetForm(); } }}>
        <DialogContent className="max-w-lg bg-card border-border" dir="rtl">
          <DialogHeader><DialogTitle className="text-foreground">تعديل العقد</DialogTitle></DialogHeader>
          <ContractForm onSubmit={handleUpdate} loading={updateMutation.isPending} isEdit />
        </DialogContent>
      </Dialog>
    </div>
  );
}
