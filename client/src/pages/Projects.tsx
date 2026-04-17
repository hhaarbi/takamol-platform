import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge, PriorityBadge, ServiceTypeBadge, serviceTypeLabels } from '@/components/StatusBadge';
import { toast } from 'sonner';
import { Plus, Search, FolderKanban, Calendar, User, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusOptions = [
  { value: 'all', label: 'جميع الحالات' },
  { value: 'draft', label: 'مسودة' },
  { value: 'active', label: 'نشط' },
  { value: 'on_hold', label: 'متوقف' },
  { value: 'under_review', label: 'قيد المراجعة' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغي' },
];

const serviceTypeOptions = [
  { value: 'all', label: 'جميع الخدمات' },
  { value: 'brand_identity', label: 'الهوية البصرية' },
  { value: 'visual_production', label: 'الإنتاج المرئي' },
  { value: 'advertising_campaigns', label: 'الحملات الإعلانية' },
  { value: 'events', label: 'الفعاليات' },
  { value: 'influencer_marketing', label: 'المؤثرون' },
  { value: 'digital_presence', label: 'التواجد الرقمي' },
  { value: 'website_design', label: 'تصميم المواقع' },
];

export default function Projects() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', serviceType: 'brand_identity',
    status: 'active', priority: 'medium', budget: '',
    startDate: '', endDate: '',
  });

  const { data: projects, isLoading, refetch } = trpc.projects.list.useQuery({
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    serviceType: serviceFilter !== 'all' ? serviceFilter : undefined,
  });

  const { data: clients } = trpc.clients.list.useQuery({});
  const createMutation = trpc.projects.create.useMutation({
    onSuccess: () => {
      toast.success('تم إنشاء المشروع بنجاح');
      setShowCreate(false);
      setForm({ title: '', description: '', serviceType: 'brand_identity', status: 'active', priority: 'medium', budget: '', startDate: '', endDate: '' });
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!form.title) { toast.error('يرجى إدخال اسم المشروع'); return; }
    createMutation.mutate({
      title: form.title,
      description: form.description || undefined,
      serviceType: form.serviceType as any,
      status: form.status as any,
      priority: form.priority as any,
      budget: form.budget || undefined,
      startDate: form.startDate ? new Date(form.startDate) : undefined,
      endDate: form.endDate ? new Date(form.endDate) : undefined,
    });
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">المشاريع</h1>
          <p className="text-muted-foreground text-sm mt-1">{projects?.length ?? 0} مشروع</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              مشروع جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-card border-border" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-foreground">إنشاء مشروع جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label className="text-foreground">اسم المشروع *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="أدخل اسم المشروع" className="bg-input border-border text-foreground" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground">الوصف</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="وصف المشروع" className="bg-input border-border text-foreground" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-foreground">نوع الخدمة *</Label>
                  <Select value={form.serviceType} onValueChange={v => setForm(f => ({ ...f, serviceType: v }))}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {serviceTypeOptions.slice(1).map(o => (
                        <SelectItem key={o.value} value={o.value} className="text-foreground">{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground">الأولوية</Label>
                  <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="low" className="text-foreground">منخفضة</SelectItem>
                      <SelectItem value="medium" className="text-foreground">متوسطة</SelectItem>
                      <SelectItem value="high" className="text-foreground">عالية</SelectItem>
                      <SelectItem value="urgent" className="text-foreground">عاجلة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
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
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground">الميزانية (ريال)</Label>
                <Input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                  placeholder="0.00" className="bg-input border-border text-foreground" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={handleCreate} disabled={createMutation.isPending} className="flex-1">
                  {createMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء المشروع'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)} className="border-border text-foreground">
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="البحث في المشاريع..." className="pr-9 bg-card border-border text-foreground" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 bg-card border-border text-foreground">
            <Filter className="w-4 h-4 ml-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {statusOptions.map(o => (
              <SelectItem key={o.value} value={o.value} className="text-foreground">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={serviceFilter} onValueChange={setServiceFilter}>
          <SelectTrigger className="w-48 bg-card border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {serviceTypeOptions.map(o => (
              <SelectItem key={o.value} value={o.value} className="text-foreground">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-card animate-pulse border border-border" />
          ))}
        </div>
      ) : (projects ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderKanban className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">لا توجد مشاريع</p>
          <p className="text-muted-foreground/60 text-sm mt-1">ابدأ بإنشاء مشروعك الأول</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(projects ?? []).map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div className="rounded-xl p-5 border border-border bg-card card-hover cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{project.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{project.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <StatusBadge status={project.status} />
                  <PriorityBadge priority={project.priority} />
                  <ServiceTypeBadge serviceType={project.serviceType} />
                </div>
                {project.progress !== null && project.progress !== undefined && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>التقدم</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${project.progress}%`, background: 'oklch(0.65 0.22 265)' }} />
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {project.endDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(project.endDate).toLocaleDateString('ar-SA')}
                    </span>
                  )}
                  {project.budget && (
                    <span className="font-medium text-foreground">
                      {Number(project.budget).toLocaleString('ar-SA')} ر.س
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
