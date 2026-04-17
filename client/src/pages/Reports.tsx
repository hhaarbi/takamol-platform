import { trpc } from '@/lib/trpc';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart3, TrendingUp, Users, FolderKanban, CheckSquare, DollarSign } from 'lucide-react';

const serviceTypeLabels: Record<string, string> = {
  brand_identity: 'الهوية البصرية',
  visual_production: 'الإنتاج المرئي',
  advertising_campaigns: 'الحملات الإعلانية',
  events: 'الفعاليات',
  influencer_marketing: 'المؤثرون',
  digital_presence: 'التواجد الرقمي',
  website_design: 'تصميم المواقع',
};

const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  active: 'نشط',
  on_hold: 'متوقف',
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

const tooltipStyle = {
  contentStyle: {
    background: 'oklch(0.16 0.015 250)',
    border: '1px solid oklch(0.25 0.02 250)',
    borderRadius: '8px',
    color: 'oklch(0.95 0.01 250)',
    fontSize: '12px',
  },
};

export default function Reports() {
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const { data: byServiceType } = trpc.dashboard.projectsByServiceType.useQuery();
  const { data: byStatus } = trpc.dashboard.projectsByStatus.useQuery();
  const { data: employees } = trpc.employees.list.useQuery({});
  const { data: freelancers } = trpc.freelancers.list.useQuery({});
  const { data: contracts } = trpc.contracts.list.useQuery({});

  const serviceChartData = (byServiceType ?? []).map(item => ({
    name: serviceTypeLabels[item.serviceType] ?? item.serviceType,
    عدد: Number(item.cnt),
  }));

  const statusChartData = (byStatus ?? []).map(item => ({
    name: statusLabels[item.status] ?? item.status,
    value: Number(item.cnt),
  }));

  const taskCompletionRate = stats
    ? Math.round((stats.completedTasks / Math.max(stats.totalTasks, 1)) * 100)
    : 0;

  const projectCompletionRate = stats
    ? Math.round((stats.completedProjects / Math.max(stats.totalProjects, 1)) * 100)
    : 0;

  const activeContractsValue = (contracts ?? [])
    .filter(c => c.status === 'active')
    .reduce((sum, c) => sum + Number(c.value ?? 0), 0);

  const kpis = [
    {
      label: 'إجمالي المشاريع',
      value: stats?.totalProjects ?? 0,
      sub: `${stats?.activeProjects ?? 0} نشط`,
      icon: FolderKanban,
      color: 'oklch(0.65 0.22 265)',
      bg: 'oklch(0.65 0.22 265 / 0.12)',
    },
    {
      label: 'معدل إنجاز المشاريع',
      value: `${projectCompletionRate}%`,
      sub: `${stats?.completedProjects ?? 0} مكتمل`,
      icon: TrendingUp,
      color: 'oklch(0.70 0.18 160)',
      bg: 'oklch(0.70 0.18 160 / 0.12)',
    },
    {
      label: 'معدل إنجاز المهام',
      value: `${taskCompletionRate}%`,
      sub: `${stats?.completedTasks ?? 0} من ${stats?.totalTasks ?? 0}`,
      icon: CheckSquare,
      color: 'oklch(0.75 0.18 60)',
      bg: 'oklch(0.75 0.18 60 / 0.12)',
    },
    {
      label: 'إجمالي الفريق',
      value: (stats?.totalEmployees ?? 0) + (stats?.totalFreelancers ?? 0),
      sub: `${stats?.totalEmployees ?? 0} موظف + ${stats?.totalFreelancers ?? 0} فريلانسر`,
      icon: Users,
      color: 'oklch(0.70 0.18 300)',
      bg: 'oklch(0.70 0.18 300 / 0.12)',
    },
    {
      label: 'قيمة العقود النشطة',
      value: activeContractsValue.toLocaleString('ar-SA') + ' ر.س',
      sub: `${(contracts ?? []).filter(c => c.status === 'active').length} عقد نشط`,
      icon: DollarSign,
      color: 'oklch(0.65 0.20 30)',
      bg: 'oklch(0.65 0.20 30 / 0.12)',
    },
    {
      label: 'إجمالي العملاء',
      value: stats?.totalClients ?? 0,
      sub: 'عميل مسجل',
      icon: BarChart3,
      color: 'oklch(0.68 0.20 200)',
      bg: 'oklch(0.68 0.20 200 / 0.12)',
    },
  ];

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">التقارير والتحليلات</h1>
        <p className="text-muted-foreground text-sm mt-1">نظرة شاملة على أداء الوكالة</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="rounded-xl p-5 border border-border bg-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: kpi.bg }}>
                  <Icon className="w-5 h-5" style={{ color: kpi.color }} />
                </div>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects by service type - bar */}
        <div className="rounded-xl p-5 border border-border bg-card">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            المشاريع حسب نوع الخدمة
          </h3>
          {serviceChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={serviceChartData}>
                <XAxis dataKey="name" tick={{ fill: 'oklch(0.60 0.02 250)', fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fill: 'oklch(0.60 0.02 250)', fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="عدد" fill="oklch(0.65 0.22 265)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات</div>
          )}
        </div>

        {/* Projects by status - pie */}
        <div className="rounded-xl p-5 border border-border bg-card">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            توزيع حالات المشاريع
          </h3>
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusChartData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {statusChartData.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات</div>
          )}
        </div>
      </div>

      {/* Team breakdown */}
      <div className="rounded-xl p-5 border border-border bg-card">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          تحليل الفريق
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">الموظفون حسب القسم</h4>
            {(employees ?? []).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(
                  (employees ?? []).reduce((acc: Record<string, number>, emp) => {
                    const dept = emp.departmentId ? `قسم #${emp.departmentId}` : 'غير محدد';
                    acc[dept] = (acc[dept] ?? 0) + 1;
                    return acc;
                  }, {})
                ).map(([dept, count]) => (
                  <div key={dept} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{dept}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 rounded-full bg-primary/20 w-24">
                        <div className="h-full rounded-full bg-primary"
                          style={{ width: `${(count / (employees?.length ?? 1)) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-6 text-left">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">لا يوجد موظفون</p>
            )}
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">الفريلانسرز حسب التخصص</h4>
            {(freelancers ?? []).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(
                  (freelancers ?? []).reduce((acc: Record<string, number>, fl) => {
                    const spec = fl.specialty ?? 'غير محدد';
                    acc[spec] = (acc[spec] ?? 0) + 1;
                    return acc;
                  }, {})
                ).map(([spec, count]) => (
                  <div key={spec} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{spec}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 rounded-full bg-purple-500/20 w-24">
                        <div className="h-full rounded-full bg-purple-500"
                          style={{ width: `${(count / (freelancers?.length ?? 1)) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-6 text-left">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">لا يوجد فريلانسرز</p>
            )}
          </div>
        </div>
      </div>

      {/* Contracts summary */}
      <div className="rounded-xl p-5 border border-border bg-card">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          ملخص العقود
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['draft', 'active', 'completed', 'cancelled'].map(status => {
            const statusContracts = (contracts ?? []).filter(c => c.status === status);
            const totalValue = statusContracts.reduce((sum, c) => sum + Number(c.value ?? 0), 0);
            const labels: Record<string, string> = { draft: 'مسودة', active: 'نشطة', completed: 'مكتملة', cancelled: 'ملغاة' };
            const colors: Record<string, string> = {
              draft: 'text-gray-400', active: 'text-green-400',
              completed: 'text-blue-400', cancelled: 'text-red-400',
            };
            return (
              <div key={status} className="text-center p-4 rounded-lg bg-muted/30">
                <p className={`text-2xl font-bold ${colors[status]}`}>{statusContracts.length}</p>
                <p className="text-xs text-muted-foreground mt-1">{labels[status]}</p>
                {totalValue > 0 && (
                  <p className="text-xs text-foreground mt-1">{totalValue.toLocaleString('ar-SA')} ر.س</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
