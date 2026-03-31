import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Code2, Key, Plus, Copy, Trash2, CheckCircle, XCircle, BookOpen, Zap, Shield, Globe } from "lucide-react";

const PERMISSION_OPTIONS = [
  { id: "read", label: "قراءة البيانات", description: "الوصول لبيانات العقارات والمستأجرين والعقود" },
  { id: "write", label: "كتابة البيانات", description: "إضافة وتعديل البيانات" },
  { id: "payments", label: "المدفوعات", description: "الوصول لبيانات المدفوعات والتحصيل" },
  { id: "maintenance", label: "الصيانة", description: "إدارة طلبات الصيانة" },
  { id: "reports", label: "التقارير", description: "الوصول للتقارير والتحليلات" },
];

const API_ENDPOINTS = [
  { method: "GET", path: "/api/v1/properties", desc: "قائمة العقارات", auth: true },
  { method: "GET", path: "/api/v1/properties/:id", desc: "تفاصيل عقار", auth: true },
  { method: "GET", path: "/api/v1/tenants", desc: "قائمة المستأجرين", auth: true },
  { method: "GET", path: "/api/v1/contracts", desc: "قائمة العقود", auth: true },
  { method: "GET", path: "/api/v1/payments", desc: "قائمة المدفوعات", auth: true },
  { method: "POST", path: "/api/v1/maintenance", desc: "إنشاء طلب صيانة", auth: true },
  { method: "GET", path: "/api/v1/analytics/kpis", desc: "مؤشرات الأداء", auth: true },
  { method: "GET", path: "/api/v1/listings", desc: "الإعلانات العقارية", auth: false },
];

