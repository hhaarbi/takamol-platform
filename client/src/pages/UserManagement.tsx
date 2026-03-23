import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Shield, Crown, Search, Trash2, Edit, UserCheck, UserX, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";

const ROLE_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  super_admin: { label: "سوبر أدمن", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: <Crown size={12} /> },
  admin: { label: "مدير", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <Shield size={12} /> },
  owner: { label: "مالك عقار", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <UserCheck size={12} /> },
  broker: { label: "وسيط", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: <UserCheck size={12} /> },
  user: { label: "مستخدم", color: "bg-muted text-muted-foreground border-border", icon: <UserX size={12} /> },
};

export default function UserManagement() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editUser, setEditUser] = useState<{ id: number; name: string | null; role: string } | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const usersQuery = trpc.userManagement.list.useQuery({
    role: roleFilter === "all" ? undefined : roleFilter,
    search: search || undefined,
    limit: 100,
  });

  const statsQuery = trpc.userManagement.stats.useQuery();

  const updateRoleMutation = trpc.userManagement.updateRole.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الدور بنجاح");
      utils.userManagement.list.invalidate();
      utils.userManagement.stats.invalidate();
      setEditUser(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.userManagement.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المستخدم");
      utils.userManagement.list.invalidate();
      utils.userManagement.stats.invalidate();
      setDeleteConfirm(null);
    },
    onError: (err) => toast.error(err.message),
  });

  // Only super_admin can access this page
  if (user?.role !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Crown size={48} className="text-amber-500" />
        <h2 className="text-xl font-bold">صلاحية سوبر أدمن مطلوبة</h2>
        <p className="text-muted-foreground">هذه الصفحة متاحة فقط لمستخدم سوبر أدمن</p>
        <Button onClick={() => navigate("/dashboard")}>العودة للوحة التحكم</Button>
      </div>
    );
  }

  const users_list = usersQuery.data ?? [];
  const stats = statsQuery.data;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown size={24} className="text-amber-500" />
            إدارة المستخدمين
          </h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة أدوار وصلاحيات جميع المستخدمين</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => utils.userManagement.list.invalidate()}>
          <RefreshCw size={14} className="ml-1" />تحديث
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { role: "super_admin", label: "سوبر أدمن", color: "text-amber-500" },
          { role: "admin", label: "مدراء", color: "text-blue-500" },
          { role: "owner", label: "ملاك", color: "text-green-500" },
          { role: "broker", label: "وسطاء", color: "text-purple-500" },
          { role: "user", label: "مستخدمون", color: "text-muted-foreground" },
        ].map(({ role, label, color }) => (
          <Card key={role} className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setRoleFilter(role)}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{stats?.byRole?.[role] ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="بحث بالاسم أو البريد..." className="pr-9"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="جميع الأدوار" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأدوار</SelectItem>
            <SelectItem value="super_admin">سوبر أدمن</SelectItem>
            <SelectItem value="admin">مدير</SelectItem>
            <SelectItem value="owner">مالك عقار</SelectItem>
            <SelectItem value="broker">وسيط</SelectItem>
            <SelectItem value="user">مستخدم</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users size={16} />
            المستخدمون ({users_list.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {usersQuery.isLoading ? (
            <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>
          ) : users_list.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">لا يوجد مستخدمون</div>
          ) : (
            <div className="divide-y divide-border">
              {users_list.map((u) => {
                const roleInfo = ROLE_LABELS[u.role] ?? ROLE_LABELS.user;
                const isCurrentUser = u.id === user?.id;
                return (
                  <div key={u.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {(u.name ?? u.email ?? "؟").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium flex items-center gap-1.5">
                          {u.name ?? "—"}
                          {isCurrentUser && <span className="text-xs text-amber-500">(أنت)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{u.email ?? u.openId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs border flex items-center gap-1 ${roleInfo.color}`}>
                        {roleInfo.icon}{roleInfo.label}
                      </Badge>
                      <p className="text-xs text-muted-foreground hidden md:block">
                        {new Date(u.createdAt).toLocaleDateString("ar-SA")}
                      </p>
                      {!isCurrentUser && (
                        <>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                            onClick={() => { setEditUser({ id: u.id, name: u.name, role: u.role }); setNewRole(u.role); }}>
                            <Edit size={13} />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirm(u.id)}>
                            <Trash2 size={13} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تغيير دور المستخدم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">المستخدم: <span className="font-medium text-foreground">{editUser?.name ?? "—"}</span></p>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">👑 سوبر أدمن</SelectItem>
                <SelectItem value="admin">🛡️ مدير</SelectItem>
                <SelectItem value="owner">🏠 مالك عقار</SelectItem>
                <SelectItem value="broker">🤝 وسيط</SelectItem>
                <SelectItem value="user">👤 مستخدم عادي</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>إلغاء</Button>
            <Button onClick={() => editUser && updateRoleMutation.mutate({ userId: editUser.id, role: newRole as any })}
              disabled={updateRoleMutation.isPending || newRole === editUser?.role}>
              {updateRoleMutation.isPending ? "جاري الحفظ..." : "حفظ التغيير"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-destructive">تأكيد حذف المستخدم</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
              disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "جاري الحذف..." : "حذف المستخدم"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
