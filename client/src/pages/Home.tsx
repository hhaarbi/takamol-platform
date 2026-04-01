import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { nanoid } from "nanoid";
import {
  Building2, MessageCircle, X, Send, Phone, MapPin,
  Bed, Bath, Maximize2, Star, ChevronDown,
  TrendingUp, Shield, Users, LayoutDashboard, Menu,
  KeyRound, Wrench, FileText, CheckCircle2, ChevronUp,
  Award, Clock, HeartHandshake, ArrowLeft, Eye, Home,
  Instagram, Twitter, Facebook, Youtube, Quote, LogIn,
} from "lucide-react";
import { getLoginUrl } from "@/const";

const WHATSAPP = "966558018151";
const OG_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663082433191/EGvRBfpqPGe26TFrJFv9dm/og-image-JZJVCTb8zj6RBGET4uyejN.png";

function formatPrice(price: string | number, unit: string) {
  const n = Number(price).toLocaleString("ar-SA");
  if (unit === "per_month") return `${n} ر.س / شهر`;
  if (unit === "per_year") return `${n} ر.س / سنة`;
  return `${n} ر.س`;
}

const TYPE_LABELS: Record<string, string> = {
  apartment: "شقة", villa: "فيلا", land: "أرض",
  commercial: "تجاري", office: "مكتب", warehouse: "مستودع",
};

const TESTIMONIALS = [
  { name: "أحمد الغامدي", role: "مالك عقار", rating: 5, text: "تعاملت مع تكامل لإدارة عقاراتي منذ 3 سنوات، والنتائج تفوق التوقعات. تحصيل الإيجارات منتظم ومتابعة الصيانة ممتازة.", avatar: "أ" },
  { name: "سارة المطيري", role: "مستأجرة", rating: 5, text: "بوابة المستأجر رائعة جداً! أستطيع متابعة عقدي ومدفوعاتي بكل سهولة دون الحاجة للتواصل المستمر مع الإدارة.", avatar: "س" },
  { name: "محمد العتيبي", role: "مشتري عقار", rating: 5, text: "ساعدني فريق تكامل في إيجاد الشقة المناسبة بالمدينة المنورة بسعر عادل وإجراءات سريعة. أنصح الجميع بالتعامل معهم.", avatar: "م" },
  { name: "فاطمة الزهراني", role: "مستثمرة عقارية", rating: 5, text: "إدارة محترفة وشفافة. التقارير الشهرية مفصّلة وتساعدني في اتخاذ قرارات استثمارية صحيحة. شكراً لفريق تكامل.", avatar: "ف" },
];

const FAQ_ITEMS = [
  { q: "كيف يمكنني تأجير عقاري عبر تكامل؟", a: "تواصل معنا عبر واتساب أو المساعد الذكي، وسيقوم فريقنا بزيارة العقار وتقييمه وتسويقه والعثور على المستأجر المناسب خلال أسرع وقت." },
  { q: "ما هي رسوم إدارة الأملاك؟", a: "رسومنا تنافسية وتعتمد على نوع الخدمة المطلوبة. تواصل معنا للحصول على عرض سعر مخصص لعقارك." },
  { q: "كيف أتحقق من تفاصيل عقدي كمستأجر؟", a: "ادخل إلى بوابة المستأجر وأدخل رقم عقدك للاطلاع على جميع التفاصيل والمدفوعات وتقديم طلبات الصيانة." },
  { q: "هل تقدمون خدمات في جميع أحياء المدينة المنورة؟", a: "نعم، نغطي جميع أحياء المدينة المنورة ونمتلك معرفة واسعة بالسوق العقاري في كافة المناطق." },
  { q: "كم يستغرق بيع العقار؟", a: "يعتمد ذلك على نوع العقار وسعره، لكن في المتوسط نُتمّ صفقات البيع خلال 30-90 يوماً من بدء التسويق." },
];

