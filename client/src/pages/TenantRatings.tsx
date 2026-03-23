import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, Users, TrendingUp, Award } from "lucide-react";
import { toast } from "sonner";

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} onClick={() => onChange(s)} type="button">
          <Star className={`w-6 h-6 ${s <= value ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
        </button>
      ))}
    </div>
  );
}

function RatingBadge({ score }: { score: number | null | string }) {
  const n = Number(score || 0);
  const color = n >= 4 ? "bg-green-100 text-green-700" : n >= 3 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";
  const label = n >= 4 ? "ممتاز" : n >= 3 ? "جيد" : n > 0 ? "ضعيف" : "—";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
      {n > 0 ? `${n.toFixed(1)} ★ ${label}` : "—"}
    </span>
  );
}

export default function TenantRatings() {
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ tenantId: 0, contractId: 0, paymentScore: 5, cleanlinessScore: 5, complianceScore: 5, notes: "" });

  const { data: tenants } = trpc.tenants.list.useQuery();
  const { data: ratings, refetch } = trpc.tenantRatings.getByTenant.useQuery(
    { tenantId: selectedTenantId! },
    { enabled: !!selectedTenantId }
  );

  const addRating = trpc.tenantRatings.add.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة التقييم بنجاح");
      setAddOpen(false);
      if (selectedTenantId) refetch();
    },
    onError: () => toast.error("خطأ في الإضافة"),
  });

  const topTenants = (tenants || [])
    .filter((t: any) => Number(t.overallRating) > 0)
    .sort((a: any, b: any) => Number(b.overallRating) - Number(a.overallRating))
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6 rtl" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Star className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">نظام تقييم المستأجرين</h1>
            <p className="text-gray-500 text-sm">تقييم الالتزام والنظافة وانتظام الدفع</p>
          </div>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2">
              <Star className="w-4 h-4" />
              إضافة تقييم
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>تقييم مستأجر</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>رقم المستأجر *</Label>
                  <Input type="number" value={form.tenantId || ""} onChange={e => setForm(f => ({ ...f, tenantId: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>رقم العقد *</Label>
                  <Input type="number" value={form.contractId || ""} onChange={e => setForm(f => ({ ...f, contractId: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <Label>انتظام الدفع</Label>
                <StarRating value={form.paymentScore} onChange={v => setForm(f => ({ ...f, paymentScore: v }))} />
              </div>
              <div>
                <Label>نظافة العقار</Label>
                <StarRating value={form.cleanlinessScore} onChange={v => setForm(f => ({ ...f, cleanlinessScore: v }))} />
              </div>
              <div>
                <Label>الالتزام بالعقد</Label>
                <StarRating value={form.complianceScore} onChange={v => setForm(f => ({ ...f, complianceScore: v }))} />
              </div>
              <div>
                <Label>ملاحظات</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
              </div>
              <Button
                className="w-full bg-amber-600 hover:bg-amber-700"
                onClick={() => addRating.mutate(form)}
                disabled={!form.tenantId || !form.contractId || addRating.isPending}
              >
                {addRating.isPending ? "جاري الحفظ..." : "حفظ التقييم"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Top Tenants */}
      {topTenants.length > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-l from-amber-50 to-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <Award className="w-5 h-5" />
              أفضل المستأجرين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topTenants.map((t, i) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-gray-300 text-gray-700" : "bg-orange-300 text-white"}`}>
                      {i + 1}
                    </span>
                    <span className="font-medium">{t.name}</span>
                  </div>
                  <RatingBadge score={t.overallRating} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tenants Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            قائمة المستأجرين وتقييماتهم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-right p-3 font-medium text-gray-600">المستأجر</th>
                  <th className="text-right p-3 font-medium text-gray-600">الجوال</th>
                  <th className="text-right p-3 font-medium text-gray-600">انتظام الدفع</th>
                  <th className="text-right p-3 font-medium text-gray-600">النظافة</th>
                  <th className="text-right p-3 font-medium text-gray-600">الالتزام</th>
                  <th className="text-right p-3 font-medium text-gray-600">الإجمالي</th>
                  <th className="text-right p-3 font-medium text-gray-600">سجل التقييمات</th>
                </tr>
              </thead>
              <tbody>
                {(tenants || []).map(t => (
                  <tr key={t.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-medium">{t.name}</td>
                    <td className="p-3 text-gray-600" dir="ltr">{t.phone}</td>
                    <td className="p-3"><RatingBadge score={t.paymentRating} /></td>
                    <td className="p-3"><RatingBadge score={t.propertyRating} /></td>
                    <td className="p-3"><RatingBadge score={t.cooperationRating} /></td>
                    <td className="p-3"><RatingBadge score={t.overallRating} /></td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setSelectedTenantId(t.id); }}
                        className="text-xs"
                      >
                        عرض السجل
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Rating History Dialog */}
      {selectedTenantId && (
        <Card className="border-0 shadow-sm border-r-4 border-r-amber-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                سجل تقييمات المستأجر #{selectedTenantId}
              </CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setSelectedTenantId(null)}>✕</Button>
            </div>
          </CardHeader>
          <CardContent>
            {!ratings || ratings.length === 0 ? (
              <p className="text-gray-400 text-center py-4">لا توجد تقييمات مسجلة</p>
            ) : (
              <div className="space-y-3">
                {ratings.map(r => (
                  <div key={r.id} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("ar-SA")}</span>
                      <RatingBadge score={r.overallScore} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>دفع: <span className="font-medium">{r.paymentScore}/5</span></div>
                      <div>نظافة: <span className="font-medium">{r.cleanlinessScore}/5</span></div>
                      <div>التزام: <span className="font-medium">{r.complianceScore}/5</span></div>
                    </div>
                    {r.notes && <p className="text-xs text-gray-600 mt-2">{r.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
