import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Link } from 'wouter';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { CheckSquare, Search, Filter, Calendar, User } from 'lucide-react';

export default function Tasks() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: tasks, isLoading } = trpc.tasks.list.useQuery({
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const { data: employees } = trpc.employees.list.useQuery({});
  const { data: freelancers } = trpc.freelancers.list.useQuery({});
  const { data: projects } = trpc.projects.list.useQuery({});

  const getAssigneeName = (task: any) => {
    if (task.assigneeEmployeeId) {
      return employees?.find(e => e.id === task.assigneeEmployeeId)?.fullName ?? `موظف #${task.assigneeEmployeeId}`;
    }
    if (task.assigneeFreelancerId) {
      return freelancers?.find(f => f.id === task.assigneeFreelancerId)?.fullName ?? `فريلانسر #${task.assigneeFreelancerId}`;
    }
    return 'غير معين';
  };

  const getProjectTitle = (task: any) => {
    return projects?.find(p => p.id === task.projectId)?.title ?? `مشروع #${task.projectId}`;
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">المهام</h1>
        <p className="text-muted-foreground text-sm mt-1">{tasks?.length ?? 0} مهمة</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="البحث في المهام..." className="pr-9 bg-card border-border text-foreground" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 bg-card border-border text-foreground">
            <Filter className="w-4 h-4 ml-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all" className="text-foreground">جميع الحالات</SelectItem>
            <SelectItem value="pending" className="text-foreground">معلق</SelectItem>
            <SelectItem value="in_progress" className="text-foreground">قيد التنفيذ</SelectItem>
            <SelectItem value="under_review" className="text-foreground">قيد المراجعة</SelectItem>
            <SelectItem value="completed" className="text-foreground">مكتمل</SelectItem>
            <SelectItem value="cancelled" className="text-foreground">ملغي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-card animate-pulse border border-border" />
          ))}
        </div>
      ) : (tasks ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CheckSquare className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">لا توجد مهام</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(tasks ?? []).map((task) => (
            <Link key={task.id} href={`/tasks/${task.id}`}>
              <div className="rounded-xl p-4 border border-border bg-card card-hover cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{task.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                    <p className="text-xs text-primary mt-1">{getProjectTitle(task)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {getAssigneeName(task)}
                  </span>
                  {task.dueDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(task.dueDate).toLocaleDateString('ar-SA')}
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
