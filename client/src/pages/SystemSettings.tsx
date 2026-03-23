import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings, Save, Building2, Percent, FileText, Bell } from "lucide-react";

const SETTINGS_GROUPS = [
  {
    title: "معلومات الشركة",
    icon: <Building2 className="h-4 w-4" />,
    settings: [
      { key: "company_name", label: "اسم الشركة", placeholder: "تكامل لإدارة الأملاك", type: "text" },
      { key: "company_phone", label: "رقم الهاتف", placeholder: "+966558018151", type: "text" },
      { key: "company_whatsapp", label: "رقم الواتساب", placeholder: "+966558018151", type: "text" },
      { key: "company_email", label: "البريد الإلكتروني", placeholder: "info@takamol.sa", type: "email" },
      { key: "company_address", label: "العنوان", placeholder: "المدينة المنورة، المملكة العربية السعودية", type: "text" },
      { key: "company_cr", label: "السجل التجاري", placeholder: "رقم السجل التجاري", type: "text" },
      { key: "company_fal", label: "رخصة فال", placeholder: "رقم رخصة فال", type: "text" },
    ],
  },
  {
    title: "إعدادات العمولات والرسوم",
    icon: <Percent className="h-4 w-4" />,
    settings: [
      { key: "management_fee_percent", label: "نسبة رسوم الإدارة (%)", placeholder: "5", type: "number" },
      { key: "sale_commission_percent", label: "عمولة البيع (%)", placeholder: "2.5", type: "number" },
      { key: "rent_commission_percent", label: "عمولة الإيجار (%)", placeholder: "5", type: "number" },
      { key: "late_payment_penalty", label: "غرامة التأخر في السداد (ر.س)", placeholder: "100", type: "number" },
      { key: "grace_period_days", label: "فترة السماح (أيام)", placeholder: "5", type: "number" },
    ],
  },
  {
    title: "إعدادات التنبيهات",
    icon: <Bell className="h-4 w-4" />,
    settings: [
      { key: "contract_expiry_alert_days", label: "تنبيه انتهاء العقد (قبل كم يوم)", placeholder: "30", type: "number" },
      { key: "payment_due_alert_days", label: "تنبيه استحقاق الدفع (قبل كم يوم)", placeholder: "7", type: "number" },
      { key: "maintenance_followup_days", label: "متابعة الصيانة (بعد كم يوم)", placeholder: "3", type: "number" },
    ],
  },
  {
    title: "إعدادات الفواتير والإيصالات",
    icon: <FileText className="h-4 w-4" />,
    settings: [
      { key: "invoice_prefix", label: "بادئة رقم الفاتورة", placeholder: "TKM", type: "text" },
      { key: "receipt_prefix", label: "بادئة رقم الإيصال", placeholder: "RCP", type: "text" },
      { key: "vat_number", label: "الرقم الضريبي (VAT)", placeholder: "رقم التسجيل الضريبي", type: "text" },
      { key: "vat_percent", label: "نسبة ضريبة القيمة المضافة (%)", placeholder: "15", type: "number" },
    ],
  },
];

export default function SystemSettings() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const { data: settings = [], refetch } = trpc.settings.list.useQuery();

  // Load settings into state when data arrives
  useEffect(() => {
    if (settings.length > 0) {
      const map: Record<string, string> = {};
      settings.forEach(s => { map[s.settingKey] = s.settingValue; });
      setValues(map);
    }
  }, [settings]);

  const setMutation = trpc.settings.set.useMutation({
    onSuccess: (_data, vars) => { toast.success(`تم حفظ "${vars.key}" بنجاح`); setSaving(null); refetch(); },
    onError: (e) => { toast.error(e.message); setSaving(null); },
  });

  const handleSave = (key: string, description?: string) => {
    setSaving(key);
    setMutation.mutate({ key, value: values[key] || "", description });
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-lg"><Settings className="h-5 w-5 text-gray-600" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إعدادات النظام</h1>
          <p className="text-gray-500 text-sm">تخصيص إعدادات الشركة والنظام</p>
        </div>
      </div>

      {SETTINGS_GROUPS.map((group, gi) => (
        <Card key={gi}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="text-amber-600">{group.icon}</span>
              {group.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.settings.map(setting => (
                <div key={setting.key} className="space-y-1.5">
                  <Label className="text-sm font-medium">{setting.label}</Label>
                  <div className="flex gap-2">
                    <Input
                      type={setting.type}
                      value={values[setting.key] || ""}
                      onChange={e => setValues(v => ({ ...v, [setting.key]: e.target.value }))}
                      placeholder={setting.placeholder}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs border-amber-200 text-amber-700 hover:bg-amber-50"
                      onClick={() => handleSave(setting.key, setting.label)}
                      disabled={saving === setting.key}
                    >
                      {saving === setting.key ? (
                        <span className="animate-spin">⏳</span>
                      ) : (
                        <><Save className="h-3 w-3" />حفظ</>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Current Settings Summary */}
      {settings.length > 0 && (
        <Card className="bg-gray-50">
          <CardHeader><CardTitle className="text-sm text-gray-600">الإعدادات المحفوظة حالياً ({settings.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {settings.map(s => (
                <div key={s.settingKey} className="bg-white rounded p-2 border text-xs">
                  <div className="text-gray-500">{s.description || s.settingKey}</div>
                  <div className="font-medium text-gray-800 mt-0.5">{s.settingValue || "-"}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
