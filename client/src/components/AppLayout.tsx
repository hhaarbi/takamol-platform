import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users, UserCheck,
  Building2, FileText, BarChart3, Bell, Settings, LogOut,
  ChevronRight, Menu, X, Briefcase, UserCog
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/projects', label: 'المشاريع', icon: FolderKanban },
  { href: '/tasks', label: 'المهام', icon: CheckSquare },
  { href: '/employees', label: 'الموظفون', icon: Users },
  { href: '/freelancers', label: 'الفريلانسرز', icon: UserCheck },
  { href: '/clients', label: 'العملاء', icon: Briefcase },
  { href: '/contracts', label: 'العقود', icon: FileText },
  { href: '/reports', label: 'التقارير', icon: BarChart3 },
  { href: '/accounts', label: 'إدارة الحسابات', icon: UserCog, adminOnly: true },
];

const roleLabels: Record<string, string> = {
  admin: 'مدير النظام',
  manager: 'مدير',
  employee: 'موظف',
  freelancer: 'فريلانسر',
};

const roleColors: Record<string, string> = {
  admin: 'text-red-400 bg-red-500/15',
  manager: 'text-blue-400 bg-blue-500/15',
  employee: 'text-green-400 bg-green-500/15',
  freelancer: 'text-purple-400 bg-purple-500/15',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(
    { recipientId: user?.id ?? 0, recipientType: 'internal' },
    { enabled: !!user, refetchInterval: 30000 }
  );

  const filteredNav = navItems.filter(item => {
    if (item.adminOnly && user?.role !== 'admin') return false;
    return true;
  });

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:relative z-50 h-full flex flex-col transition-all duration-300",
        "border-l border-sidebar-border",
        sidebarOpen ? "w-64" : "w-16",
        mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
        "bg-sidebar"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border h-16">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'oklch(0.65 0.22 265 / 0.25)' }}>
                <Building2 className="w-4 h-4" style={{ color: 'oklch(0.65 0.22 265)' }} />
              </div>
              <div>
                <p className="font-bold text-sm text-sidebar-foreground">مسارك</p>
                <p className="text-xs text-muted-foreground">النظام الداخلي</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground transition-colors"
          >
            <ChevronRight className={cn("w-4 h-4 transition-transform", !sidebarOpen && "rotate-180")} />
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-sidebar-accent text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || location.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn('nav-item', isActive && 'active', !sidebarOpen && 'justify-center px-2')}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-3 border-t border-sidebar-border">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: 'oklch(0.65 0.22 265 / 0.25)', color: 'oklch(0.65 0.22 265)' }}>
                {user?.username?.charAt(0)?.toUpperCase() ?? 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.username}</p>
                <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", roleColors[user?.role ?? 'employee'])}>
                  {roleLabels[user?.role ?? 'employee']}
                </span>
              </div>
              <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full flex justify-center p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-sidebar-accent">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-border bg-card flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-accent text-muted-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Link href="/notifications">
              <button className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <Bell className="w-5 h-5" />
                {(unreadCount ?? 0) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
                    style={{ background: 'oklch(0.65 0.22 265)', color: 'white', fontSize: '10px' }}>
                    {unreadCount}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
