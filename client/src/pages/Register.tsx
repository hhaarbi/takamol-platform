import { useState } from "react";
import { Link, useLocation } from "wouter";
import AuthLayout from "@/components/AuthLayout";
import { trpc } from "@/lib/trpc";

export default function Register() {
  const [, navigate] = useLocation();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    companyName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  const registerMutation = trpc.standaloneAuth.register.useMutation({
    onSuccess: (data) => {
      // Redirect to OTP verification with email
      navigate(`/verify-otp?email=${encodeURIComponent(form.email)}&type=register`);
    },
    onError: (err) => {
      setError(err.message || "حدث خطأ أثناء إنشاء الحساب");
    },
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.email || !form.password) {
      setError("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    if (form.password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("كلمة المرور وتأكيدها غير متطابقتين");
      return;
    }
    if (!agreed) {
      setError("يجب الموافقة على شروط الاستخدام وسياسة الخصوصية");
      return;
    }

    registerMutation.mutate({
      name: form.name,
      email: form.email,
      password: form.password,
    });
  };

  return (
    <AuthLayout
      title="إنشاء حساب جديد"
      subtitle="ابدأ تجربتك المجانية مع تكامل لإدارة الأملاك"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            الاسم الكامل <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="محمد أحمد العمري"
            className="auth-input"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            البريد الإلكتروني <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="example@company.com"
            className="auth-input"
            dir="ltr"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            رقم الجوال
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="05xxxxxxxx"
            className="auth-input"
            dir="ltr"
          />
        </div>

        {/* Company */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            اسم الشركة / المكتب
          </label>
          <input
            type="text"
            value={form.companyName}
            onChange={(e) => handleChange("companyName", e.target.value)}
            placeholder="شركة العقارات الذهبية"
            className="auth-input"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            كلمة المرور <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder="8 أحرف على الأقل"
              className="auth-input pl-10"
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {/* Password strength */}
          {form.password && (
            <div className="mt-1 flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-colors"
                  style={{
                    background:
                      form.password.length >= i * 2
                        ? i <= 2 ? "#ef4444" : i === 3 ? "#f59e0b" : "#22c55e"
                        : "#e5e7eb",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            تأكيد كلمة المرور <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            placeholder="أعد كتابة كلمة المرور"
            className="auth-input"
            dir="ltr"
          />
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="agree"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 rounded border-gray-300"
            style={{ accentColor: "#C4855A" }}
          />
          <label htmlFor="agree" className="text-sm text-gray-600">
            أوافق على{" "}
            <Link href="/terms-of-service" className="font-medium hover:underline" style={{ color: "#C4855A" }}>
              شروط الاستخدام
            </Link>{" "}
            و{" "}
            <Link href="/privacy-policy" className="font-medium hover:underline" style={{ color: "#C4855A" }}>
              سياسة الخصوصية
            </Link>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="auth-btn-primary"
        >
          {registerMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              جاري إنشاء الحساب...
            </span>
          ) : (
            "إنشاء الحساب"
          )}
        </button>

        {/* Login link */}
        <p className="text-center text-sm text-gray-600">
          لديك حساب بالفعل؟{" "}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: "#C4855A" }}>
            تسجيل الدخول
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
