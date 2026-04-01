import { Link } from "wouter";

export default function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-card/50 py-6 mt-auto" dir="rtl">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: "#1E2B5E" }}>
              تكامل لإدارة الأملاك
            </span>
            <span className="text-muted-foreground text-xs">© {year}</span>
          </div>

          {/* Legal Links */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link
              href="/privacy-policy"
              className="hover:text-foreground transition-colors hover:underline"
            >
              سياسة الخصوصية
            </Link>
            <span className="text-border">|</span>
            <Link
              href="/terms-of-service"
              className="hover:text-foreground transition-colors hover:underline"
            >
              شروط الخدمة
            </Link>
            <span className="text-border">|</span>
            <a
              href="mailto:support@takamolestates.com"
              className="hover:text-foreground transition-colors hover:underline"
            >
              الدعم الفني
            </a>
          </div>

          {/* VAT Notice */}
          <div className="text-xs text-muted-foreground text-center md:text-left">
            جميع الأسعار تشمل ضريبة القيمة المضافة 15%
          </div>
        </div>
      </div>
    </footer>
  );
}
