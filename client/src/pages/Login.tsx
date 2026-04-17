import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, User, Building2 } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      toast.success('تم تسجيل الدخول بنجاح');
    } catch (err: any) {
      toast.error(err?.message || 'اسم المستخدم أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, oklch(0.65 0.22 265), transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, oklch(0.70 0.18 300), transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, oklch(0.65 0.22 265), transparent)' }} />
      </div>

      <div className="w-full max-w-md px-6 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'oklch(0.65 0.22 265 / 0.2)', border: '1px solid oklch(0.65 0.22 265 / 0.3)' }}>
            <Building2 className="w-8 h-8" style={{ color: 'oklch(0.65 0.22 265)' }} />
          </div>
          <h1 className="text-3xl font-bold gradient-text">مسارك</h1>
          <p className="text-muted-foreground mt-1 text-sm">النظام الإداري الداخلي</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl p-8 border border-border/50"
          style={{ background: 'oklch(0.16 0.015 250)', boxShadow: '0 25px 50px oklch(0 0 0 / 0.4)' }}>
          <h2 className="text-xl font-semibold text-foreground mb-6 text-center">تسجيل الدخول</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-foreground">
                اسم المستخدم
              </Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم"
                  className="pr-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                  dir="ltr"
                  style={{ textAlign: 'right' }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                كلمة المرور
              </Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="pr-10 pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                  dir="ltr"
                  style={{ textAlign: 'right' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-base font-semibold mt-2"
              style={{ background: 'oklch(0.65 0.22 265)', color: 'oklch(0.98 0.005 265)' }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري تسجيل الدخول...
                </span>
              ) : 'تسجيل الدخول'}
            </Button>
          </form>

          <div className="mt-6 p-3 rounded-lg text-xs text-muted-foreground text-center"
            style={{ background: 'oklch(0.20 0.015 250)' }}>
            للدخول الأول: استخدم <span className="text-primary font-mono">admin</span> / <span className="text-primary font-mono">Admin@2024</span>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2024 مسارك لتسويق الرقمي - جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
