import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Code, Play, ChevronDown, ChevronUp, Key, Globe } from "lucide-react";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-100 text-green-700 border-green-200",
  POST: "bg-blue-100 text-blue-700 border-blue-200",
  PUT: "bg-amber-100 text-amber-700 border-amber-200",
  DELETE: "bg-red-100 text-red-700 border-red-200",
};

const API_ENDPOINTS = [
  {
    group: "العقارات",
    endpoints: [
      { method: "GET", path: "/api/v1/properties", desc: "قائمة جميع العقارات", params: [], auth: true },
      { method: "GET", path: "/api/v1/properties/:id", desc: "تفاصيل عقار محدد", params: [{ name: "id", type: "number", required: true, desc: "معرف العقار" }], auth: true },
    ],
  },
  {
    group: "المستأجرون",
    endpoints: [
      { method: "GET", path: "/api/v1/tenants", desc: "قائمة جميع المستأجرين", params: [], auth: true },
      { method: "GET", path: "/api/v1/tenants/:id", desc: "تفاصيل مستأجر محدد", params: [{ name: "id", type: "number", required: true, desc: "معرف المستأجر" }], auth: true },
    ],
  },
  {
    group: "المدفوعات",
    endpoints: [
      { method: "GET", path: "/api/v1/payments", desc: "قائمة المدفوعات", params: [{ name: "limit", type: "number", required: false, desc: "عدد النتائج (افتراضي: 50)" }, { name: "offset", type: "number", required: false, desc: "تخطي النتائج" }], auth: true },
      { method: "POST", path: "/api/v1/payments", desc: "تسجيل دفعة جديدة", params: [{ name: "contractId", type: "number", required: true, desc: "معرف العقد" }, { name: "amount", type: "number", required: true, desc: "المبلغ" }, { name: "paidDate", type: "string", required: true, desc: "تاريخ الدفع (YYYY-MM-DD)" }], auth: true },
    ],
  },
  {
    group: "العقود",
    endpoints: [
      { method: "GET", path: "/api/v1/contracts", desc: "قائمة العقود النشطة", params: [], auth: true },
      { method: "GET", path: "/api/v1/contracts/:id", desc: "تفاصيل عقد محدد", params: [{ name: "id", type: "number", required: true, desc: "معرف العقد" }], auth: true },
    ],
  },
  {
    group: "الإعلانات",
    endpoints: [
      { method: "GET", path: "/api/v1/listings", desc: "قائمة الإعلانات العامة", params: [], auth: false },
      { method: "GET", path: "/api/v1/listings/:id", desc: "تفاصيل إعلان محدد", params: [{ name: "id", type: "number", required: true, desc: "معرف الإعلان" }], auth: false },
    ],
  },
];