export default function HomePage() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [inputText, setInputText] = useState("");
  const [sessionId] = useState(() => `web_${nanoid()}`);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [listingFilter, setListingFilter] = useState<"all" | "sale" | "rent">("all");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const propertiesQuery = trpc.properties.list.useQuery({
    listingType: listingFilter === "all" ? undefined : listingFilter,
    limit: 6,
  });

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      setIsTyping(false);
    },
    onError: () => {
      setMessages((prev) => [...prev, { role: "assistant", content: "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى." }]);
      setIsTyping(false);
    },
  });

  useEffect(() => {
    document.title = "تكامل لإدارة الأملاك - عقارات المدينة المنورة";
    return () => { document.title = "تكامل لإدارة الأملاك"; };
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  useEffect(() => {
    if (chatOpen && messages.length === 0) {
      setMessages([{ role: "assistant", content: "🌟 أهلاً وسهلاً بك في تكامل لإدارة الأملاك!\n\nأنا مساعدك العقاري الذكي، يسعدني مساعدتك في:\n• 🏠 شراء أو بيع عقار\n• 🔑 إيجار أو تأجير\n• 📊 إدارة أملاكك\n\nكيف يمكنني مساعدتك اليوم؟" }]);
    }
  }, [chatOpen]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSend = () => {
    if (!inputText.trim() || isTyping) return;
    const msg = inputText.trim();
    setInputText("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setIsTyping(true);
    sendMessageMutation.mutate({ sessionId, message: msg });
  };

  const properties = propertiesQuery.data || [];

  return (
    <div className="min-h-screen bg-background" dir="rtl">

      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="/" className="flex items-center group">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663082433191/EGvRBfpqPGe26TFrJFv9dm/logo-transparent_332d78c3.png"
                alt="تكامل لإدارة الأملاك"
                className="h-10 w-auto object-contain group-hover:opacity-90 transition-opacity"
              />
            </a>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#properties" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">العقارات</a>
              <a href="#services" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">خدماتنا</a>
              <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">آراء العملاء</a>
              <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">عن الشركة</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">الباقات</a>
              <a href="/tenant-portal" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 font-medium">
                <KeyRound size={14} />بوابة المستأجر
              </a>
              <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition-colors shadow-sm">
                <Phone size={14} />واتساب
              </a>
              {isAuthenticated ? (
                <Button size="sm" variant="outline" onClick={() => navigate("/dashboard")} className="flex items-center gap-1.5">
                  <LayoutDashboard size={14} />لوحة التحكم
                </Button>
              ) : (
                <a href={getLoginUrl()} className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors shadow-sm">
                  <LogIn size={14} />تسجيل الدخول
                </a>
              )}
            </div>

            {/* Mobile Toggle */}
            <button className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-1 border-t border-border pt-4 animate-in slide-in-from-top-2">
              <a href="#properties" className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                <Home size={15} />العقارات
              </a>
              <a href="#services" className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                <Award size={15} />خدماتنا
              </a>
              <a href="/tenant-portal" className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                <KeyRound size={15} />بوابة المستأجر
              </a>
              <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-green-600 hover:bg-green-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                <Phone size={15} />تواصل عبر واتساب
              </a>
              {isAuthenticated ? (
                <button className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-primary font-medium hover:bg-primary/5 rounded-lg"
                  onClick={() => { navigate("/dashboard"); setMobileMenuOpen(false); }}>
                  <LayoutDashboard size={15} />لوحة التحكم
                </button>
              ) : (
                <a href={getLoginUrl()} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-bold text-amber-600 hover:bg-amber-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                  <LogIn size={15} />تسجيل الدخول
                </a>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-amber-500/8 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-amber-700/10 blur-3xl" />
          {/* Islamic geometric pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f59e0b' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="container relative z-10 pt-20 pb-16 md:pt-28 md:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold mb-6">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                المدينة المنورة، المملكة العربية السعودية
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6">
                شريكك الموثوق في
                <span className="block bg-gradient-to-l from-amber-300 to-amber-500 bg-clip-text text-transparent mt-1">
                  إدارة الأملاك
                </span>
              </h1>
              <p className="text-lg text-white/65 mb-8 leading-relaxed max-w-lg">
                نقدم لك أفضل الخدمات العقارية في المدينة المنورة — من البيع والشراء إلى الإيجار وإدارة الأملاك بكل احترافية وشفافية.
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                <Button size="lg" className="gold-gradient text-white font-bold px-8 shadow-lg hover:opacity-90 hover:shadow-amber-500/25 transition-all"
                  onClick={() => setChatOpen(true)}>
                  <MessageCircle size={18} className="ml-2" />تحدث مع المساعد الذكي
                </Button>
                <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 shadow-lg transition-all">
                    <Phone size={18} className="ml-2" />واتساب مباشر
                  </Button>
                </a>
              </div>
              {/* Trust badges */}
              <div className="flex flex-wrap gap-4 text-xs text-white/50">
                <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-400" />رخصة فال معتمدة</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-400" />عضو الهيئة العقارية</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-400" />فواتير إلكترونية ZATCA</span>
              </div>
            </div>

            {/* Right: Stats grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "عقار مُسوَّق", value: "500+", icon: <Building2 size={22} />, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                { label: "عميل راضٍ", value: "1200+", icon: <Users size={22} />, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
                { label: "سنوات خبرة", value: "5+", icon: <Award size={22} />, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
                { label: "صفقة ناجحة", value: "300+", icon: <HeartHandshake size={22} />, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
              ].map((stat) => (
                <div key={stat.label} className={`p-6 rounded-2xl border ${stat.bg} backdrop-blur text-center hover:scale-105 transition-transform cursor-default`}>
                  <div className={`${stat.color} flex justify-center mb-3`}>{stat.icon}</div>
                  <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-white/50 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown size={24} className="text-white/30" />
        </div>
      </section>

      {/* ─── Properties ─── */}
      <section id="properties" className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-primary border-primary/30 px-4 py-1">كتالوج العقارات</Badge>
            <h2 className="text-3xl md:text-4xl font-black text-foreground">العقارات المتاحة</h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">اكتشف أفضل العقارات في المدينة المنورة — شقق، فلل، أراضٍ وأكثر</p>
          </div>

          {/* Filter tabs */}
          <div className="flex justify-center gap-2 mb-10">
            {[{ id: "all", label: "الكل", icon: <Building2 size={14} /> }, { id: "sale", label: "للبيع", icon: <TrendingUp size={14} /> }, { id: "rent", label: "للإيجار", icon: <Home size={14} /> }].map((f) => (
              <button key={f.id} onClick={() => setListingFilter(f.id as "all" | "sale" | "rent")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${listingFilter === f.id ? "gold-gradient text-white shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"}`}>
                {f.icon}{f.label}
              </button>
            ))}
          </div>

          {/* Property cards */}
          {propertiesQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => <div key={i} className="rounded-2xl bg-muted animate-pulse h-80" />)}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 size={36} className="text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground font-medium">لا توجد عقارات متاحة حالياً</p>
              <p className="text-sm text-muted-foreground mt-1">تواصل معنا لمعرفة أحدث العروض</p>
              <Button className="mt-6 gold-gradient text-white" onClick={() => setChatOpen(true)}>
                <MessageCircle size={16} className="ml-2" />تحدث مع المساعد
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((prop) => (
                  <Card key={prop.id} className="overflow-hidden border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group bg-card">
                    {/* Image */}
                    <div className="relative overflow-hidden h-52">
                      {(prop.images as string[])?.length > 0 ? (
                        <img src={(prop.images as string[])[0]} alt={prop.titleAr}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                          <Building2 size={48} className="text-slate-300 dark:text-slate-600" />
                        </div>
                      )}
                      {/* Overlay badges */}
                      <div className="absolute top-3 right-3 flex gap-2">
                        <Badge className={`text-xs font-bold shadow-md ${prop.listingType === "sale" ? "gold-gradient text-white border-0" : "bg-blue-600 text-white border-0"}`}>
                          {prop.listingType === "sale" ? "للبيع" : "للإيجار"}
                        </Badge>
                        {prop.isFeatured && (
                          <Badge className="bg-amber-500 text-white border-0 text-xs shadow-md">
                            <Star size={10} className="ml-1 fill-white" />مميز
                          </Badge>
                        )}
                      </div>
                      {/* View count overlay */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur text-white text-xs">
                        <Eye size={11} />{Math.floor(Math.random() * 200 + 50)} مشاهدة
                      </div>
                    </div>

                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground truncate text-base">{prop.titleAr}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin size={11} className="text-primary flex-shrink-0" />
                            {prop.district ? `${prop.district} — ` : ""}{prop.city}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs flex-shrink-0 mr-2 border-primary/20 text-primary">
                          {TYPE_LABELS[prop.type]}
                        </Badge>
                      </div>

                      {/* Property specs */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 py-3 border-y border-border/50">
                        {prop.bedrooms && (
                          <span className="flex items-center gap-1.5">
                            <Bed size={13} className="text-muted-foreground/70" />{prop.bedrooms} غرف
                          </span>
                        )}
                        {prop.bathrooms && (
                          <span className="flex items-center gap-1.5">
                            <Bath size={13} className="text-muted-foreground/70" />{prop.bathrooms} حمام
                          </span>
                        )}
                        {prop.area && (
                          <span className="flex items-center gap-1.5">
                            <Maximize2 size={13} className="text-muted-foreground/70" />{prop.area} م²
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xl font-black text-primary">{formatPrice(prop.price, prop.priceUnit)}</p>
                          {prop.negotiable && (
                            <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                              <CheckCircle2 size={11} />قابل للتفاوض
                            </p>
                          )}
                        </div>
                        <Button size="sm" className="gold-gradient text-white font-bold shadow-sm"
                          onClick={() => { setChatOpen(true); setTimeout(() => setInputText(`أريد الاستفسار عن ${prop.titleAr}`), 300); }}>
                          استفسر الآن
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="text-center mt-10">
                <Button variant="outline" size="lg" className="border-primary/30 text-primary hover:bg-primary/5 font-bold px-8"
                  onClick={() => setChatOpen(true)}>
                  عرض جميع العقارات <ArrowLeft size={16} className="mr-2" />
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ─── Services ─── */}
      <section id="services" className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-primary border-primary/30 px-4 py-1">ما نقدمه</Badge>
            <h2 className="text-3xl md:text-4xl font-black text-foreground">خدماتنا العقارية</h2>
            <p className="text-muted-foreground mt-2">حلول متكاملة لجميع احتياجاتك العقارية في المدينة المنورة</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <TrendingUp size={28} />, title: "بيع العقارات", desc: "نسوّق عقارك بأحدث الأساليب الرقمية ونجد المشتري المناسب بأفضل سعر وأسرع وقت.", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", border: "hover:border-amber-200 dark:hover:border-amber-800" },
              { icon: <Building2 size={28} />, title: "شراء العقارات", desc: "نجد لك العقار المثالي الذي يناسب ميزانيتك ومتطلباتك في أفضل مواقع المدينة المنورة.", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30", border: "hover:border-blue-200 dark:hover:border-blue-800" },
              { icon: <Users size={28} />, title: "الإيجار والتأجير", desc: "نؤجّر عقارك ونجد المستأجر الموثوق، أو نجد لك السكن المناسب بميزانيتك وموقعك المفضل.", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30", border: "hover:border-green-200 dark:hover:border-green-800" },
              { icon: <Shield size={28} />, title: "إدارة الأملاك", desc: "ندير عقاراتك بالكامل — نحصّل الإيجارات، نتابع الصيانة، ونرفع تقارير مالية دورية.", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30", border: "hover:border-purple-200 dark:hover:border-purple-800" },
            ].map((service) => (
              <Card key={service.title}
                className={`border-border ${service.border} hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group`}
                onClick={() => setChatOpen(true)}>
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 ${service.bg} ${service.color} rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                    {service.icon}
                  </div>
                  <h3 className="font-bold text-foreground mb-3 text-base">{service.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{service.desc}</p>
                  <span className={`text-sm font-bold ${service.color} flex items-center justify-center gap-1 group-hover:gap-2 transition-all`}>
                    اعرف أكثر <ArrowLeft size={14} />
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section id="testimonials" className="py-20 bg-background overflow-hidden">
        <div className="container">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-primary border-primary/30 px-4 py-1">آراء عملائنا</Badge>
            <h2 className="text-3xl md:text-4xl font-black text-foreground">ماذا يقول عملاؤنا؟</h2>
            <p className="text-muted-foreground mt-2">أكثر من 1200 عميل وثقوا بنا — إليك بعض تجاربهم</p>
          </div>

          {/* Featured testimonial */}
          <div className="max-w-3xl mx-auto mb-8">
            <Card className="border-border shadow-lg bg-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-8">
                <Quote size={36} className="text-amber-500/30 mb-4" />
                <p className="text-lg text-foreground leading-relaxed mb-6 font-medium">
                  "{TESTIMONIALS[activeTestimonial].text}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 gold-gradient rounded-full flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                    {TESTIMONIALS[activeTestimonial].avatar}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{TESTIMONIALS[activeTestimonial].name}</p>
                    <p className="text-sm text-muted-foreground">{TESTIMONIALS[activeTestimonial].role}</p>
                  </div>
                  <div className="flex gap-1 mr-auto">
                    {Array.from({ length: TESTIMONIALS[activeTestimonial].rating }).map((_, i) => (
                      <Star key={i} size={16} className="text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dots navigation */}
          <div className="flex justify-center gap-2 mb-8">
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === activeTestimonial ? "gold-gradient w-8" : "bg-muted-foreground/30"}`} />
            ))}
          </div>

          {/* Mini cards row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)}
                className={`p-4 rounded-xl border text-right transition-all ${i === activeTestimonial ? "border-primary/40 bg-primary/5 shadow-md" : "border-border bg-card hover:border-primary/20"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 gold-gradient rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                    {t.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={10} className="text-amber-500 fill-amber-500" />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── About ─── */}
      <section id="about" className="py-20 bg-muted/20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-3 text-primary border-primary/30 px-4 py-1">من نحن</Badge>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">تكامل لإدارة الأملاك</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                شركة عقارية متخصصة في المدينة المنورة، نقدم خدمات عقارية متكاملة بخبرة تمتد لأكثر من 5 سنوات في السوق المحلي.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                فريقنا من المتخصصين المرخّصين يعمل على مدار الساعة لضمان رضاكم التام وتحقيق أهدافكم العقارية بكل شفافية واحترافية.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button className="gold-gradient text-white shadow-md" onClick={() => setChatOpen(true)}>
                  <MessageCircle size={16} className="ml-2" />تحدث معنا
                </Button>
                <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-border">
                    <Phone size={16} className="ml-2" />+966 55 801 8151
                  </Button>
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "احترافية", desc: "فريق متخصص ذو خبرة عالية ورخص معتمدة", icon: <Award size={20} />, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
                { label: "شفافية", desc: "تعاملات واضحة وموثوقة بدون رسوم مخفية", icon: <Shield size={20} />, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
                { label: "سرعة", desc: "إنجاز الصفقات بأسرع وقت مع متابعة مستمرة", icon: <Clock size={20} />, color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
                { label: "ضمان", desc: "نضمن رضاك الكامل أو نعيد المحاولة مجاناً", icon: <HeartHandshake size={20} />, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30" },
              ].map((val) => (
                <div key={val.label} className="p-5 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all group">
                  <div className={`w-10 h-10 ${val.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    {val.icon}
                  </div>
                  <h4 className="font-bold text-foreground mb-1">{val.label}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{val.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Tenant Portal CTA ─── */}
      <section className="py-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
        </div>
        <div className="container relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-4 px-4 py-1">للمستأجرين</Badge>
              <h2 className="text-3xl md:text-4xl font-black mb-4">بوابة المستأجر الذكية</h2>
              <p className="text-white/65 leading-relaxed mb-6">
                ادخل برقم عقدك واستعرض رصيدك، تاريخ مدفوعاتك، وتفاصيل عقدك — دون الحاجة للتواصل مع الإدارة.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  { icon: <FileText size={16} />, text: "عرض تفاصيل العقد وتاريخ الانتهاء" },
                  { icon: <CheckCircle2 size={16} />, text: "متابعة سجل المدفوعات والرصيد المستحق" },
                  { icon: <Wrench size={16} />, text: "تقديم طلب صيانة وتتبع حالته" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-white/75">
                    <div className="w-9 h-9 bg-amber-500/15 rounded-xl flex items-center justify-center text-amber-400 flex-shrink-0 border border-amber-500/20">
                      {item.icon}
                    </div>
                    <span className="text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
              <a href="/tenant-portal">
                <Button size="lg" className="gold-gradient text-white font-bold px-8 shadow-lg hover:opacity-90">
                  <KeyRound size={18} className="ml-2" />ادخل إلى بوابتك
                </Button>
              </a>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "بدون تسجيل", desc: "ادخل برقم العقد فقط", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                { label: "24/7", desc: "متاح على مدار الساعة", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
                { label: "آمن", desc: "بياناتك محمية بالكامل", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
                { label: "سريع", desc: "نتائج فورية بدون انتظار", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
              ].map((item) => (
                <div key={item.label} className={`p-5 rounded-2xl border ${item.bg} text-center hover:scale-105 transition-transform`}>
                  <p className={`text-2xl font-black ${item.color} mb-1`}>{item.label}</p>
                  <p className="text-xs text-white/45">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-20 bg-muted/20">
        <div className="container">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-3 text-primary border-primary/30 px-4 py-1">باقات الاشتراك</Badge>
            <h2 className="text-3xl md:text-4xl font-black text-foreground">اختر الباقة المناسبة</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">جميع الباقات تشمل ضريبة القيمة المضافة 15% — فواتير رسمية مع كل اشتراك</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="rounded-2xl border border-border bg-card p-8 flex flex-col gap-4 hover:shadow-lg transition-all">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">الباقة الأساسية</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-foreground">299</span>
                  <span className="text-muted-foreground mb-1">ر.س / شهر</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">شامل ضريبة 15%</p>
              </div>
              <ul className="space-y-2 flex-1">
                {["حتى 50 وحدة عقارية","إدارة العقود والمستأجرين","تقارير أساسية","دعم عبر البريد"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 size={15} className="text-primary shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <a href="/register" className="block w-full py-3 rounded-xl border-2 border-primary text-primary font-bold text-center hover:bg-primary hover:text-white transition-all">
                ابدأ مجاناً
              </a>
            </div>
            {/* Pro - Featured */}
            <div className="rounded-2xl border-2 border-primary bg-card p-8 flex flex-col gap-4 shadow-xl relative">
              <div className="absolute -top-4 right-1/2 translate-x-1/2">
                <span className="gold-gradient text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">الأكثر طلباً</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-primary mb-1">الباقة الاحترافية</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-foreground">699</span>
                  <span className="text-muted-foreground mb-1">ر.س / شهر</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">شامل ضريبة 15%</p>
              </div>
              <ul className="space-y-2 flex-1">
                {["حتى 200 وحدة عقارية","جميع ميزات الباقة الأساسية","تقارير متقدمة وتحليلات","تكامل واتسآب وإشعارات","بوابة المستأجر الذكية","دعم أولوية 24/7"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 size={15} className="text-primary shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <a href="/register" className="block w-full py-3 rounded-xl gold-gradient text-white font-bold text-center hover:opacity-90 transition-all shadow-md">
                اشترك الآن
              </a>
            </div>
            {/* Enterprise */}
            <div className="rounded-2xl border border-border bg-card p-8 flex flex-col gap-4 hover:shadow-lg transition-all">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">باقة المؤسسات</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-foreground">1,499</span>
                  <span className="text-muted-foreground mb-1">ر.س / شهر</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">شامل ضريبة 15%</p>
              </div>
              <ul className="space-y-2 flex-1">
                {["عدد غير محدود من الوحدات","جميع ميزات الباقة الاحترافية","تكامل API مفتوح","مدير حساب مخصص","إعداد مخصص وتدريب الفريق","عقد SLA مضمون"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 size={15} className="text-primary shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="block w-full py-3 rounded-xl border-2 border-border text-foreground font-bold text-center hover:border-primary hover:text-primary transition-all">
                تواصل معنا
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20 bg-background">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-primary border-primary/30 px-4 py-1">الأسئلة الشائعة</Badge>
            <h2 className="text-3xl md:text-4xl font-black text-foreground">أسئلة يطرحها عملاؤنا</h2>
            <p className="text-muted-foreground mt-2">إجابات سريعة على أكثر الأسئلة شيوعاً</p>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className={`rounded-2xl border transition-all duration-200 overflow-hidden ${openFaq === i ? "border-primary/30 shadow-md" : "border-border"}`}>
                <button className="w-full flex items-center justify-between p-5 text-right hover:bg-muted/30 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="font-bold text-foreground text-sm">{item.q}</span>
                  <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all ${openFaq === i ? "gold-gradient text-white" : "bg-muted text-muted-foreground"}`}>
                    {openFaq === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-4">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <p className="text-muted-foreground text-sm mb-4">لم تجد إجابة لسؤالك؟</p>
            <Button className="gold-gradient text-white font-bold" onClick={() => setChatOpen(true)}>
              <MessageCircle size={16} className="ml-2" />اسأل المساعد الذكي
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-slate-950 text-white">
        <div className="container py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663082433191/EGvRBfpqPGe26TFrJFv9dm/logo-transparent_332d78c3.png"
                  alt="تكامل لإدارة الأملاك"
                  className="h-12 w-auto object-contain brightness-0 invert"
                />
                <div>
                  <p className="font-black text-white">تكامل لإدارة الأملاك</p>
                  <p className="text-xs text-white/40">المدينة المنورة، المملكة العربية السعودية</p>
                </div>
              </div>
              <p className="text-sm text-white/50 leading-relaxed mb-4">
                شريكك الموثوق في إدارة الأملاك وتحقيق أهدافك العقارية بكل احترافية وشفافية.
              </p>
              <div className="flex gap-3">
                {[
                  { icon: <Instagram size={16} />, href: "#", label: "Instagram" },
                  { icon: <Twitter size={16} />, href: "#", label: "Twitter" },
                  { icon: <Facebook size={16} />, href: "#", label: "Facebook" },
                  { icon: <Youtube size={16} />, href: "#", label: "Youtube" },
                ].map((s) => (
                  <a key={s.label} href={s.href} aria-label={s.label}
                    className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-amber-500/20 hover:border-amber-500/30 transition-all">
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="font-bold text-white mb-4">روابط سريعة</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "العقارات المتاحة", href: "#properties" },
                  { label: "خدماتنا", href: "#services" },
                  { label: "آراء العملاء", href: "#testimonials" },
                  { label: "عن الشركة", href: "#about" },
                  { label: "الأسئلة الشائعة", href: "#faq" },
                  { label: "بوابة المستأجر", href: "/tenant-portal" },
                ].map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-white/50 hover:text-amber-400 transition-colors flex items-center gap-2">
                      <ArrowLeft size={12} className="opacity-0 group-hover:opacity-100" />{link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-white mb-4">تواصل معنا</h4>
              <div className="space-y-3">
                <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors group">
                  <div className="w-9 h-9 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-white/50">واتساب</p>
                    <p className="text-sm font-bold text-white">+966 55 801 8151</p>
                  </div>
                </a>
                <a href="https://t.me/Takamolestatebot" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                  <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageCircle size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-white/50">تيليغرام</p>
                    <p className="text-sm font-bold text-white">@Takamolestatebot</p>
                  </div>
                </a>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin size={16} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-white/50">العنوان</p>
                    <p className="text-sm font-bold text-white">المدينة المنورة، السعودية</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/30">© 2025 تكامل لإدارة الأملاك. جميع الحقوق محفوظة.</p>
            <div className="flex items-center gap-4 text-xs text-white/30">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-green-400" />رخصة فال معتمدة</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-green-400" />فواتير ZATCA</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-green-400" />عضو الهيئة العقارية</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── Chat toggle button ─── */}
      <button onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 gold-gradient rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform">
        {chatOpen ? <X size={22} /> : <MessageCircle size={22} />}
        {!chatOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* ─── Scroll to top ─── */}
      {showScrollTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 left-6 z-50 w-10 h-10 bg-card border border-border rounded-full shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:shadow-xl transition-all">
          <ChevronUp size={18} />
        </button>
      )}

      {/* ─── Chat window ─── */}
      {chatOpen && (
        <div className="fixed bottom-24 left-6 z-50 w-80 md:w-96 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
          style={{ height: "520px" }}>
          {/* Header */}
          <div className="gold-gradient p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Building2 size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white text-sm">مساعد تكامل الذكي</p>
              <p className="text-xs text-white/70 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />متاح الآن — رد فوري
              </p>
            </div>
            <button onClick={() => setChatOpen(false)} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 gold-gradient rounded-full flex items-center justify-center text-white text-xs font-bold ml-2 flex-shrink-0 mt-1">
                    ت
                  </div>
                )}
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "gold-gradient text-white rounded-tr-sm"
                    : "bg-card border border-border text-foreground rounded-tl-sm shadow-sm"
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start items-end gap-2">
                <div className="w-7 h-7 gold-gradient rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">ت</div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm p-3 shadow-sm">
                  <div className="flex gap-1">
                    {[0, 150, 300].map((delay) => (
                      <span key={delay} className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick replies */}
          <div className="px-3 py-2 bg-background border-t border-border flex gap-2 overflow-x-auto scrollbar-hide">
            {["عقارات للبيع", "عقارات للإيجار", "إدارة أملاك", "تواصل موظف"].map((q) => (
              <button key={q}
                onClick={() => {
                  if (!isTyping) {
                    setMessages((prev) => [...prev, { role: "user", content: q }]);
                    setIsTyping(true);
                    sendMessageMutation.mutate({ sessionId, message: q });
                  }
                }}
                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors bg-card font-medium">
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 bg-card border-t border-border flex gap-2">
            <Input value={inputText} onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="اكتب رسالتك..." className="flex-1 text-sm rounded-xl" disabled={isTyping} />
            <Button size="sm" className="gold-gradient text-white px-3 rounded-xl" onClick={handleSend} disabled={!inputText.trim() || isTyping}>
              <Send size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
