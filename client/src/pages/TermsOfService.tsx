import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText } from "lucide-react";

const LAST_UPDATED = "1 أبريل 2026";
const COMPANY_NAME = "شركة تكامل لإدارة الأملاك";
const COMPANY_EMAIL = "legal@takamolestates.com";
const COMPANY_WEBSITE = "takamolestates.com";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">شروط الخدمة</span>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              العودة للرئيسية
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-3">شروط وأحكام الخدمة</h1>
          <p className="text-muted-foreground text-sm">
            آخر تحديث: {LAST_UPDATED} | يُرجى قراءة هذه الشروط بعناية قبل استخدام المنصة
          </p>
        </div>

        <div className="space-y-8 text-foreground">

          {/* قبول الشروط */}
          <section>
            <h2 className="text-xl font-bold mb-3">1. قبول الشروط</h2>
            <p className="text-muted-foreground leading-relaxed">
              باستخدامك منصة تكامل لإدارة الأملاك ("المنصة")، أو بالتسجيل فيها، أو بالنقر على
              "أوافق على الشروط والأحكام"، فإنك توافق على الالتزام بهذه الشروط والأحكام وسياسة
              الخصوصية المرفقة. إذا كنت تمثّل شركة أو مؤسسة، فإنك تُقرّ بأن لديك الصلاحية القانونية
              للموافقة نيابةً عنها. إذا لم توافق على هذه الشروط، يُرجى عدم استخدام المنصة.
            </p>
          </section>

          {/* وصف الخدمة */}
          <section>
            <h2 className="text-xl font-bold mb-3">2. وصف الخدمة</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              تُقدّم {COMPANY_NAME} ("تكامل") منصة SaaS لإدارة الأملاك العقارية في المملكة العربية السعودية،
              تشمل:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mr-4">
              <li>إدارة الوحدات العقارية والمستأجرين والعقود</li>
              <li>تتبع المدفوعات وإصدار الفواتير الضريبية</li>
              <li>تقارير الأداء والتحليلات العقارية</li>
              <li>بوابة المالك والمستأجر والوسيط</li>
              <li>تكامل مع خدمات خارجية (فال API، Stripe، إلخ)</li>
            </ul>
            <p className="text-muted-foreground mt-3 text-sm">
              نحتفظ بالحق في تعديل الخدمة أو إضافة ميزات جديدة أو إيقاف ميزات قائمة مع إشعار مسبق.
            </p>
          </section>

          {/* الاشتراك والدفع */}
          <section>
            <h2 className="text-xl font-bold mb-3">3. الاشتراك والدفع</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">3.1 الباقات والأسعار</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  تُقدَّم المنصة بثلاث باقات (Starter، Pro، Enterprise) بأسعار شهرية أو سنوية.
                  جميع الأسعار المعروضة بالريال السعودي (SAR) وتشمل ضريبة القيمة المضافة بنسبة 15%
                  وفق متطلبات هيئة الزكاة والضريبة والجمارك (ZATCA).
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">3.2 التجديد التلقائي</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  يُجدَّد اشتراكك تلقائياً في نهاية كل دورة فوترة ما لم تُلغِه قبل 24 ساعة من تاريخ التجديد.
                  ستتلقى إشعاراً بالبريد الإلكتروني قبل 7 أيام من كل تجديد.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">3.3 الإلغاء والاسترداد</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  يمكنك إلغاء اشتراكك في أي وقت. لا تُسترد الرسوم المدفوعة عن الفترات المنتهية.
                  في حالة وجود خلل تقني موثّق من جانبنا يمنع استخدام الخدمة لأكثر من 48 ساعة متواصلة،
                  يحق لك طلب تعويض بالأيام المتأثرة.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">3.4 الفترة التجريبية</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  قد تُتاح فترة تجريبية مجانية لبعض الباقات. عند انتهاء الفترة التجريبية، يُحوَّل حسابك
                  تلقائياً إلى الباقة المدفوعة ما لم تُلغِ قبل انتهائها.
                </p>
              </div>
            </div>
          </section>

          {/* حقوق الاستخدام */}
          <section>
            <h2 className="text-xl font-bold mb-3">4. حقوق الاستخدام والقيود</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">4.1 الاستخدام المسموح</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mr-4 text-sm">
                  <li>استخدام المنصة لإدارة عقاراتك أو عقارات عملائك بصورة قانونية</li>
                  <li>تخزين بيانات العقارات والمستأجرين المتعلقة بنشاطك التجاري</li>
                  <li>إنشاء تقارير وفواتير لأغراض عملك</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">4.2 الاستخدام المحظور</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mr-4 text-sm">
                  <li>مشاركة بيانات تسجيل الدخول مع أطراف غير مصرّح لها</li>
                  <li>استخدام المنصة لأغراض غير مشروعة أو مخالفة للأنظمة السعودية</li>
                  <li>محاولة اختراق أو تعطيل أنظمة المنصة</li>
                  <li>إعادة بيع الخدمة أو تأجيرها لأطراف ثالثة دون إذن كتابي</li>
                  <li>رفع محتوى يحتوي على برمجيات خبيثة أو مخالف للأخلاق العامة</li>
                </ul>
              </div>
            </div>
          </section>

          {/* ملكية البيانات */}
          <section>
            <h2 className="text-xl font-bold mb-3">5. ملكية البيانات والمحتوى</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              <strong>بياناتك ملكٌ لك.</strong> البيانات التي تُدخلها في المنصة (معلومات العقارات، المستأجرين، العقود)
              تبقى ملكيتك الحصرية. نمنحك حق تصدير بياناتك في أي وقت بصيغ قياسية (CSV، PDF).
              عند إلغاء حسابك، يمكنك طلب نسخة كاملة من بياناتك خلال 30 يوماً من الإلغاء.
            </p>
            <p className="text-muted-foreground mt-3 text-sm">
              في المقابل، تمنحنا ترخيصاً محدوداً لاستخدام بياناتك لأغراض تشغيل الخدمة وتحسينها
              فقط، وفق سياسة الخصوصية.
            </p>
          </section>

          {/* مستوى الخدمة */}
          <section>
            <h2 className="text-xl font-bold mb-3">6. مستوى الخدمة (SLA)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-3 text-right font-semibold">الباقة</th>
                    <th className="border border-border p-3 text-right font-semibold">نسبة التوفر المستهدفة</th>
                    <th className="border border-border p-3 text-right font-semibold">وقت الاستجابة للدعم</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr>
                    <td className="border border-border p-3">Starter</td>
                    <td className="border border-border p-3">99%</td>
                    <td className="border border-border p-3">خلال 48 ساعة عمل</td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="border border-border p-3">Pro</td>
                    <td className="border border-border p-3">99.5%</td>
                    <td className="border border-border p-3">خلال 24 ساعة عمل</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">Enterprise</td>
                    <td className="border border-border p-3">99.9%</td>
                    <td className="border border-border p-3">خلال 4 ساعات (24/7)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* حدود المسؤولية */}
          <section>
            <h2 className="text-xl font-bold mb-3">7. حدود المسؤولية</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              تُقدَّم المنصة "كما هي" وفق أفضل الممارسات التقنية. لا تتحمّل تكامل المسؤولية عن:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mr-4 mt-3 text-sm">
              <li>الخسائر الناجمة عن قرارات عقارية بناءً على بيانات المنصة</li>
              <li>الانقطاعات الناجمة عن قوة قاهرة أو أعطال مزودي الخدمة الخارجيين</li>
              <li>فقدان البيانات الناجم عن خطأ المستخدم أو اختراق حساب بسبب إهمال في حفظ كلمة المرور</li>
            </ul>
            <p className="text-muted-foreground mt-3 text-sm">
              في جميع الأحوال، لا تتجاوز مسؤوليتنا القصوى قيمة ما دفعته في آخر 3 أشهر من الاشتراك.
            </p>
          </section>

          {/* الإنهاء */}
          <section>
            <h2 className="text-xl font-bold mb-3">8. إنهاء الحساب</h2>
            <div className="space-y-3 text-muted-foreground text-sm">
              <p><strong>من قِبلك:</strong> يمكنك إلغاء حسابك في أي وقت من إعدادات الحساب.</p>
              <p>
                <strong>من قِبلنا:</strong> نحتفظ بالحق في تعليق أو إنهاء حسابك فوراً في حالة:
              </p>
              <ul className="list-disc list-inside mr-4 space-y-1">
                <li>انتهاك هذه الشروط أو الأنظمة السعودية</li>
                <li>عدم سداد الرسوم المستحقة بعد 14 يوماً من الإشعار</li>
                <li>الاشتباه في نشاط احتيالي أو اختراق أمني</li>
              </ul>
              <p>عند الإنهاء، تُتاح لك 30 يوماً لتصدير بياناتك قبل حذفها نهائياً.</p>
            </div>
          </section>

          {/* القانون المطبّق */}
          <section>
            <h2 className="text-xl font-bold mb-3">9. القانون المطبّق وحل النزاعات</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              تخضع هذه الشروط لأنظمة المملكة العربية السعودية. في حالة نشوء أي نزاع، يُسعى أولاً
              لحله وُدّياً خلال 30 يوماً. إذا تعذّر الحل الودّي، يُحال النزاع إلى المحاكم السعودية
              المختصة في مدينة الرياض.
            </p>
          </section>

          {/* تعديل الشروط */}
          <section>
            <h2 className="text-xl font-bold mb-3">10. تعديل الشروط</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              نحتفظ بالحق في تعديل هذه الشروط. سنُخطرك بأي تعديلات جوهرية عبر البريد الإلكتروني
              أو إشعار داخل المنصة قبل 30 يوماً. استمرارك في استخدام المنصة بعد سريان التعديلات
              يُعدّ قبولاً لها.
            </p>
          </section>

          {/* التواصل */}
          <section>
            <h2 className="text-xl font-bold mb-3">11. التواصل معنا</h2>
            <div className="bg-muted/50 rounded-lg p-6">
              <p className="font-semibold mb-3">{COMPANY_NAME}</p>
              <div className="space-y-2 text-muted-foreground text-sm">
                <p>البريد الإلكتروني القانوني: <a href={`mailto:${COMPANY_EMAIL}`} className="text-primary underline">{COMPANY_EMAIL}</a></p>
                <p>الموقع الإلكتروني: <a href={`https://${COMPANY_WEBSITE}`} className="text-primary underline">{COMPANY_WEBSITE}</a></p>
                <p>المملكة العربية السعودية</p>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} {COMPANY_NAME}. جميع الحقوق محفوظة.</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/privacy-policy" className="hover:text-foreground transition-colors">سياسة الخصوصية</Link>
          <span>|</span>
          <Link href="/terms-of-service" className="hover:text-foreground transition-colors">شروط الخدمة</Link>
        </div>
      </footer>
    </div>
  );
}
