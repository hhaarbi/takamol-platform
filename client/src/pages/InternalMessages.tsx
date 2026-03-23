import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mail, Send, Inbox, Plus, Eye } from "lucide-react";

export default function InternalMessages() {

  const [activeTab, setActiveTab] = useState("inbox");
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<any>(null);
  const [composeForm, setComposeForm] = useState({ toUserId: "", subject: "", body: "" });

  const inbox = trpc.messages.inbox.useQuery();
  const sent = trpc.messages.sent.useQuery();
  const unread = trpc.messages.unreadCount.useQuery();
  const utils = trpc.useUtils();

  const sendMsg = trpc.messages.send.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال الرسالة بنجاح");
      utils.messages.sent.invalidate();
      setShowCompose(false);
      setComposeForm({ toUserId: "", subject: "", body: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const markRead = trpc.messages.markRead.useMutation({
    onSuccess: () => { utils.messages.inbox.invalidate(); utils.messages.unreadCount.invalidate(); },
  });

  const openMessage = (msg: any) => {
    setSelectedMsg(msg);
    if (!msg.isRead && activeTab === "inbox") markRead.mutate(msg.id);
  };

  const inboxList = inbox.data ?? [];
  const sentList = sent.data ?? [];
  const unreadCount = unread.data ?? 0;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Mail className="w-6 h-6" />
            الرسائل الداخلية
            {unreadCount > 0 && <Badge className="bg-red-500 text-white">{unreadCount}</Badge>}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">التواصل الداخلي بين أعضاء الفريق</p>
        </div>
        <Button onClick={() => setShowCompose(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          رسالة جديدة
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="w-4 h-4" />
            الوارد ({inboxList.length})
            {unreadCount > 0 && <Badge className="bg-red-500 text-white text-xs px-1">{unreadCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <Send className="w-4 h-4" />
            المرسل ({sentList.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox">
          <Card>
            <CardContent className="p-0">
              {inboxList.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد رسائل واردة</p>
                </div>
              ) : (
                <div className="divide-y">
                  {inboxList.map(msg => (
                    <div
                      key={msg.id}
                      className={`p-4 cursor-pointer hover:bg-muted/30 transition-colors flex items-start gap-3 ${!msg.isRead ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}
                      onClick={() => openMessage(msg)}
                    >
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!msg.isRead ? "bg-blue-500" : "bg-transparent"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`font-medium text-sm ${!msg.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                            {msg.subject ?? "(بدون موضوع)"}
                          </span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {new Date(msg.createdAt).toLocaleDateString("ar-SA")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{msg.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent">
          <Card>
            <CardContent className="p-0">
              {sentList.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Send className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد رسائل مرسلة</p>
                </div>
              ) : (
                <div className="divide-y">
                  {sentList.map(msg => (
                    <div
                      key={msg.id}
                      className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setSelectedMsg(msg)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm">{msg.subject ?? "(بدون موضوع)"}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.createdAt).toLocaleDateString("ar-SA")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{msg.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Compose Dialog */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>رسالة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">إلى (معرف المستخدم) *</label>
              <Input
                value={composeForm.toUserId}
                onChange={e => setComposeForm(f => ({ ...f, toUserId: e.target.value }))}
                placeholder="أدخل رقم المستخدم"
                type="number"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الموضوع</label>
              <Input
                value={composeForm.subject}
                onChange={e => setComposeForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="موضوع الرسالة"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">نص الرسالة *</label>
              <Textarea
                value={composeForm.body}
                onChange={e => setComposeForm(f => ({ ...f, body: e.target.value }))}
                placeholder="اكتب رسالتك هنا..."
                rows={5}
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 gap-2"
                disabled={sendMsg.isPending || !composeForm.toUserId || !composeForm.body}
                onClick={() => sendMsg.mutate({ toUserId: Number(composeForm.toUserId), subject: composeForm.subject || undefined, body: composeForm.body })}
              >
                <Send className="w-4 h-4" />
                {sendMsg.isPending ? "جاري الإرسال..." : "إرسال"}
              </Button>
              <Button variant="outline" onClick={() => setShowCompose(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Message Dialog */}
      <Dialog open={!!selectedMsg} onOpenChange={(o) => { if (!o) setSelectedMsg(null); }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {selectedMsg?.subject ?? "(بدون موضوع)"}
            </DialogTitle>
          </DialogHeader>
          {selectedMsg && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>التاريخ: {new Date(selectedMsg.createdAt).toLocaleString("ar-SA")}</span>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap">{selectedMsg.body}</div>
              <Button variant="outline" className="w-full" onClick={() => { setSelectedMsg(null); setShowCompose(true); setComposeForm(f => ({ ...f, toUserId: String(selectedMsg.fromUserId ?? ""), subject: `رد: ${selectedMsg.subject ?? ""}` })); }}>
                الرد على هذه الرسالة
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
