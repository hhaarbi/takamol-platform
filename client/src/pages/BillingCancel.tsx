import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle, ArrowRight, CreditCard } from "lucide-react";

export default function BillingCancel() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <Card className="max-w-lg w-full shadow-lg">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-12 w-12 text-amber-600" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            تم إلغاء عملية الدفع
          </h1>
          <p className="text-muted-foreground mb-6">
            لم يتم خصم أي مبلغ من حسابك. يمكنك العودة وإعادة المحاولة في أي وقت.
          </p>

          <div className="flex flex-col gap-3">
            <Button
              className="w-full"
              onClick={() => setLocation("/billing")}
            >
              <CreditCard className="h-4 w-4 ml-2" />
              العودة إلى الباقات
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/dashboard")}
            >
              الذهاب إلى لوحة التحكم
              <ArrowRight className="h-4 w-4 mr-2" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            للمساعدة أو الاستفسار، تواصل مع فريق الدعم
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
