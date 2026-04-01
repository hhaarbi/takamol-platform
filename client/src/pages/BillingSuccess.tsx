import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Receipt } from "lucide-react";

export default function BillingSuccess() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Confetti or celebration animation can be added here
    const timer = setTimeout(() => {
      // Auto-redirect after 5 seconds
      // setLocation("/dashboard");
    }, 5000);
    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <Card className="max-w-lg w-full border-primary/20 shadow-lg">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            تم الاشتراك بنجاح! 🎉
          </h1>
          <p className="text-muted-foreground mb-6">
            تم تفعيل اشتراكك في منصة تكامل. يمكنك الآن الاستفادة من جميع ميزات باقتك.
          </p>

          <div className="flex flex-col gap-3">
            <Button
              className="w-full"
              onClick={() => setLocation("/dashboard")}
            >
              الذهاب إلى لوحة التحكم
              <ArrowRight className="h-4 w-4 mr-2" />
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/billing")}
            >
              <Receipt className="h-4 w-4 ml-2" />
              عرض الفواتير
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            ستتلقى إيصال الدفع على بريدك الإلكتروني خلال دقائق
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
