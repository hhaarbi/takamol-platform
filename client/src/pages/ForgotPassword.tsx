import { useState } from "react";
import { Link, useLocation } from "wouter";
import AuthLayout from "@/components/AuthLayout";
import { trpc } from "@/lib/trpc";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const forgotMutation = trpc.standaloneAuth.forgotPassword.useMutation({
    onSuccess: () => {
      setSent(true);
    },
    onError: (err) => {
      setError(err.message || "حدث خطأ، يرجى المحاولة مجدداً");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("يرجى إدخال البريد الإلكتروني");
      return;
    }
    forgotMutation.mutate({ email });
  };

  if (sent) {
    return (
      <AuthLayout
        title="تم الإرسال!"
        subtitle="تحقق من بريدك الإلكتروني"
      >
        <div className="text-center space-y-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "rgba(196, 133, 90, 0.1)" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="#C4855A">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-600 text-sm leading-relaxed">
              أرسلنا رمز التحقق إلى{" "}
              <span className="font-semibold" style={{ color: "#1E2B5E" }}>{email}</span>
            </p>
            <p className="text-gray-400 text-xs mt-2">
              إذا لم يصل البريد، تحقق من مجلد Spam
            </p>
          </div>
          <button
            onClick={() => navigate(`/verify-otp?email=${encodeURIComponent(email)}&type=forgot`)}
            className="auth-btn-primary"
          >
            إدخال رمز التحقق
          </button>
          <button
            onClick={() => setSent(false)}
            className="block w-full text-sm text-gray-400 hover:text-gray-600 mt-2"
          >
            تغيير البريد الإلكتروني
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="نسيت كلمة المرور؟"
      subtitle="أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            البريد الإلكتروني
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@company.com"
            className="auth-input"
            dir="ltr"
            autoFocus
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={forgotMutation.isPending}
          className="auth-btn-primary"
        >
          {forgotMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              جاري الإرسال...
            </span>
          ) : (
            "إرسال رمز التحقق"
          )}
        </button>

        <p className="text-center text-sm text-gray-600">
          تذكرت كلمة المرور؟{" "}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: "#C4855A" }}>
            تسجيل الدخول
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
