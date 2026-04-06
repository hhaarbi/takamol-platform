import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import {
  FolderKanban, CheckSquare, Users, UserCheck, Briefcase,
  TrendingUp, Clock, AlertCircle, Activity, ArrowUpRight,
  Palette, Video, Megaphone, Calendar, Star, Globe, Monitor
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '@/lib/utils';

const serviceTypeLabels: Record<string, string> = {
  brand_identity: 'الهوية البصرية',
  visual_production: 'الإنتاج المرئي',
  advertising_campaigns: 'الحملات الإعلانية',
  events: 'الفعاليات',
  influencer_marketing: 'المؤثرون',
  digital_presence: 'التواجد الرقمي',
  website_design: 'تصميم المواقع',
};

const serviceTypeIcons: Record<string, React.ComponentType<any>> = {
  brand_identity: Palette,
  visual_production: Video,
  advertising_campaigns: Megaphone,
  events: Calendar,
  influencer_marketing: Star,
  digital_presence: Globe,
  website_design: Monitor,
};

const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  active: 'نشط',
  on_hold: 'معلق',
  under_review: 'قيد المراجعة',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

const CHART_COLORS = [
  'oklch(0.65 0.22 265)',
  'oklch(0.70 0.18 160)',
  'oklch(0.75 0.18 60)',
  'oklch(0.65 0.20 30)',
  'oklch(0.70 0.18 300)',
  'oklch(0.68 0.20 200)',
  'oklch(0.72 0.18 100)',
];

const roleLabels: Record<string, string> = {
  admin: 'مدير النظام',
  manager: 'مدير',
  employee: 'موظف',
  freelancer: 'فريلانسر',
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: byServiceType } = trpc.dashboard.projectsByServiceType.useQuery();
  const { data: byStatus } = trpc.dashboard.projectsByStatus.useQuery();
  const { data: recentActivity } = trpc.dashboard.recentActivity.useQuery();

  const serviceChartData = (byServiceType ?? []).map(item => ({
    name: serviceTypeLabels[item.serviceType] ?? item.serviceType,
    value: Number(item.cnt),
  }));

  const statusChartData = (byStatus ?? []).map(item => ({
    name: statusLabels[item.status] ?? item.status,
    value: Number(item.cnt),
  }));

  const kpiCards = [
    {
      label: 'المشاريع النشطة',
      value: stats?.activeProjects ?? 0,
      total: stats?.totalProjects ?? 0,
      icon: FolderKanban,
      color: 'oklch(0.65 0.22 265)',
      bg: 'oklch(0.65 0.22 265 / 0.12)',
      change: '+12%',
    },
    {
      label: 'المهام المعلقة',
      value: stats?.pendingTasks ?? 0,
      total: stats?.totalTasks ?? 0,
      icon: CheckSquare,
      color: 'oklch(0.75 0.18 60)',
      bg: 'oklch(0.75 0.18 60 / 0.12)',
      change: '+5%',
    },
    {
      label: 'الموظفون',
      value: stats?.totalEmployees ?? 0,
      icon: Users,
      color: 'oklch(0.70 0.18 160)',
      bg: 'oklch(0.70 0.18 160 / 0.12)',
    },
    {
      label: 'الفريلانسرز',
      value: stats?.totalFreelancers ?? 0,
      icon: UserCheck,
      color: 'oklch(0.70 0.18 300)',
      bg: 'oklch(0.70 0.18 300 / 0.12)',
    },
    {
      label: 'العملاء',
      value: stats?.totalClients ?? 0,
      icon: Briefcase,
      color: 'oklch(0.65 0.20 30)',
      bg: 'oklch(0.65 0.20 30 / 0.12)',
    },
    {
      label: 'المشاريع المكتملة',
      value: stats?.completedProjects ?? 0,
      icon: TrendingUp,
      color: 'oklch(0.70 0.18 160)',
      bg: 'oklch(0.70 0.18 160 / 0.12)',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-card animate-pulse border border-border" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            مرحباً، <span className="gradient-text">{user?.username}</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {roleLabels[user?.role ?? 'employee']} · {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">النظام يعمل بشكل طبيعي</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="rounded-xl p-4 border border-border bg-card card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: card.bg }}>
                  <Icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                {card.change && (
                  <span className="text-xs text-green-400 flex items-center gap-0.5">
                    <ArrowUpRight className="w-3 h-3" />
                    {card.change}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value.toLocaleString('ar')}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
              {card.total !== undefined && (
                <p className="text-xs text-muted-foreground/60 mt-0.5">من {card.total} إجمالي</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Revenue + Tasks summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl p-5 border border-border bg-card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">الإيرادات النشطة</h3>
          </div>
          <p className="text-3xl font-bold gradient-text">
            {(stats?.totalRevenue ?? 0).toLocaleString('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-muted-foreground mt-2">من العقود النشطة</p>
        </div>

        <div className="rounded-xl p-5 border border-border bg-card">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-yellow-400" />
            <h3 className="font-semibold text-foreground">المهام قيد التنفيذ</h3>
          </div>
          <p className="text-3xl font-bold text-yellow-400">{stats?.inProgressTasks ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-2">مهمة تحت التنفيذ الآن</p>
        </div>

        <div className="rounded-xl p-5 border border-border bg-card">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-purple-400" />
            <h3 className="font-semibold text-foreground">قيد المراجعة</h3>
          </div>
          <p className="text-3xl font-bold text-purple-400">
            {statusChartData.find(s => s.name === 'قيد المراجعة')?.value ?? 0}
          </p>
          <p className="text-xs text-muted-foreground mt-2">مشروع ينتظر المراجعة</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects by service type */}
        <div className="rounded-xl p-5 border border-border bg-card">
          <h3 className="font-semibold text-foreground mb-4">المشاريع حسب نوع الخدمة</h3>
          {serviceChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={serviceChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {serviceChartData.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'oklch(0.16 0.015 250)', border: '1px solid oklch(0.25 0.02 250)', borderRadius: '8px', color: 'oklch(0.95 0.01 250)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
              لا توجد مشاريع بعد
            </div>
          )}
        </div>

        {/* Projects by status */}
        <div className="rounded-xl p-5 border border-border bg-card">
          <h3 className="font-semibold text-foreground mb-4">المشاريع حسب الحالة</h3>
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusChartData} layout="vertical">
                <XAxis type="number" tick={{ fill: 'oklch(0.60 0.02 250)', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'oklch(0.60 0.02 250)', fontSize: 11 }} width={90} />
                <Tooltip
                  contentStyle={{ background: 'oklch(0.16 0.015 250)', border: '1px solid oklch(0.25 0.02 250)', borderRadius: '8px', color: 'oklch(0.95 0.01 250)' }}
                />
                <Bar dataKey="value" fill="oklch(0.65 0.22 265)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
              لا توجد مشاريع بعد
            </div>
          )}
        </div>
      </div>

      {/* Service type quick overview */}
      <div className="rounded-xl p-5 border border-border bg-card">
        <h3 className="font-semibold text-foreground mb-4">خدمات الوكالة</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.entries(serviceTypeLabels).map(([key, label]) => {
            const Icon = serviceTypeIcons[key] ?? FolderKanban;
            const count = serviceChartData.find(d => d.name === label)?.value ?? 0;
            return (
              <div key={key} className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors text-center">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'oklch(0.65 0.22 265 / 0.12)' }}>
                  <Icon className="w-5 h-5" style={{ color: 'oklch(0.65 0.22 265)' }} />
                </div>
                <p className="text-xs text-muted-foreground leading-tight">{label}</p>
                <p className="text-lg font-bold text-foreground">{count}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl p-5 border border-border bg-card">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">آخر النشاطات</h3>
        </div>
        {(recentActivity ?? []).length > 0 ? (
          <div className="space-y-3">
            {(recentActivity ?? []).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{ background: 'oklch(0.65 0.22 265 / 0.2)', color: 'oklch(0.65 0.22 265)' }}>
                  {activity.actorName?.charAt(0) ?? 'N'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(activity.createdAt).toLocaleString('ar-SA')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-8">لا توجد نشاطات حديثة</p>
        )}
      </div>
    </div>
  );
}
