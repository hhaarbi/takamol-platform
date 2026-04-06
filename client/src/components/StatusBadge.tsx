import { cn } from '@/lib/utils';

const statusLabels: Record<string, string> = {
  pending: 'معلق',
  in_progress: 'قيد التنفيذ',
  under_review: 'قيد المراجعة',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  draft: 'مسودة',
  active: 'نشط',
  on_hold: 'متوقف',
};

const priorityLabels: Record<string, string> = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  urgent: 'عاجلة',
};

const serviceTypeLabels: Record<string, string> = {
  brand_identity: 'الهوية البصرية',
  visual_production: 'الإنتاج المرئي',
  advertising_campaigns: 'الحملات الإعلانية',
  events: 'الفعاليات',
  influencer_marketing: 'المؤثرون',
  digital_presence: 'التواجد الرقمي',
  website_design: 'تصميم المواقع',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('status-badge', `status-${status}`)}>
      {statusLabels[status] ?? status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    low: 'bg-slate-500/15 text-slate-400',
    medium: 'bg-blue-500/15 text-blue-400',
    high: 'bg-orange-500/15 text-orange-400',
    urgent: 'bg-red-500/15 text-red-400',
  };
  return (
    <span className={cn('status-badge', colors[priority] ?? '')}>
      {priorityLabels[priority] ?? priority}
    </span>
  );
}

export function ServiceTypeBadge({ serviceType }: { serviceType: string }) {
  return (
    <span className="status-badge bg-primary/15 text-primary border border-primary/25">
      {serviceTypeLabels[serviceType] ?? serviceType}
    </span>
  );
}

export { statusLabels, priorityLabels, serviceTypeLabels };
