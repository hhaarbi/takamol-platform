import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StatusBadge, PriorityBadge, ServiceTypeBadge } from '@/components/StatusBadge';
import { toast } from 'sonner';
import { ArrowRight, Plus, CheckSquare, Users, Edit, Trash2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusOptions = [
  { value: 'draft', label: 'مسودة' },
  { value: 'active', label: 'نشط' },
  { value: 'on_hold', label: 'متوقف' },
  { value: 'under_review', label: 'قيد المراجعة' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغي' },
];

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const id = parseInt(params.id ?? '0');

  const { data: project, isLoading, refetch } = trpc.projects.getById.useQuery({ id });
  const { data: tasks, refetch: refetchTasks } = trpc.tasks.list.useQuery({ projectId: id });
  const { data: members, refetch: refetchMembers } = trpc.projects.getMembers.useQuery({ projectId: id });
  const { data: employees } = trpc.employees.list.useQuery({});
  const { data: freelancers } = trpc.freelancers.list.useQuery({});

  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assigneeType: 'employee', assigneeId: '', dueDate: '' });
  const [memberForm, setMemberForm] = useState({ memberType: 'employee', memberId: '' });
  const [editStatus, setEditStatus] = useState('');

  const createTaskMutation = trpc.tasks.create.useMutation({
    onSuccess: () => { toast.success('تم إنشاء المهمة'); setShowAddTask(false); refetchTasks(); },
    onError: (e) => toast.error(e.message),
  });

  const addMemberMutation = trpc.projects.addMember.useMutation({
    onSuccess: () => { toast.success('تم إضافة العضو'); setShowAddMember(false); refetchMembers(); },
    onError: (e) => toast.error(e.message),
  });

  const updateProjectMutation = trpc.projects.update.useMutation({
    onSuccess: () => { toast.success('تم تحديث المشروع'); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleAddTask = () => {
    if (!taskForm.title) { toast.error('يرجى إدخال عنوان المهمة'); return; }
    createTaskMutation.mutate({
      projectId: id,
      title: taskForm.title,
      description: taskForm.description || undefined,
      priority: taskForm.priority as any,
      status: 'pending',
      assigneeType: taskForm.assigneeType as any,
      assigneeEmployeeId: taskForm.assigneeType === 'employee' && taskForm.assigneeId ? parseInt(taskForm.assigneeId) : undefined,
      assigneeFreelancerId: taskForm.assigneeType === 'freelancer' && taskForm.assigneeId ? parseInt(taskForm.assigneeId) : undefined,
      dueDate: taskForm.dueDate ? new Date(taskForm.dueDate) : undefined,
    });
  };

  const handleAddMember = () => {
    if (!memberForm.memberId) { toast.error('يرجى اختيار عضو'); return; }
    addMemberMutation.mutate({
      projectId: id,
      memberType: memberForm.memberType as any,
      employeeId: memberForm.memberType === 'employee' ? parseInt(memberForm.memberId) : undefined,
      freelancerId: memberForm.memberType === 'freelancer' ? parseInt(memberForm.memberId) : undefined,
    });
  };

  const handleStatusChange = (status: string) => {
    updateProjectMutation.mutate({ id, status: status as any });
  };

  if (isLoading) {
    return <div className="h-64 rounded-xl bg-card animate-pulse border border-border" />;
  }

  if (!project) {
    return <div className="text-center py-20 text-muted-foreground">المشروع غير موجود</div>;
  }

  const tasksByStatus = {
    pending: tasks?.filter(t => t.status === 'pending') ?? [],
    in_progress: tasks?.filter(t => t.status === 'in_progress') ?? [],
    under_review: tasks?.filter(t => t.status === 'under_review') ?? [],
    completed: tasks?.filter(t => t.status === 'completed') ?? [],
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/projects')} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{project.title}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{project.description}</p>
        </div>
      </div>

      {/* Project info cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 border border-border bg-card">
          <p className="text-xs text-muted-foreground mb-2">الحالة</p>
          <Select value={project.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-8 bg-transparent border-0 p-0 text-sm font-medium">
              <StatusBadge status={project.status} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {statusOptions.map(o => (
                <SelectItem key={o.value} value={o.value} className="text-foreground">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-xl p-4 border border-border bg-card">
          <p className="text-xs text-muted-foreground mb-2">الأولوية</p>
          <PriorityBadge priority={project.priority} />
        </div>
        <div className="rounded-xl p-4 border border-border bg-card">
          <p className="text-xs text-muted-foreground mb-2">نوع الخدمة</p>
          <ServiceTypeBadge serviceType={project.serviceType} />
        </div>
        <div className="rounded-xl p-4 border border-border bg-card">
          <p className="text-xs text-muted-foreground mb-2">الميزانية</p>
          <p className="font-semibold text-foreground">
            {project.budget ? `${Number(project.budget).toLocaleString('ar-SA')} ر.س` : 'غير محدد'}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-xl p-5 border border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">تقدم المشروع</h3>
          <span className="text-2xl font-bold gradient-text">{project.progress ?? 0}%</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${project.progress ?? 0}%`, background: 'linear-gradient(90deg, oklch(0.65 0.22 265), oklch(0.70 0.18 300))' }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          {project.startDate && <span>بداية: {new Date(project.startDate).toLocaleDateString('ar-SA')}</span>}
          {project.endDate && <span>نهاية: {new Date(project.endDate).toLocaleDateString('ar-SA')}</span>}
        </div>
      </div>

      {/* Tasks Kanban */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-primary" />
            المهام ({tasks?.length ?? 0})
          </h3>
          <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                إضافة مهمة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-card border-border" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-foreground">إضافة مهمة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-foreground">عنوان المهمة *</Label>
                  <Input value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="عنوان المهمة" className="bg-input border-border text-foreground" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground">الوصف</Label>
                  <Textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="وصف المهمة" className="bg-input border-border text-foreground" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-foreground">الأولوية</Label>
                    <Select value={taskForm.priority} onValueChange={v => setTaskForm(f => ({ ...f, priority: v }))}>
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
                  <div className="space-y-1.5">
                    <Label className="text-foreground">تاريخ التسليم</Label>
                    <Input type="date" value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))}
                      className="bg-input border-border text-foreground" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground">تعيين إلى</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={taskForm.assigneeType} onValueChange={v => setTaskForm(f => ({ ...f, assigneeType: v, assigneeId: '' }))}>
                      <SelectTrigger className="bg-input border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="employee" className="text-foreground">موظف</SelectItem>
                        <SelectItem value="freelancer" className="text-foreground">فريلانسر</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={taskForm.assigneeId} onValueChange={v => setTaskForm(f => ({ ...f, assigneeId: v }))}>
                      <SelectTrigger className="bg-input border-border text-foreground">
                        <SelectValue placeholder="اختر..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {taskForm.assigneeType === 'employee'
                          ? (employees ?? []).map(e => (
                            <SelectItem key={e.id} value={String(e.id)} className="text-foreground">{e.fullName}</SelectItem>
                          ))
                          : (freelancers ?? []).map(f => (
                            <SelectItem key={f.id} value={String(f.id)} className="text-foreground">{f.fullName}</SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button onClick={handleAddTask} disabled={createTaskMutation.isPending} className="flex-1">
                    {createTaskMutation.isPending ? 'جاري الإضافة...' : 'إضافة المهمة'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddTask(false)} className="border-border text-foreground">إلغاء</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Kanban columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => {
            const labels: Record<string, string> = {
              pending: 'معلق', in_progress: 'قيد التنفيذ',
              under_review: 'قيد المراجعة', completed: 'مكتمل',
            };
            return (
              <div key={status} className="rounded-xl border border-border bg-card/50 p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">{labels[status]}</span>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{statusTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {statusTasks.map(task => (
                    <div key={task.id} className="p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/tasks/${task.id}`)}>
                      <p className="text-sm font-medium text-foreground line-clamp-2">{task.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <PriorityBadge priority={task.priority} />
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString('ar-SA')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {statusTasks.length === 0 && (
                    <p className="text-xs text-muted-foreground/50 text-center py-4">لا توجد مهام</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team Members */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            فريق العمل ({members?.length ?? 0})
          </h3>
          <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5 border-border text-foreground">
                <Plus className="w-3.5 h-3.5" />
                إضافة عضو
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm bg-card border-border" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-foreground">إضافة عضو للفريق</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-foreground">نوع العضو</Label>
                  <Select value={memberForm.memberType} onValueChange={v => setMemberForm(f => ({ ...f, memberType: v, memberId: '' }))}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="employee" className="text-foreground">موظف</SelectItem>
                      <SelectItem value="freelancer" className="text-foreground">فريلانسر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground">اختر العضو</Label>
                  <Select value={memberForm.memberId} onValueChange={v => setMemberForm(f => ({ ...f, memberId: v }))}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue placeholder="اختر..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {memberForm.memberType === 'employee'
                        ? (employees ?? []).map(e => (
                          <SelectItem key={e.id} value={String(e.id)} className="text-foreground">{e.fullName}</SelectItem>
                        ))
                        : (freelancers ?? []).map(f => (
                          <SelectItem key={f.id} value={String(f.id)} className="text-foreground">{f.fullName}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button onClick={handleAddMember} disabled={addMemberMutation.isPending} className="flex-1">
                    {addMemberMutation.isPending ? 'جاري الإضافة...' : 'إضافة'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddMember(false)} className="border-border text-foreground">إلغاء</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex flex-wrap gap-3">
          {(members ?? []).map(member => (
            <div key={member.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: member.memberType === 'employee' ? 'oklch(0.70 0.18 160 / 0.2)' : 'oklch(0.70 0.18 300 / 0.2)', color: member.memberType === 'employee' ? 'oklch(0.70 0.18 160)' : 'oklch(0.70 0.18 300)' }}>
                {member.memberType === 'employee' ? 'م' : 'ف'}
              </div>
              <span className="text-sm text-foreground">
                {member.memberType === 'employee'
                  ? employees?.find(e => e.id === member.employeeId)?.fullName ?? `موظف #${member.employeeId}`
                  : freelancers?.find(f => f.id === member.freelancerId)?.fullName ?? `فريلانسر #${member.freelancerId}`}
              </span>
              <span className={cn('text-xs px-1.5 py-0.5 rounded-full', member.memberType === 'employee' ? 'bg-green-500/15 text-green-400' : 'bg-purple-500/15 text-purple-400')}>
                {member.memberType === 'employee' ? 'موظف' : 'فريلانسر'}
              </span>
            </div>
          ))}
          {(members ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">لم يتم إضافة أعضاء بعد</p>
          )}
        </div>
      </div>
    </div>
  );
}
