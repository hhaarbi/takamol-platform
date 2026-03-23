import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapView } from "@/components/Map";
import { MapPin, Building2, TrendingUp, Home } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  available: "#22c55e",
  rented: "#3b82f6",
  sold: "#8b5cf6",
  under_management: "#f59e0b",
  reserved: "#f97316",
  inactive: "#9ca3af",
};

const STATUS_LABELS: Record<string, string> = {
  available: "شاغر",
  rented: "مؤجر",
  sold: "مباع",
  under_management: "تحت الإدارة",
  reserved: "محجوز",
  inactive: "غير نشط",
};

export default function GeoStats() {
  const { data } = trpc.geoStats.useQuery();
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);

  const handleMapReady = (map: any) => {
    setMapInstance(map);
    setMapReady(true);
    if (data?.propertiesWithCoords?.length) {
      addMarkers(map, data.propertiesWithCoords);
    }
  };

  const addMarkers = (map: any, properties: any[]) => {
    const google = (window as any).google;
    if (!google) return;
    properties.forEach(prop => {
      const marker = new google.maps.Marker({
        position: { lat: prop.lat, lng: prop.lng },
        map,
        title: prop.title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: STATUS_COLORS[prop.status] ?? "#9ca3af",
          fillOpacity: 0.9,
          strokeWeight: 2,
          strokeColor: "#ffffff",
        },
      });
      const infoWindow = new google.maps.InfoWindow({
        content: `<div dir="rtl" style="font-family: sans-serif; min-width: 150px;">
          <strong>${prop.title}</strong><br/>
          <span style="color: ${STATUS_COLORS[prop.status]}">${STATUS_LABELS[prop.status] ?? prop.status}</span><br/>
          <small>${prop.district ?? ""}</small><br/>
          <small>${Number(prop.price).toLocaleString("ar-SA")} ر.س</small>
        </div>`,
      });
      marker.addListener("click", () => infoWindow.open(map, marker));
    });
    // Center on Madinah
    map.setCenter({ lat: 24.4672, lng: 39.6024 });
    map.setZoom(12);
  };

  const filteredDistricts = selectedDistrict
    ? data?.districts.filter(d => d.name === selectedDistrict) ?? []
    : data?.districts ?? [];

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><MapPin className="h-6 w-6 text-red-500" /> الإحصائيات الجغرافية</h1>
        <p className="text-muted-foreground mt-1">توزيع العقارات على خريطة المدينة المنورة مع مؤشرات الأداء</p>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{data?.totalProperties ?? 0}</p><p className="text-xs text-muted-foreground">إجمالي العقارات</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{data?.propertiesWithCoords?.length ?? 0}</p><p className="text-xs text-muted-foreground">مرتبطة بالخريطة</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-purple-600">{data?.districts?.length ?? 0}</p><p className="text-xs text-muted-foreground">أحياء</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">
            {data?.districts?.reduce((s, d) => s + d.revenue, 0).toLocaleString("ar-SA") ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* الخريطة */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="pb-0"><CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" /> خريطة توزيع العقارات</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="h-[500px]">
                <MapView onMapReady={handleMapReady} />
              </div>
              {/* مفتاح الألوان */}
              <div className="p-3 border-t flex flex-wrap gap-3 text-xs">
                {Object.entries(STATUS_LABELS).map(([status, label]) => (
                  <div key={status} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* إحصائيات الأحياء */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" /> الأحياء</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {(data?.districts ?? []).map(district => (
                  <div
                    key={district.name}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedDistrict === district.name ? "bg-blue-50 border-blue-200" : "hover:bg-muted/50"}`}
                    onClick={() => setSelectedDistrict(selectedDistrict === district.name ? null : district.name)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{district.name}</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{district.count} عقار</span>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span className="text-green-600">✓ {district.rented} مؤجر</span>
                      <span className="text-orange-500">○ {district.vacant} شاغر</span>
                    </div>
                    {district.revenue > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                        <TrendingUp className="h-3 w-3" />
                        <span>{district.revenue.toLocaleString("ar-SA")} ر.س</span>
                      </div>
                    )}
                  </div>
                ))}
                {(data?.districts?.length ?? 0) === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Home className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">لا توجد بيانات أحياء</p>
                    <p className="text-xs mt-1">أضف إحداثيات للعقارات لرؤية التوزيع</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