export default function OpenAPI() {
  const baseUrl = `${window.location.origin}/api/v1`;
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<string[]>(["read"]);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"keys" | "docs">("keys");

  const { data: apiKeysList, refetch } = trpc.openApiKeys.list.useQuery();

  const createKey = trpc.openApiKeys.create.useMutation({
    onSuccess: (data) => {
      setGeneratedKey(data.apiKey);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const revokeKey = trpc.openApiKeys.revoke.useMutation({
    onSuccess: () => { toast.success("تم إلغاء المفتاح"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const togglePerm = (perm: string) => {
    setSelectedPerms(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ");
  };

  const methodColor: Record<string, string> = {
    GET: "bg-green-100 text-green-800",
    POST: "bg-blue-100 text-blue-800",
    PUT: "bg-yellow-100 text-yellow-800",
    DELETE: "bg-red-100 text-red-800",
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <Code2 className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">API المفتوح</h1>
            <p className="text-muted-foreground text-sm">إدارة مفاتيح API وتوثيق نقاط النهاية للتكامل مع الأنظمة الخارجية</p>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Shield, title: "أمان عالي", desc: "مفاتيح مشفرة بـ SHA-256 مع صلاحيات محددة", color: "text-green-500" },
          { icon: Zap, title: "أداء سريع", desc: "استجابة فورية مع Rate Limiting ذكي", color: "text-yellow-500" },
          { icon: Globe, title: "توافق واسع", desc: "REST API قياسي يعمل مع أي نظام", color: "text-blue-500" },
        ].map((f, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-start gap-3">
              <f.icon className={`w-8 h-8 ${f.color} shrink-0`} />
              <div>
                <div className="font-semibold">{f.title}</div>
                <div className="text-sm text-muted-foreground">{f.desc}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("keys")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "keys" ? "border-purple-500 text-purple-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Key className="w-4 h-4 inline ml-1" /> مفاتيح API
        </button>
        <button
          onClick={() => setActiveTab("docs")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "docs" ? "border-purple-500 text-purple-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <BookOpen className="w-4 h-4 inline ml-1" /> التوثيق
        </button>
      </div>

      {activeTab === "keys" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">مفاتيح الوصول</h2>
            <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) { setGeneratedKey(null); setNewKeyName(""); setSelectedPerms(["read"]); } }}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 ml-1" /> مفتاح جديد
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl" className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{generatedKey ? "مفتاح API الجديد" : "إنشاء مفتاح API"}</DialogTitle>
                </DialogHeader>
                {generatedKey ? (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800 font-medium mb-2">⚠️ احفظ هذا المفتاح الآن — لن يُعرض مرة أخرى</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs break-all border">
                      {generatedKey}
                    </div>
                    <Button onClick={() => copyToClipboard(generatedKey)} className="w-full">
                      <Copy className="w-4 h-4 ml-1" /> نسخ المفتاح
                    </Button>
                    <Button variant="outline" onClick={() => { setCreateOpen(false); setGeneratedKey(null); }} className="w-full">
                      تم، إغلاق
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>اسم المفتاح *</Label>
                      <Input
                        value={newKeyName}
                        onChange={e => setNewKeyName(e.target.value)}
                        placeholder="مثال: نظام CRM الخارجي"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">الصلاحيات</Label>
                      <div className="space-y-2">
                        {PERMISSION_OPTIONS.map(perm => (
                          <div key={perm.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                            <Checkbox
                              id={perm.id}
                              checked={selectedPerms.includes(perm.id)}
                              onCheckedChange={() => togglePerm(perm.id)}
                            />
                            <div>
                              <label htmlFor={perm.id} className="text-sm font-medium cursor-pointer">{perm.label}</label>
                              <p className="text-xs text-muted-foreground">{perm.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={() => createKey.mutate({ name: newKeyName, permissions: selectedPerms })}
                      disabled={createKey.isPending || !newKeyName || selectedPerms.length === 0}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {createKey.isPending ? "جاري الإنشاء..." : "إنشاء المفتاح"}
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {!apiKeysList || apiKeysList.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Key className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium mb-1">لا توجد مفاتيح API</p>
                <p className="text-sm">أنشئ مفتاحاً للبدء في التكامل مع الأنظمة الخارجية</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {apiKeysList.map((key: any) => (
                <Card key={key.id} className={key.isActive ? "" : "opacity-60"}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {key.isActive ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <div className="font-medium">{key.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{key.keyPrefix}••••••••</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1 flex-wrap">
                          {(key.permissions as string[] ?? []).map((p: string) => (
                            <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {key.createdAt ? new Date(key.createdAt).toLocaleDateString("ar-SA") : "-"}
                        </div>
                        {key.isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => {
                              if (confirm("هل تريد إلغاء هذا المفتاح؟")) {
                                revokeKey.mutate({ id: key.id });
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "docs" && (
        <div className="space-y-6">
          {/* Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4" /> المصادقة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                أضف مفتاح API في رأس كل طلب:
              </p>
              <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm" dir="ltr">
                <div>Authorization: Bearer tk_your_api_key_here</div>
              </div>
              <p className="text-xs text-muted-foreground">
                الحد الأقصى: 100 طلب كل 15 دقيقة لكل مفتاح
              </p>
            </CardContent>
          </Card>

          {/* Base URL */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-4 h-4" /> عنوان القاعدة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-blue-400 rounded-lg p-4 font-mono text-sm flex items-center justify-between" dir="ltr">
                <span>{baseUrl}</span>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(baseUrl)}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4" /> نقاط النهاية المتاحة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {API_ENDPOINTS.map((ep, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors" dir="ltr">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${methodColor[ep.method]}`}>
                      {ep.method}
                    </span>
                    <span className="font-mono text-sm flex-1">{ep.path}</span>
                    <span className="text-xs text-muted-foreground" dir="rtl">{ep.desc}</span>
                    {ep.auth ? (
                      <Badge variant="secondary" className="text-xs">يحتاج مفتاح</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">عام</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Example */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Code2 className="w-4 h-4" /> مثال عملي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm space-y-1" dir="ltr">
                <div className="text-green-400"># جلب قائمة العقارات</div>
                <div>curl -X GET \</div>
                <div className="pr-4">{baseUrl}/properties \</div>
                <div className="pr-4">-H "Authorization: Bearer tk_your_key" \</div>
                <div className="pr-4">-H "Content-Type: application/json"</div>
              </div>
            </CardContent>
          </Card>

          {/* Response Format */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">تنسيق الاستجابة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm" dir="ltr">
                <pre>{`{
  "success": true,
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}`}</pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
