import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Phone, Search } from "lucide-react";

export default function PublicListings() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priceMax, setPriceMax] = useState("");

  const listings = trpc.listings.list.useQuery({ status: "active" });
  const trackView = trpc.listingViews.track.useMutation();

  const list = (listings.data ?? []).filter(l => {
    const matchSearch = !search || l.title.includes(search);
    const matchType = typeFilter === "all";
    const matchPrice = !priceMax || Number(l.price) <= Number(priceMax);
    return matchSearch && matchType && matchPrice;
  });

  const handleView = (id: number) => {
    trackView.mutate({ listingId: id, source: "public" });
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-12 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-3">العقارات المتاحة للإيجار</h1>
          <p className="text-primary-foreground/80">اعثر على العقار المناسب لك من بين وحداتنا المتاحة</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو الموقع..."
                className="pr-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="نوع العقار" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="apartment">شقة</SelectItem>
                <SelectItem value="villa">فيلا</SelectItem>
                <SelectItem value="office">مكتب</SelectItem>
                <SelectItem value="shop">محل تجاري</SelectItem>
                <SelectItem value="warehouse">مستودع</SelectItem>
                <SelectItem value="land">أرض</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={priceMax}
              onChange={e => setPriceMax(e.target.value)}
              placeholder="الحد الأقصى للسعر"
              type="number"
              className="w-44"
            />
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {listings.isLoading ? (
          <div className="text-center py-16 text-muted-foreground">جاري التحميل...</div>
        ) : list.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد عقارات متاحة حالياً</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-4">{list.length} عقار متاح</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {list.map(listing => (
                <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow" onClick={() => handleView(listing.id)}>
                  {false ? (
                    <img src="" alt={listing.title} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-foreground leading-tight">{listing.title}</h3>
                      <Badge className="bg-green-100 text-green-700 text-xs flex-shrink-0">متاح</Badge>
                    </div>

                    {listing.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{listing.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span className="capitalize">{listing.listingType === 'rent' ? 'إيجار' : 'بيع'}</span>
                    </div>
                    <div className="border-t pt-3 flex items-center justify-between">
                      <div>
                        <div className="text-lg font-bold text-primary">{Number(listing.price).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">ر.س</span></div>
                      </div>
                      {listing.contactPhone && (
                        <a href={`tel:${listing.contactPhone}`} className="flex items-center gap-1 text-sm text-primary hover:underline" onClick={e => e.stopPropagation()}>
                          <Phone className="w-3 h-3" />
                          {listing.contactPhone}
                        </a>
                      )}
                    </div>
                    {listing.viewsCount > 0 && (
                      <div className="text-xs text-muted-foreground mt-2">{listing.viewsCount} مشاهدة</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
