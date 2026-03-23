import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Megaphone, Plus, Eye, Edit, Trash2, Phone, MessageCircle, TrendingUp, Home, Building } from "lucide-react";

export default function PropertyListings() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [form, setForm] = useState({
    propertyId: "",
    title: "",
    description: "",
    listingType: "rent",
    price: "",
    contactPhone: "",
    contactWhatsapp: "",
  });
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    price: "",
    status: "active",
    contactPhone: "",
    contactWhatsapp: "",
  });

  const { data: listings, refetch } = trpc.listings.list.useQuery(
    filterStatus !== "all" ? { status: filterStatus as "active" | "paused" | "rented" | "sold" } : undefined
  );

  const { data: properties } = trpc.properties.list.useQuery({});

  const createListing = trpc.listings.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء الإعلان بنجاح");
      setCreateOpen(false);
      setForm({ propertyId: "", title: "", description: "", listingType: "rent", price: "", contactPhone: "", contactWhatsapp: "" });
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateListing = trpc.listings.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الإعلان");
      setEditOpen(false);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteListing = trpc.listings.delete.useMutation({
    onSuccess: () => { toast.success("تم حذف الإعلان"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const statusMap: Record<string, { label: string; color: string }> = {
    active: { label: "نشط", color: "bg-green-100 text-green-800" },
    paused: { label: "موقوف", color: "bg-yellow-100 text-yellow-800" },
    rented: { label: "مؤجر", color: "bg-blue-100 text-blue-800" },
    sold: { label: "مباع", color: "bg-gray-100 text-gray-800" },
  };

  const typeMap: Record<string, string> = { rent: "إيجار", sale: "بيع" };

  const openEdit = (listing: any) => {
    setEditId(listing.id);
    setEditForm({
      title: listing.title ?? "",
      description: listing.description ?? "",
      price: listing.price ?? "",
      status: listing.status ?? "active",
      contactPhone: listing.contactPhone ?? "",
      contactWhatsapp: listing.contactWhatsapp ?? "",
    });
    setEditOpen(true);
  };

  const activeCount = listings?.filter(l => l.status === "active").length ?? 0;
  const totalViews = listings?.reduce((sum, l) => sum + (l.viewsCount ?? 0), 0) ?? 0;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">إعلانات العقارات</h1>
            <p className="text-muted-foreground text-sm">إدارة إعلانات العقارات الشاغرة والمتاحة للبيع</p>
          </div>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 ml-1" /> إعلان جديد
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="max-w-lg">
            <DialogHeader>
              <DialogTitle>إنشاء إعلان جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <Label>العقار *</Label>
                <Select value={form.propertyId} onValueChange={v => setForm(f => ({ ...f, propertyId: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="اختر العقار" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties?.map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.titleAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>عنوان الإعلان *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="مثال: شقة فاخرة للإيجار في حي النرجس" className="mt-1" />
              </div>
              <div>
                <Label>الوصف</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف تفصيلي للعقار..." className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>نوع الإعلان</Label>
                  <Select value={form.listingType} onValueChange={v => setForm(f => ({ ...f, listingType: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rent">إيجار</SelectItem>
                      <SelectItem value="sale">بيع</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>السعر (ر.س) *</Label>
                  <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0" className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>رقم التواصل</Label>
                  <Input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="05XXXXXXXX" className="mt-1" />
                </div>
                <div>
                  <Label>واتساب</Label>
                  <Input value={form.contactWhatsapp} onChange={e => setForm(f => ({ ...f, contactWhatsapp: e.target.value }))} placeholder="05XXXXXXXX" className="mt-1" />
                </div>
              </div>
              <Button
                onClick={() => createListing.mutate({
                  propertyId: Number(form.propertyId),
                  title: form.title,
                  description: form.description || undefined,
                  listingType: form.listingType as "rent" | "sale",
                  price: Number(form.price),
                  contactPhone: form.contactPhone || undefined,
                  contactWhatsapp: form.contactWhatsapp || undefined,
                })}
                disabled={createListing.isPending || !form.propertyId || !form.title || !form.price}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {createListing.isPending ? "جاري النشر..." : "نشر الإعلان"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الإعلانات", value: listings?.length ?? 0, icon: Megaphone, color: "text-orange-500" },
          { label: "إعلانات نشطة", value: activeCount, icon: TrendingUp, color: "text-green-500" },
          { label: "إجمالي المشاهدات", value: totalViews.toLocaleString("ar-SA"), icon: Eye, color: "text-blue-500" },
          { label: "عقارات مؤجرة", value: listings?.filter(l => l.status === "rented").length ?? 0, icon: Home, color: "text-purple-500" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", "active", "paused", "rented", "sold"].map(s => (
          <Button
            key={s}
            variant={filterStatus === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(s)}
          >
            {s === "all" ? "الكل" : statusMap[s]?.label ?? s}
          </Button>
        ))}
      </div>

      {/* Listings Grid */}
      {!listings || listings.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">لا توجد إعلانات</p>
            <p className="text-sm">انقر على "إعلان جديد" لإضافة إعلان عقاري</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map(listing => (
            <Card key={listing.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusMap[listing.status ?? ""]?.color ?? "bg-gray-100 text-gray-800"}`}>
                        {statusMap[listing.status ?? ""]?.label ?? listing.status}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {typeMap[listing.listingType ?? ""] ?? listing.listingType}
                      </span>
                    </div>
                    <CardTitle className="text-base leading-tight">{listing.title}</CardTitle>
                  </div>
                  <Building className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {listing.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{listing.description}</p>
                )}
                <div className="text-xl font-bold text-orange-600">
                  {Number(listing.price ?? 0).toLocaleString("ar-SA")} ر.س
                  {listing.listingType === "rent" && <span className="text-sm font-normal text-muted-foreground"> / سنة</span>}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {listing.viewsCount ?? 0} مشاهدة</span>
                  {listing.publishedAt && (
                    <span>نُشر: {new Date(listing.publishedAt).toLocaleDateString("ar-SA")}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  {listing.contactPhone && (
                    <a href={`tel:${listing.contactPhone}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full">
                        <Phone className="w-3 h-3 ml-1" /> اتصال
                      </Button>
                    </a>
                  )}
                  {listing.contactWhatsapp && (
                    <a href={`https://wa.me/966${listing.contactWhatsapp.replace(/^0/, "")}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button size="sm" variant="outline" className="w-full text-green-600">
                        <MessageCircle className="w-3 h-3 ml-1" /> واتساب
                      </Button>
                    </a>
                  )}
                  <Button size="sm" variant="outline" onClick={() => openEdit(listing)}>
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => {
                      if (confirm("هل تريد حذف هذا الإعلان؟")) {
                        deleteListing.mutate({ id: listing.id });
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تعديل الإعلان</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>عنوان الإعلان</Label>
              <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>السعر</Label>
                <Input type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>الحالة</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="paused">موقوف</SelectItem>
                    <SelectItem value="rented">مؤجر</SelectItem>
                    <SelectItem value="sold">مباع</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={() => editId && updateListing.mutate({
                id: editId,
                title: editForm.title || undefined,
                description: editForm.description || undefined,
                price: editForm.price ? Number(editForm.price) : undefined,
                status: editForm.status as "active" | "paused" | "rented" | "sold",
                contactPhone: editForm.contactPhone || undefined,
                contactWhatsapp: editForm.contactWhatsapp || undefined,
              })}
              disabled={updateListing.isPending}
              className="w-full"
            >
              {updateListing.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
