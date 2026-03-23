import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mail, Send, CheckCircle2, Clock, XCircle, Bell, Settings } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  sent: { label: "مُرسل", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="h-3 w-3" /> },
  pending: { label: "معلق", color: "bg-blue-100 text-blue-700", icon: <Clock className="h-3 w-3" /> },
  failed: { label: "فشل", color: "bg-red-100 text-red-700", icon: <XCircle className="h-3 w-3" /> },
};

const TYPE_MAP: Record<string, string> = {
  contract_expiry: "انتهاء عقد",
  payment_reminder: "تذكير دفع",
  payment_receipt: "إيصال دفع",
  maintenance_update: "تحديث صيانة",
  welcome: "ترحيب",
  custom: "مخصص",
};

export default function EmailNotifications() {
  const [testEmail, setTestEmail] = useState("");
  const [settings, setSettings] = useState({
    contractExpiry: true,
    paymentReminder: true,
    paymentReceipt: true,
    maintenanceUpdate: false,
    daysBeforeExpiry: 30,
    daysBeforePayment: 7,
  });

  const utils = trpc.useUtils();
  const { data: logs, isLoading } = trpc.emailSettings.log.useQuery();

  const sendTestMutation = trpc.emailSettings.sendTest.useMutation({
    onSuccess: () => {
      toast.success(`تم إرسال بريد تجريبي إلى ${testEmail}`);
      utils.emailSettings.log.invalidate();
    },
    onError: () => toast.error("فشل إرسال البريد التجريبي"),
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">إشعارات البريد الإلكتروني</h1>
        <p className="text-muted-foreground mt-1">إدارة الإشعارات التلقائية للملاك والمستأجرين</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-500" />
              إعدادات الإشعارات
            </CardTitle>
            <CardDescription>تفعيل أو تعطيل أنواع الإشعارات التلقائية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "contractExpiry", label: "تنبيه انتهاء العقد", desc: `قبل ${settings.daysBeforeExpiry} يوماً` },
              { key: "paymentReminder", label: "تذكير موعد الدفع", desc: `قبل ${settings.daysBeforePayment} أيام` },
              { key: "paymentReceipt", label: "إيصال الدفع", desc: "عند تسجيل دفعة جديدة" },
              { key: "maintenanceUpdate", label: "تحديثات الصيانة", desc: "عند تغيير حالة طلب الصيانة" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={settings[item.key as keyof typeof settings] as boolean}
                  onCheckedChange={v => setSettings(p => ({ ...p, [item.key]: v }))}
                />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <Label className="text-xs">أيام قبل انتهاء العقد</Label>
                <Input type="number" value={settings.daysBeforeExpiry}
                  onChange={e => setSettings(p => ({ ...p, daysBeforeExpiry: Number(e.target.value) }))}
                  className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">أيام قبل موعد الدفع</Label>
                <Input type="number" value={settings.daysBeforePayment}
                  onChange={e => setSettings(p => ({ ...p, daysBeforePayment: Number(e.target.value) }))}
                  className="h-8 text-sm" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-4">
          {/* Test Email */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-green-500" />
                إرسال بريد تجريبي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>البريد الإلكتروني</Label>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                />
              </div>
              <Button
                className="w-full gap-2"
                disabled={!testEmail || sendTestMutation.isPending}
                onClick={() => sendTestMutation.mutate({ email: testEmail, type: 'test' })}>
                <Mail className="h-4 w-4" />
                {sendTestMutation.isPending ? "جاري الإرسال..." : "إرسال بريد تجريبي"}
              </Button>
            </CardContent>
          </Card>

          {/* Bulk Reminders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-500" />
                إرسال تذكيرات جماعية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                إرسال تذكيرات لجميع المستأجرين الذين لديهم دفعات قادمة أو عقود على وشك الانتهاء
              </p>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => toast.info("سيتم إرسال التذكيرات عبر الجدولة التلقائية")}
              >
                <Bell className="h-4 w-4" />
                إرسال التذكيرات الآن
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-purple-500" />
            سجل الإشعارات المرسلة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : !logs?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>لم يُرسل أي بريد إلكتروني بعد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="p-3 text-right font-medium">المستلم</th>
                    <th className="p-3 text-right font-medium">نوع الإشعار</th>
                    <th className="p-3 text-right font-medium">الموضوع</th>
                    <th className="p-3 text-right font-medium">التاريخ</th>
                    <th className="p-3 text-right font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => {
                    const st = STATUS_MAP[log.status || "pending"];
                    return (
                      <tr key={log.id} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-medium">{log.recipientEmail}</td>
                        <td className="p-3 text-muted-foreground">{TYPE_MAP[log.notificationType || "custom"] || log.notificationType}</td>
                        <td className="p-3 text-muted-foreground truncate max-w-xs">{log.subject}</td>
                        <td className="p-3">{new Date(log.sentAt || log.createdAt).toLocaleDateString("ar-SA")}</td>
                        <td className="p-3">
                          <Badge className={`gap-1 border-0 ${st.color}`}>
                            {st.icon}{st.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
