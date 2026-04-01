import { ReactNode } from "react";

const LOGO_TRANSPARENT = "https://d2xsxph8kpxj0f.cloudfront.net/310519663082433191/EGvRBfpqPGe26TFrJFv9dm/logo-transparent_332d78c3.png";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Left Panel — Brand */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #1E2B5E 0%, #2a3a7a 40%, #1a2550 100%)",
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute top-[-80px] right-[-80px] w-[320px] h-[320px] rounded-full opacity-10"
          style={{ background: "#C4855A" }}
        />
        <div
          className="absolute bottom-[-60px] left-[-60px] w-[240px] h-[240px] rounded-full opacity-10"
          style={{ background: "#C4855A" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-5"
          style={{ background: "#D9D0C7" }}
        />

        {/* Logo */}
        <div className="relative z-10 flex flex-col items-center gap-8">
          <img
            src={LOGO_TRANSPARENT}
            alt="تكامل لإدارة الأملاك"
            className="w-48 h-auto drop-shadow-2xl"
            style={{ filter: "brightness(0) invert(1)" }}
          />

          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
              تكامل
            </h1>
            <p className="text-lg text-white/70">شركة تكامل لإدارة الأملاك</p>
            <p className="text-sm text-white/50 mt-1">Takamul Property Management</p>
          </div>

          {/* Feature list */}
          <div className="mt-8 space-y-4 w-full max-w-xs">
            {[
              { icon: "🏢", text: "إدارة شاملة للعقارات والوحدات" },
              { icon: "💰", text: "تحصيل الإيجارات وتتبع المدفوعات" },
              { icon: "📊", text: "تقارير مالية تفصيلية للملاك" },
              { icon: "🔔", text: "تنبيهات ذكية للمتأخرات والتجديدات" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/80">
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 bg-gray-50">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex flex-col items-center gap-3">
          <img
            src={LOGO_TRANSPARENT}
            alt="تكامل"
            className="w-20 h-auto"
          />
          <p className="text-sm text-gray-500">شركة تكامل لإدارة الأملاك</p>
        </div>

        {/* Card */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Title */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold" style={{ color: "#1E2B5E" }}>
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>

          {children}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} شركة تكامل لإدارة الأملاك · جميع الحقوق محفوظة
          </p>
          <div className="flex justify-center gap-4 text-xs">
            <a href="/terms-of-service" className="text-gray-400 hover:text-gray-600 underline transition-colors">شروط الخدمة</a>
            <span className="text-gray-300">|</span>
            <a href="/privacy-policy" className="text-gray-400 hover:text-gray-600 underline transition-colors">سياسة الخصوصية</a>
          </div>
        </div>
      </div>
    </div>
  );
}