export default function SwaggerDocs() {
  const [apiKey, setApiKey] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ "العقارات": true });
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { loading: boolean; result: string }>>({});

  const { data: myKeys } = trpc.openApiKeys.list.useQuery();

  const handleTestFetch = async (path: string, method: string, key: string) => {
    try {
      const res = await fetch(path, { headers: { "X-API-Key": key } });
      const json = await res.json();
      setTestResults(p => ({ ...p, [path]: { loading: false, result: JSON.stringify(json, null, 2) } }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setTestResults(p => ({ ...p, [path]: { loading: false, result: `خطأ: ${msg}` } }));
    }
  };

  const handleTest = (path: string, method: string) => {
    if (!apiKey && !myKeys?.[0]?.keyPrefix) {
      toast.error("أدخل مفتاح API أولاً");
      return;
    }
    const key = apiKey || myKeys?.[0]?.keyPrefix || "";
    setTestResults(p => ({ ...p, [path]: { loading: true, result: "" } }));
    handleTestFetch(path, method, key);
  };

  const toggleGroup = (group: string) => setExpandedGroups(p => ({ ...p, [group]: !p[group] }));
  const toggleEndpoint = (key: string) => setExpandedEndpoints(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">توثيق API التفاعلي</h1>
        <p className="text-muted-foreground mt-1">استعرض وجرّب جميع endpoints المتاحة في API المفتوح</p>
      </div>

      {/* API Key Input */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-3">
            <Key className="h-5 w-5 text-blue-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">مفتاح API للاختبار</p>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="أدخل مفتاح API أو اختر من مفاتيحك..."
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="h-8 text-sm font-mono"
                />
                {myKeys?.[0]?.keyPrefix && (
                  <Button size="sm" variant="outline" className="shrink-0 text-xs"
                    onClick={() => setApiKey(myKeys![0].keyPrefix)}>
                    استخدام مفتاحي
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Base URL */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Base URL:</span>
            <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{window.location.origin}/api/v1</code>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            أضف الـ header: <code className="bg-muted px-1 rounded">X-API-Key: your_key</code> لجميع الطلبات المحمية
          </p>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <div className="space-y-3">
        {API_ENDPOINTS.map(group => (
          <Card key={group.group}>
            <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleGroup(group.group)}>
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-purple-500" />
                  {group.group}
                  <Badge variant="outline" className="text-xs">{group.endpoints.length} endpoints</Badge>
                </div>
                {expandedGroups[group.group] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CardTitle>
            </CardHeader>

            {expandedGroups[group.group] && (
              <CardContent className="space-y-2 pt-0">
                {group.endpoints.map(ep => {
                  const epKey = `${ep.method}:${ep.path}`;
                  const isExpanded = expandedEndpoints[epKey];
                  const testResult = testResults[ep.path];

                  return (
                    <div key={epKey} className="rounded-lg border overflow-hidden">
                      <div
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => toggleEndpoint(epKey)}
                      >
                        <Badge className={`text-xs font-mono border ${METHOD_COLORS[ep.method] || ""}`}>
                          {ep.method}
                        </Badge>
                        <code className="text-sm font-mono flex-1">{ep.path}</code>
                        <span className="text-xs text-muted-foreground hidden md:block">{ep.desc}</span>
                        {ep.auth ? (
                          <Badge variant="outline" className="text-xs border-amber-200 text-amber-600">🔒 مصادقة</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs border-green-200 text-green-600">🌐 عام</Badge>
                        )}
                        {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                      </div>

                      {isExpanded && (
                        <div className="border-t bg-muted/10 p-4 space-y-4">
                          <p className="text-sm text-muted-foreground">{ep.desc}</p>

                          {ep.params.length > 0 && (
                            <div>
                              <p className="text-xs font-medium mb-2">المعاملات:</p>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b">
                                    <th className="p-1.5 text-right font-medium">الاسم</th>
                                    <th className="p-1.5 text-right font-medium">النوع</th>
                                    <th className="p-1.5 text-right font-medium">مطلوب</th>
                                    <th className="p-1.5 text-right font-medium">الوصف</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {ep.params.map(p => (
                                    <tr key={p.name} className="border-b last:border-0">
                                      <td className="p-1.5 font-mono text-blue-600">{p.name}</td>
                                      <td className="p-1.5 text-muted-foreground">{p.type}</td>
                                      <td className="p-1.5">{p.required ? <span className="text-red-500">نعم</span> : <span className="text-green-600">لا</span>}</td>
                                      <td className="p-1.5 text-muted-foreground">{p.desc}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          <Button
                            size="sm"
                            className="gap-2"
                            disabled={testResult?.loading}
                            onClick={() => handleTest(ep.path, ep.method)}
                          >
                            <Play className="h-3.5 w-3.5" />
                            {testResult?.loading ? "جاري الاختبار..." : "تجربة الـ Endpoint"}
                          </Button>

                          {testResult?.result && (
                            <div>
                              <p className="text-xs font-medium mb-1">النتيجة:</p>
                              <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-auto max-h-48 font-mono">
                                {testResult.result}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
