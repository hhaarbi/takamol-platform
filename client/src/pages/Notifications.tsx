import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, any> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
};

const typeColors: Record<string, string> = {
  info: 'text-blue-400',
  warning: 'text-yellow-400',
  success: 'text-green-400',
  error: 'text-red-400',
};

export default function Notifications() {
  const { user } = useAuth();

  const { data: notifications, isLoading, refetch } = trpc.notifications.list.useQuery({
    recipientId: user?.id ?? 0,
    recipientType: 'internal',
  });

  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => refetch(),
  });

  const markAllReadMutation = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => { toast.success('تم تعليم جميع الإشعارات كمقروءة'); refetch(); },
  });

  const unread = (notifications ?? []).filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 fade-in max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الإشعارات</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {unread > 0 ? `${unread} إشعار غير مقروء` : 'جميع الإشعارات مقروءة'}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" className="gap-2 border-border text-foreground"
            onClick={() => markAllReadMutation.mutate({ recipientId: user?.id ?? 0, recipientType: 'internal' })}
            disabled={markAllReadMutation.isPending}>
            <CheckCheck className="w-4 h-4" />
            تعليم الكل كمقروء
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-card animate-pulse border border-border" />
          ))}
        </div>
      ) : (notifications ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">لا توجد إشعارات</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(notifications ?? []).map((notif) => {
            const Icon = typeIcons[notif.type] ?? Info;
            return (
              <div key={notif.id}
                className={cn(
                  'rounded-xl p-4 border transition-colors cursor-pointer',
                  notif.isRead
                    ? 'bg-card border-border opacity-60'
                    : 'bg-card border-primary/30 hover:border-primary/50'
                )}
                onClick={() => { if (!notif.isRead) markReadMutation.mutate({ id: notif.id }); }}>
                <div className="flex items-start gap-3">
                  <div className={cn('mt-0.5 flex-shrink-0', typeColors[notif.type] ?? 'text-blue-400')}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-foreground text-sm">{notif.title}</p>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1.5">
                      {new Date(notif.createdAt).toLocaleString('ar-SA')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
