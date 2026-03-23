import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Phone, Mail, Users, Calendar, Plus, Clock } from "lucide-react";
import { toast } from "sonner";

const noteTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  call: { label: "مكالمة", icon: Phone, color: "bg-blue-100 text-blue-700" },
  meeting: { label: "اجتماع", icon: Users, color: "bg-purple-100 text-purple-700" },
  email: { label: "بريد", icon: Mail, color: "bg-yellow-100 text-yellow-700" },
  whatsapp: { label: "واتساب", icon: MessageSquare, color: "bg-green-100 text-green-700" },
  other: { label: "أخرى", icon: MessageSquare, color: "bg-gray-100 text-gray-700" },
};

export default function ClientNotes() {
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState<{ leadId?: number; ownerId?: number; tenantId?: number }>({});
  const [form, setForm] = useState({
    note: "",
    noteType: "call" as "call" | "meeting" | "email" | "whatsapp" | "other",
    followUpDate: "",
    leadId: undefined as number | undefined,
    ownerId: undefined as number | undefined,
    tenantId: undefined as number | undefined,
  });

  const { data: notes, refetch } = trpc.clientNotes.get.useQuery(filter);
  const { data: followUps } = trpc.clientNotes.getFollowUps.useQuery();

  const addNote = trpc.clientNotes.add.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الملاحظة بنجاح");
      setAddOpen(false);
      setForm({ note: "", noteType: "call", followUpDate: "", leadId: undefined, ownerId: undefined, tenantId: undefined });
      refetch();
    },
    onError: () => toast.error("خطأ في الإضافة"),
  });

  return (
    <div className="p-6 space-y-6 rtl" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">سجل المحادثات والملاحظات</h1>
            <p className="text-gray-500 text-sm">تتبع كل تواصل مع العملاء والملاك والمستأجرين</p>
          </div>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2">
              <Plus className="w-4 h-4" />
              إضافة ملاحظة
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة ملاحظة جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>نوع التواصل</Label>
                <Select value={form.noteType} onValueChange={v => setForm(f => ({ ...f, noteType: v as typeof form.noteType }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(noteTypeConfig).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الملاحظة *</Label>
                <Textarea
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="اكتب ملاحظاتك هنا..."
                  rows={4}
                />
              </div>
              <div>
                <Label>تاريخ المتابعة (اختياري)</Label>
                <Input
                  type="date"
                  value={form.followUpDate}
                  onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">رقم العميل</Label>
                  <Input
                    type="number"
                    placeholder="Lead ID"
                    onChange={e => setForm(f => ({ ...f, leadId: e.target.value ? Number(e.target.value) : undefined }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">رقم المالك</Label>
                  <Input
                    type="number"
                    placeholder="Owner ID"
                    onChange={e => setForm(f => ({ ...f, ownerId: e.target.value ? Number(e.target.value) : undefined }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">رقم المستأجر</Label>
                  <Input
                    type="number"
                    placeholder="Tenant ID"
                    onChange={e => setForm(f => ({ ...f, tenantId: e.target.value ? Number(e.target.value) : undefined }))}
                  />
                </div>
              </div>
              <Button
                className="w-full bg-teal-600 hover:bg-teal-700"
                onClick={() => addNote.mutate({
                  ...form,
                  followUpDate: form.followUpDate ? new Date(form.followUpDate).getTime() : undefined,
                })}
                disabled={!form.note || addNote.isPending}
              >
                {addNote.isPending ? "جاري الحفظ..." : "حفظ الملاحظة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Follow-ups Alert */}
      {followUps && followUps.length > 0 && (
        <Card className="border-0 shadow-sm bg-amber-50 border-r-4 border-r-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-800 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              متابعات مستحقة اليوم ({followUps.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {followUps.slice(0, 3).map(n => (
                <div key={n.id} className="flex items-center gap-2 text-sm text-amber-700">
                  <Calendar className="w-3 h-3" />
                  <span>{n.note.substring(0, 80)}...</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">سجل الملاحظات ({notes?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!notes || notes.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد ملاحظات بعد</p>
              <p className="text-sm">ابدأ بتسجيل محادثاتك مع العملاء</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map(note => {
                const typeInfo = noteTypeConfig[note.noteType] || noteTypeConfig.other;
                const TypeIcon = typeInfo.icon;
                return (
                  <div key={note.id} className="flex gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${typeInfo.color}`}>
                      <TypeIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                        <span className="text-xs text-gray-400">{new Date(note.createdAt).toLocaleDateString("ar-SA")}</span>
                        {note.followUpDate && (
                          <span className="text-xs text-amber-600 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            متابعة: {new Date(note.followUpDate).toLocaleDateString("ar-SA")}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{note.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
