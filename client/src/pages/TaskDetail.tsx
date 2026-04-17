import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowRight, MessageSquare, Send, Calendar, User, Clock } from 'lucide-react';

export default function TaskDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const id = parseInt(params.id ?? '0');

  const { data: task, isLoading, refetch } = trpc.tasks.getById.useQuery({ id });
  const { data: comments, refetch: refetchComments } = trpc.tasks.getComments.useQuery({ taskId: id });
  const { data: employees } = trpc.employees.list.useQuery({});
  const { data: freelancers } = trpc.freelancers.list.useQuery({});

  const [comment, setComment] = useState('');

  const updateTaskMutation = trpc.tasks.update.useMutation({
    onSuccess: () => { toast.success('تم تحديث المهمة'); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const addCommentMutation = trpc.tasks.addComment.useMutation({
    onSuccess: () => { toast.success('تم إضافة التعليق'); setComment(''); refetchComments(); },
    onError: (e) => toast.error(e.message),
  });

  const handleStatusChange = (status: string) => {
    updateTaskMutation.mutate({ id, status: status as any });
  };

  const handleAddComment = () => {
    if (!comment.trim()) return;
    addCommentMutation.mutate({
      taskId: id,
      authorType: 'internal',
      authorId: user?.id ?? 1,
      content: comment,
    });
  };

  const getAssigneeName = () => {
    if (!task) return 'غير معين';
    if (task.assigneeEmployeeId) {
      return employees?.find(e => e.id === task.assigneeEmployeeId)?.fullName ?? `موظف #${task.assigneeEmployeeId}`;
    }
    if (task.assigneeFreelancerId) {
      return freelancers?.find(f => f.id === task.assigneeFreelancerId)?.fullName ?? `فريلانسر #${task.assigneeFreelancerId}`;
    }
    return 'غير معين';
  };

  if (isLoading) {
    return <div className="h-64 rounded-xl bg-card animate-pulse border border-border" />;
  }

  if (!task) {
    return <div className="text-center py-20 text-muted-foreground">المهمة غير موجودة</div>;
  }

  return (
    <div className="space-y-6 fade-in max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/tasks')} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowRight className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground flex-1">{task.title}</h1>
      </div>

      {/* Task info */}
      <div className="rounded-xl p-5 border border-border bg-card space-y-4">
        <div className="flex flex-wrap gap-3">
          <Select value={task.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-auto h-auto bg-transparent border-0 p-0">
              <StatusBadge status={task.status} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="pending" className="text-foreground">معلق</SelectItem>
              <SelectItem value="in_progress" className="text-foreground">قيد التنفيذ</SelectItem>
              <SelectItem value="under_review" className="text-foreground">قيد المراجعة</SelectItem>
              <SelectItem value="completed" className="text-foreground">مكتمل</SelectItem>
              <SelectItem value="cancelled" className="text-foreground">ملغي</SelectItem>
            </SelectContent>
          </Select>
          <PriorityBadge priority={task.priority} />
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-1">المعين إليه</p>
            <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" />
              {getAssigneeName()}
            </p>
          </div>
          {task.dueDate && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">تاريخ التسليم</p>
              <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                {new Date(task.dueDate).toLocaleDateString('ar-SA')}
              </p>
            </div>
          )}
          {task.estimatedHours && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">الساعات المقدرة</p>
              <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                {task.estimatedHours} ساعة
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-1">تاريخ الإنشاء</p>
            <p className="text-sm font-medium text-foreground">
              {new Date(task.createdAt).toLocaleDateString('ar-SA')}
            </p>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="rounded-xl p-5 border border-border bg-card">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-primary" />
          التعليقات ({comments?.length ?? 0})
        </h3>

        <div className="space-y-3 mb-4">
          {(comments ?? []).map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'oklch(0.65 0.22 265 / 0.2)', color: 'oklch(0.65 0.22 265)' }}>
                {c.authorId}
              </div>
              <div className="flex-1 bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground">
                    {c.authorType === 'internal' ? 'مدير' : c.authorType === 'employee' ? 'موظف' : 'فريلانسر'} #{c.authorId}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleString('ar-SA')}
                  </span>
                </div>
                <p className="text-sm text-foreground">{c.content}</p>
              </div>
            </div>
          ))}
          {(comments ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد تعليقات بعد</p>
          )}
        </div>

        <div className="flex gap-3">
          <Textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="اكتب تعليقاً..."
            className="bg-input border-border text-foreground resize-none"
            rows={2}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAddComment(); }}
          />
          <Button onClick={handleAddComment} disabled={!comment.trim() || addCommentMutation.isPending}
            className="self-end">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
