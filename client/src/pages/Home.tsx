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
} from "lucide-react";

const WHATSAPP = "966558018151";

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

  const propertiesQuery = trpc.properties.list.useQuery({
    listingType: listingFilter === "all" ? undefined : listingFilter,
    limit: 12,
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

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  useEffect(() => {
    if (chatOpen && messages.length === 0) {
      setMessages([{ role: "assistant", content: "🌟 أهلاً وسهلاً بك في تكامل لإدارة الأملاك!\n\nأنا مساعدك العقاري الذكي، يسعدني مساعدتك في:\n• 🏠 شراء أو بيع عقار\n• 🔑 إيجار أو تأجير\n• 📊 إدارة أملاكك\n\nكيف يمكنني مساعدتك اليوم؟" }]);
    }
  }, [chatOpen]);

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
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center">
                <Building2 size={18} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-sm leading-none text-foreground">تكامل</p>
                <p className="text-xs text-muted-foreground">لإدارة الأملاك</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#properties" className="text-sm text-muted-foreground hover:text-foreground transition-colors">العقارات</a>
              <a href="#services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">خدماتنا</a>
              <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">عن الشركة</a>
              <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <Phone size={14} />تواصل معنا
              </a>
              {isAuthenticated && user?.role === "admin" && (
                <Button size="sm" variant="outline" onClick={() => navigate("/dashboard")}>
                  <LayoutDashboard size={14} className="ml-1" />لوحة التحكم
                </Button>
              )}
            </div>
            <button className="md:hidden p-2 rounded-lg hover:bg-muted" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2 border-t border-border pt-4">
              <a href="#properties" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>العقارات</a>
              <a href="#services" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>خدماتنا</a>
              <a href="#about" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>عن الشركة</a>
              {isAuthenticated && user?.role === "admin" && (
                <button className="block w-full text-right px-4 py-2 text-sm text-primary font-medium" onClick={() => { navigate("/dashboard"); setMobileMenuOpen(false); }}>لوحة التحكم</button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 md:py-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-amber-400 blur-3xl" />
          <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full bg-amber-600 blur-3xl" />
        </div>
        <div className="container relative z-10">
          <div className="max-w-2xl">
            <Badge className="gold-gradient text-white border-0 mb-6 text-xs px-3 py-1">المدينة المنورة</Badge>
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6">
              شريكك الموثوق في<span className="block text-amber-400">إدارة الأملاك</span>
            </h1>
            <p className="text-lg text-white/70 mb-8 leading-relaxed">نقدم لك أفضل الخدمات العقارية في المدينة المنورة — من البيع والشراء إلى الإيجار وإدارة الأملاك بكل احترافية.</p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="gold-gradient text-white font-bold px-8 hover:opacity-90" onClick={() => setChatOpen(true)}>
                <MessageCircle size={18} className="ml-2" />تحدث مع المساعد الذكي
              </Button>
              <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold px-8">
                  <Phone size={18} className="ml-2" />واتساب مباشر
                </Button>
              </a>
            </div>
          </div>
        </div>
        <div className="container relative z-10 mt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[{ label: "عقار مُسوَّق", value: "500+" }, { label: "عميل راضٍ", value: "1200+" }, { label: "سنوات خبرة", value: "5+" }, { label: "صفقة ناجحة", value: "300+" }].map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-2xl bg-white/5 backdrop-blur border border-white/10">
                <p className="text-2xl font-black text-amber-400">{stat.value}</p>
                <p className="text-xs text-white/60 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown size={24} className="text-white/40" />
        </div>
      </section>

      {/* Properties */}
      <section id="properties" className="py-16 bg-background">
        <div className="container">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-primary border-primary/30">كتالوج العقارات</Badge>
            <h2 className="text-3xl font-black text-foreground">العقارات المتاحة</h2>
            <p className="text-muted-foreground mt-2">اكتشف أفضل العقارات في المدينة المنورة</p>
          </div>
          <div className="flex justify-center gap-2 mb-8">
            {[{ id: "all", label: "الكل" }, { id: "sale", label: "للبيع" }, { id: "rent", label: "للإيجار" }].map((f) => (
              <button key={f.id} onClick={() => setListingFilter(f.id as any)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${listingFilter === f.id ? "gold-gradient text-white shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                {f.label}
              </button>
            ))}
          </div>
          {propertiesQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => <div key={i} className="rounded-2xl bg-muted animate-pulse h-72" />)}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-16">
              <Building2 size={48} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">لا توجد عقارات متاحة حالياً</p>
              <p className="text-sm text-muted-foreground mt-1">تواصل معنا لمعرفة أحدث العروض</p>
              <Button className="mt-4 gold-gradient text-white" onClick={() => setChatOpen(true)}>تحدث مع المساعد</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((prop) => (
                <Card key={prop.id} className="overflow-hidden border-border hover:shadow-lg transition-shadow group">
                  <div className="relative overflow-hidden">
                    {(prop.images as string[])?.length > 0 ? (
                      <img src={(prop.images as string[])[0]} alt={prop.titleAr} className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-52 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        <Building2 size={40} className="text-slate-400" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex gap-2">
                      <Badge className={prop.listingType === "sale" ? "gold-gradient text-white border-0" : "bg-blue-600 text-white border-0"}>
                        {prop.listingType === "sale" ? "للبيع" : "للإيجار"}
                      </Badge>
                      {prop.isFeatured && <Badge className="bg-amber-500 text-white border-0"><Star size={10} className="ml-1" />مميز</Badge>}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground truncate">{prop.titleAr}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin size={11} />{prop.district ? `${prop.district} - ` : ""}{prop.city}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs flex-shrink-0 mr-2">{TYPE_LABELS[prop.type]}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      {prop.bedrooms && <span className="flex items-center gap-1"><Bed size={12} />{prop.bedrooms} غرف</span>}
                      {prop.bathrooms && <span className="flex items-center gap-1"><Bath size={12} />{prop.bathrooms} حمام</span>}
                      {prop.area && <span className="flex items-center gap-1"><Maximize2 size={12} />{prop.area} م²</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-black text-primary">{formatPrice(prop.price, prop.priceUnit)}</p>
                        {prop.negotiable && <p className="text-xs text-green-600">قابل للتفاوض</p>}
                      </div>
                      <Button size="sm" className="gold-gradient text-white"
                        onClick={() => { setChatOpen(true); setTimeout(() => setInputText(`أريد الاستفسار عن ${prop.titleAr}`), 300); }}>
                        استفسر الآن
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-primary border-primary/30">ما نقدمه</Badge>
            <h2 className="text-3xl font-black text-foreground">خدماتنا العقارية</h2>
            <p className="text-muted-foreground mt-2">حلول متكاملة لجميع احتياجاتك العقارية</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <TrendingUp size={28} />, title: "بيع العقارات", desc: "نسوّق عقارك بأحدث الأساليب ونجد المشتري المناسب بأفضل سعر وأسرع وقت.", color: "text-amber-600", bg: "bg-amber-50" },
              { icon: <Building2 size={28} />, title: "شراء العقارات", desc: "نجد لك العقار المثالي الذي يناسب ميزانيتك ومتطلباتك في المدينة المنورة.", color: "text-blue-600", bg: "bg-blue-50" },
              { icon: <Users size={28} />, title: "الإيجار والتأجير", desc: "نؤجّر عقارك ونجد المستأجر الموثوق، أو نجد لك السكن المناسب بميزانيتك.", color: "text-green-600", bg: "bg-green-50" },
              { icon: <Shield size={28} />, title: "إدارة الأملاك", desc: "ندير عقاراتك بالكامل — نحصّل الإيجارات، نتابع الصيانة، ونرفع تقارير دورية.", color: "text-purple-600", bg: "bg-purple-50" },
            ].map((service) => (
              <Card key={service.title} className="border-border hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group" onClick={() => setChatOpen(true)}>
                <CardContent className="p-6 text-center">
                  <div className={`w-14 h-14 ${service.bg} ${service.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    {service.icon}
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{service.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.desc}</p>
                  <Button variant="ghost" size="sm" className="mt-4 text-primary">اعرف أكثر ←</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16 bg-background">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-3 text-primary border-primary/30">من نحن</Badge>
              <h2 className="text-3xl font-black text-foreground mb-4">تكامل لإدارة الأملاك</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">شركة عقارية متخصصة في المدينة المنورة، نقدم خدمات عقارية متكاملة بخبرة تمتد لسنوات.</p>
              <p className="text-muted-foreground leading-relaxed mb-6">فريقنا من المتخصصين يعمل على مدار الساعة لضمان رضاكم التام وتحقيق أهدافكم العقارية بكل شفافية واحترافية.</p>
              <div className="flex flex-wrap gap-3">
                <Button className="gold-gradient text-white" onClick={() => setChatOpen(true)}>
                  <MessageCircle size={16} className="ml-2" />تحدث معنا
                </Button>
                <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline"><Phone size={16} className="ml-2" />+966 55 801 8151</Button>
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[{ label: "احترافية", desc: "فريق متخصص ذو خبرة عالية" }, { label: "شفافية", desc: "تعاملات واضحة وموثوقة" }, { label: "سرعة", desc: "إنجاز الصفقات بأسرع وقت" }, { label: "ضمان", desc: "نضمن رضاك أو نعيد المحاولة" }].map((val) => (
                <div key={val.label} className="p-4 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors">
                  <div className="w-8 h-8 gold-gradient rounded-lg mb-3" />
                  <h4 className="font-bold text-foreground">{val.label}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{val.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-10">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center">
                <Building2 size={18} className="text-white" />
              </div>
              <div>
                <p className="font-bold">تكامل لإدارة الأملاك</p>
                <p className="text-xs text-white/50">المدينة المنورة، المملكة العربية السعودية</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-white/60">
              <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">واتساب</a>
              <span>•</span>
              <a href="https://t.me/Takamolestatebot" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">تيليغرام</a>
              <span>•</span>
              <span>+966 55 801 8151</span>
            </div>
            <p className="text-xs text-white/30">© 2025 تكامل لإدارة الأملاك. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>

      {/* Chat toggle */}
      <button onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 gold-gradient rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform">
        {chatOpen ? <X size={22} /> : <MessageCircle size={22} />}
        {!chatOpen && <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />}
      </button>

      {/* Chat window */}
      {chatOpen && (
        <div className="fixed bottom-24 left-6 z-50 w-80 md:w-96 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col" style={{ height: "500px" }}>
          <div className="gold-gradient p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <Building2 size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white text-sm">مساعد تكامل الذكي</p>
              <p className="text-xs text-white/70 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />متاح الآن
              </p>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-white/70 hover:text-white"><X size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "gold-gradient text-white rounded-tr-sm" : "bg-card border border-border text-foreground rounded-tl-sm"}`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm p-3">
                  <div className="flex gap-1">
                    {[0, 150, 300].map((delay) => (
                      <span key={delay} className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="px-3 py-2 bg-background border-t border-border flex gap-2 overflow-x-auto">
            {["عقارات للبيع", "عقارات للإيجار", "إدارة أملاك", "تواصل موظف"].map((q) => (
              <button key={q}
                onClick={() => {
                  if (!isTyping) {
                    setMessages((prev) => [...prev, { role: "user", content: q }]);
                    setIsTyping(true);
                    sendMessageMutation.mutate({ sessionId, message: q });
                  }
                }}
                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors bg-card">
                {q}
              </button>
            ))}
          </div>
          <div className="p-3 bg-card border-t border-border flex gap-2">
            <Input value={inputText} onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="اكتب رسالتك..." className="flex-1 text-sm" disabled={isTyping} />
            <Button size="sm" className="gold-gradient text-white px-3" onClick={handleSend} disabled={!inputText.trim() || isTyping}>
              <Send size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
