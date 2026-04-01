import { useState, useRef, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import AuthLayout from "@/components/AuthLayout";
import { trpc } from "@/lib/trpc";

export default function VerifyOTP() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const email = params.get("email") || "";
  const type = params.get("type") || "register"; // register | forgot

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const verifyMutation = trpc.standaloneAuth.verifyOTP.useMutation({
    onSuccess: () => {
      if (type === "forgot") {
        navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${otp.join("")}`);
      } else {
        navigate("/login?verified=1");
      }
    },
    onError: (err: { message?: string }) => {
      setError(err.message || "رمز التحقق غير صحيح أو منتهي الصلاحية");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    },
  });

  const resendMutation = trpc.standaloneAuth.sendOTP.useMutation({
    onSuccess: () => {
      setResendCooldown(60);
      setError("");
    },
    onError: (err: { message?: string }) => {
      setError(err.message || "حدث خطأ أثناء إعادة الإرسال");
    },
  });

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newOtp.every((d) => d !== "") && newOtp.join("").length === 6) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      handleVerify(pasted);
    }
  };

  const handleVerify = (code: string) => {
    setError("");
    const purpose = type === "forgot" ? "reset_password" : "verify_email";
    verifyMutation.mutate({ email, code, purpose });
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
    const purpose = type === "forgot" ? "reset_password" : "verify_email";
    resendMutation.mutate({ email, purpose });
  };

  return (
    <AuthLayout
      title="التحقق من البريد"
      subtitle={`أرسلنا رمز تحقق مكون من 6 أرقام إلى ${email}`}
    >
      <div className="space-y-6">
        {/* OTP Boxes */}
        <div className="flex justify-center gap-2" dir="ltr">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              className="otp-input"
              style={{
                borderColor: digit ? "#C4855A" : undefined,
                color: "#1E2B5E",
              }}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {/* Verify Button */}
        <button
          onClick={() => handleVerify(otp.join(""))}
          disabled={otp.some((d) => !d) || verifyMutation.isPending}
          className="auth-btn-primary"
        >
          {verifyMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              جاري التحقق...
            </span>
          ) : (
            "تأكيد الرمز"
          )}
        </button>

        {/* Resend */}
        <div className="text-center text-sm text-gray-500">
          لم تستلم الرمز؟{" "}
          {resendCooldown > 0 ? (
            <span className="text-gray-400">
              أعد المحاولة بعد <span className="font-bold" style={{ color: "#C4855A" }}>{resendCooldown}</span> ثانية
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resendMutation.isPending}
              className="font-semibold hover:underline"
              style={{ color: "#C4855A" }}
            >
              {resendMutation.isPending ? "جاري الإرسال..." : "إعادة الإرسال"}
            </button>
          )}
        </div>

        {/* Back */}
        <div className="text-center">
          <button
            onClick={() => navigate(type === "forgot" ? "/forgot-password" : "/register")}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ← العودة
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
