import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Trash2, Star, ChevronLeft, ChevronRight, Image as ImageIcon, X } from "lucide-react";

interface PropertyImageGalleryProps {
  propertyId: number;
  isAdmin?: boolean;
  compact?: boolean; // عرض مصغر (3 صور فقط)
}

export default function PropertyImageGallery({ propertyId, isAdmin = false, compact = false }: PropertyImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: images = [], isLoading } = trpc.properties.images.list.useQuery(propertyId);

  const uploadMutation = trpc.properties.images.upload.useMutation({
    onSuccess: () => {
      utils.properties.images.list.invalidate(propertyId);
      toast.success("تم رفع الصورة بنجاح");
      setUploading(false);
    },
    onError: () => { toast.error("فشل رفع الصورة"); setUploading(false); },
  });

  const deleteMutation = trpc.properties.images.delete.useMutation({
    onSuccess: () => { utils.properties.images.list.invalidate(propertyId); toast.success("تم حذف الصورة"); },
  });

  const setPrimaryMutation = trpc.properties.images.setPrimary.useMutation({
    onSuccess: () => { utils.properties.images.list.invalidate(propertyId); toast.success("تم تعيين الصورة الرئيسية"); },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { toast.error(`الملف ${file.name} أكبر من 5MB`); continue; }
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          await uploadMutation.mutateAsync({
            propertyId, base64, filename: file.name,
            mimeType: file.type, isPrimary: images.length === 0,
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const displayImages = compact ? images.slice(0, 4) : images;
  const primaryImage = images.find(img => img.isPrimary) ?? images[0];

  if (isLoading) return <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />;

  if (images.length === 0 && !isAdmin) {
    return (
      <div className="h-40 bg-gray-50 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 border-2 border-dashed border-gray-200">
        <ImageIcon className="h-8 w-8" />
        <span className="text-sm">لا توجد صور</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Image */}
      {images.length > 0 && (
        <div className="relative rounded-xl overflow-hidden bg-gray-100 cursor-pointer group" style={{ aspectRatio: "16/9" }}
          onClick={() => setLightboxIndex(images.indexOf(primaryImage ?? images[0]))}>
          <img src={primaryImage?.url ?? images[0].url} alt="صورة العقار الرئيسية"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              +{images.length - 1} صورة
            </div>
          )}
          {primaryImage?.isPrimary && (
            <Badge className="absolute top-2 right-2 bg-amber-500 text-white border-0 text-xs">
              <Star className="h-3 w-3 ml-1" /> رئيسية
            </Badge>
          )}
        </div>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {displayImages.map((img, i) => (
            <div key={img.id} className="relative group rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
              style={{ aspectRatio: "1" }} onClick={() => setLightboxIndex(i)}>
              <img src={img.url} alt={img.caption ?? `صورة ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200" />
              {isAdmin && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={(e) => { e.stopPropagation(); setPrimaryMutation.mutate({ id: img.id, propertyId }); }}
                    className="p-1 bg-amber-500 rounded-full text-white hover:bg-amber-600">
                    <Star className="h-3 w-3" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(img.id); }}
                    className="p-1 bg-red-500 rounded-full text-white hover:bg-red-600">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
              {img.isPrimary && <div className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full" />}
            </div>
          ))}
          {compact && images.length > 4 && (
            <div className="rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-medium cursor-pointer hover:bg-gray-200"
              style={{ aspectRatio: "1" }} onClick={() => setLightboxIndex(0)}>
              +{images.length - 4}
            </div>
          )}
        </div>
      )}

      {/* Upload Button (Admin only) */}
      {isAdmin && (
        <div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
          <Button variant="outline" size="sm" className="w-full gap-2" disabled={uploading}
            onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" />
            {uploading ? "جاري الرفع..." : "رفع صور"}
          </Button>
          {images.length === 0 && <p className="text-xs text-gray-400 text-center mt-1">الحد الأقصى 5MB لكل صورة</p>}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Dialog open onOpenChange={() => setLightboxIndex(null)}>
          <DialogContent className="max-w-4xl p-0 bg-black border-0">
            <DialogHeader className="absolute top-0 right-0 z-10 p-2">
              <DialogTitle className="sr-only">معرض صور العقار</DialogTitle>
              <button onClick={() => setLightboxIndex(null)} className="p-2 bg-black/50 rounded-full text-white hover:bg-black/80">
                <X className="h-5 w-5" />
              </button>
            </DialogHeader>
            <div className="relative flex items-center justify-center min-h-[60vh]">
              <img src={images[lightboxIndex]?.url} alt={images[lightboxIndex]?.caption ?? ""}
                className="max-h-[80vh] max-w-full object-contain" />
              {lightboxIndex > 0 && (
                <button onClick={() => setLightboxIndex(lightboxIndex - 1)}
                  className="absolute left-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/80">
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}
              {lightboxIndex < images.length - 1 && (
                <button onClick={() => setLightboxIndex(lightboxIndex + 1)}
                  className="absolute right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/80">
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
            </div>
            <div className="flex gap-2 p-3 overflow-x-auto bg-black/80">
              {images.map((img, i) => (
                <img key={img.id} src={img.url} alt="" onClick={() => setLightboxIndex(i)}
                  className={`h-16 w-16 object-cover rounded cursor-pointer flex-shrink-0 transition-all ${i === lightboxIndex ? "ring-2 ring-amber-400 opacity-100" : "opacity-50 hover:opacity-80"}`} />
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
