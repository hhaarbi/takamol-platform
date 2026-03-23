import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Shield, Globe, Webhook, Plus, Trash2, CheckCircle, XCircle, Activity } from "lucide-react";

const WEBHOOK_EVENTS = [
  "contract.created", "contract.expired", "payment.received", "payment.overdue",
  "maintenance.requested", "maintenance.completed", "tenant.added", "property.listed",
];

export default function SecurityLog() {
  const [activeTab, setActiveTab] = useState("login-log");
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [webhookForm, setWebhookForm] = useState({ name: "", url: "", secret: "", events: [] as string[] });

  const loginLogs = trpc.loginLog.list.useQuery({ limit: 100 });
  const webhooksList = trpc.webhooks.list.useQuery();
  const utils = trpc.useUtils();

  const createWebhook = trpc.webhooks.create.useMutation({
    onSuccess: () => { toast.success("تم إضافة Webhook بنجاح"); utils.webhooks.list.invalidate(); setShowAddWebhook(false); setWebhookForm({ name: "", url: "", secret: "", events: [] }); },
    onError: (e) => toast.error(e.message),
  });
  const toggleWebhook = trpc.webhooks.update.useMutation({
    onSuccess: () => utils.webhooks.list.invalidate(),
  });
  const deleteWebhook = trpc.webhooks.delete.useMutation({
    onSuccess: () => { toast.success("تم حذف Webhook"); utils.webhooks.list.invalidate(); },
  });

  const toggleEvent = (event: string) => {
    setWebhookForm(f => ({
      ...f,
      events: f.events.includes(event) ? f.events.filter(e => e !== event) : [...f.events, event],
    }));
  };

  const logs = loginLogs.data ?? [];
  const hooks = webhooksList.data ?? [];

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6" />
          الأمان والتكاملات
        </h1>
        <p className="text-muted-foreground text-sm mt-1">سجل الدخول ونقاط Webhook للتكامل الخارجي</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">إجمالي محاولات الدخول</div>
            <div className="text-2xl font-bold text-foreground mt-1">{logs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">دخول ناجح</div>
            <div className="text-2xl font-bold text-green-600 mt-1">{logs.filter(l => l.status === "success").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">محاولات فاشلة</div>
            <div className="text-2xl font-bold text-red-500 mt-1">{logs.filter(l => l.status === "failed").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Webhooks نشطة</div>
            <div className="text-2xl font-bold text-primary mt-1">{hooks.filter(h => h.isActive).length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="login-log" className="gap-2"><Activity className="w-4 h-4" />سجل الدخول</TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2"><Webhook className="w-4 h-4" />Webhooks</TabsTrigger>
        </TabsList>

        {/* Login Log */}
        <TabsContent value="login-log">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">سجل عمليات الدخول</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد سجلات دخول بعد</p>
                  <p className="text-xs mt-1">ستظهر هنا عمليات الدخول تلقائياً</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-right py-2 px-3">المستخدم</th>
                        <th className="text-right py-2 px-3">عنوان IP</th>
                        <th className="text-right py-2 px-3">الجهاز</th>
                        <th className="text-right py-2 px-3">الحالة</th>
                        <th className="text-right py-2 px-3">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log.id} className="border-b hover:bg-muted/20">
                          <td className="py-2 px-3">{log.email ?? `مستخدم #${log.userId}`}</td>
                          <td className="py-2 px-3 font-mono text-xs">{log.ipAddress ?? "—"}</td>
                          <td className="py-2 px-3 text-xs text-muted-foreground max-w-[200px] truncate">{log.userAgent ?? "—"}</td>
                          <td className="py-2 px-3">
                            {log.status === "success"
                              ? <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle className="w-3 h-3" />ناجح</span>
                              : <span className="flex items-center gap-1 text-red-500 text-xs"><XCircle className="w-3 h-3" />فاشل</span>}
                          </td>
                          <td className="py-2 px-3 text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString("ar-SA")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">نقاط Webhook للتكامل الخارجي</CardTitle>
                <Button size="sm" onClick={() => setShowAddWebhook(true)} className="gap-1">
                  <Plus className="w-3 h-3" />
                  إضافة Webhook
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {hooks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Webhook className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد Webhooks مضافة</p>
                  <p className="text-xs mt-1">أضف Webhook لاستقبال الأحداث في نظامك الخارجي</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {hooks.map(hook => {
                    const events = (() => { try { return JSON.parse(hook.events); } catch { return []; } })();
                    return (
                      <div key={hook.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{hook.name}</span>
                              <Badge className={hook.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                                {hook.isActive ? "نشط" : "موقوف"}
                              </Badge>
                              {hook.failureCount > 0 && (
                                <Badge className="bg-red-100 text-red-600">{hook.failureCount} فشل</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Globe className="w-3 h-3" />
                              <span className="truncate font-mono">{hook.url}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {events.map((e: string) => (
                                <Badge key={e} variant="outline" className="text-xs">{e}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => toggleWebhook.mutate({ id: hook.id, isActive: !hook.isActive })}>
                              {hook.isActive ? "إيقاف" : "تفعيل"}
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => { if (confirm("حذف هذا Webhook؟")) deleteWebhook.mutate(hook.id); }}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {hook.lastTriggeredAt && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            آخر تشغيل: {new Date(hook.lastTriggeredAt).toLocaleString("ar-SA")}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Webhook Dialog */}
      <Dialog open={showAddWebhook} onOpenChange={setShowAddWebhook}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة Webhook جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">الاسم *</label>
              <Input value={webhookForm.name} onChange={e => setWebhookForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: نظام ERP الداخلي" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">رابط الاستقبال (URL) *</label>
              <Input value={webhookForm.url} onChange={e => setWebhookForm(f => ({ ...f, url: e.target.value }))} placeholder="https://your-system.com/webhook" type="url" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">المفتاح السري (اختياري)</label>
              <Input value={webhookForm.secret} onChange={e => setWebhookForm(f => ({ ...f, secret: e.target.value }))} placeholder="للتحقق من صحة الطلبات" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">الأحداث المراقبة *</label>
              <div className="grid grid-cols-2 gap-2">
                {WEBHOOK_EVENTS.map(event => (
                  <label key={event} className="flex items-center gap-2 cursor-pointer p-2 rounded border hover:bg-muted/30">
                    <input
                      type="checkbox"
                      checked={webhookForm.events.includes(event)}
                      onChange={() => toggleEvent(event)}
                      className="rounded"
                    />
                    <span className="text-xs font-mono">{event}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                disabled={createWebhook.isPending || !webhookForm.name || !webhookForm.url || webhookForm.events.length === 0}
                onClick={() => createWebhook.mutate(webhookForm)}
              >
                {createWebhook.isPending ? "جاري الإضافة..." : "إضافة Webhook"}
              </Button>
              <Button variant="outline" onClick={() => setShowAddWebhook(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
