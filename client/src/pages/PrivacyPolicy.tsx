import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";

const LAST_UPDATED = "1 أبريل 2026";
const COMPANY_NAME = "شركة تكامل لإدارة الأملاك";
const COMPANY_EMAIL = "privacy@takamolestates.com";
const COMPANY_WEBSITE = "takamolestates.com";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">سياسة الخصوصية</span>
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
          <h1 className="text-3xl font-bold mb-3">سياسة الخصوصية</h1>
          <p className="text-muted-foreground text-sm">
            آخر تحديث: {LAST_UPDATED} | تسري على جميع مستخدمي منصة تكامل
          </p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 text-foreground">

          {/* مقدمة */}
          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">1. المقدمة</h2>
            <p className="text-muted-foreground leading-relaxed">
              تلتزم {COMPANY_NAME} ("تكامل"، "نحن"، "الشركة") بحماية خصوصية مستخدمي منصتها
              لإدارة الأملاك. تُوضّح هذه السياسة كيفية جمع بياناتك الشخصية واستخدامها وحمايتها
              وفقاً لنظام حماية البيانات الشخصية السعودي (PDPL) الصادر بالمرسوم الملكي م/19 لعام 1443هـ،
              ولوائح هيئة الاتصالات والفضاء والتقنية.
            </p>
          </section>

          {/* البيانات التي نجمعها */}
          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">2. البيانات التي نجمعها</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">2.1 بيانات الحساب</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mr-4">
                  <li>الاسم الكامل وعنوان البريد الإلكتروني ورقم الجوال</li>
                  <li>اسم الشركة والسجل التجاري (للحسابات المؤسسية)</li>
                  <li>كلمة المرور المشفّرة (لا نخزّن كلمات المرور بصيغتها الأصلية)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">2.2 بيانات الاستخدام</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mr-4">
                  <li>سجلات الدخول وعناوين IP وأنواع المتصفحات</li>
                  <li>الصفحات التي تزورها ومدة الجلسة</li>
                  <li>الأخطاء والأعطال التقنية لتحسين الخدمة</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">2.3 بيانات الدفع</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mr-4">
                  <li>لا نخزّن بيانات بطاقات الائتمان — تُعالَج عبر Stripe المعتمد دولياً</li>
                  <li>نحتفظ بسجل المعاملات المالية لأغراض المحاسبة والامتثال الضريبي</li>
                  <li>رقم الفاتورة والمبلغ وتاريخ الدفع وضريبة القيمة المضافة (15%)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">2.4 بيانات العقارات</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mr-4">
                  <li>معلومات الوحدات العقارية والمستأجرين والعقود التي تُدخلها أنت</li>
                  <li>هذه البيانات ملكٌ لك ولا نستخدمها إلا لتقديم الخدمة</li>
                </ul>
              </div>
            </div>
          </section>

          {/* كيف نستخدم البيانات */}
          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">3. كيف نستخدم بياناتك</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mr-4">
              <li>تقديم خدمات إدارة الأملاك وتشغيل المنصة</li>
              <li>معالجة المدفوعات وإصدار الفواتير الضريبية</li>
              <li>إرسال إشعارات الاشتراك والتجديد والتنبيهات المهمة</li>
              <li>تحسين أداء المنصة وتطوير ميزات جديدة</li>
              <li>الامتثال للمتطلبات القانونية والتنظيمية في المملكة العربية السعودية</li>
              <li>الرد على استفساراتك وطلبات الدعم الفني</li>
            </ul>
            <p className="text-muted-foreground mt-3 text-sm">
              <strong>لا نبيع بياناتك الشخصية</strong> لأي طرف ثالث ولا نستخدمها لأغراض إعلانية.
            </p>
          </section>

          {/* مشاركة البيانات */}
          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">4. مشاركة البيانات مع أطراف ثالثة</h2>
            <p className="text-muted-foreground mb-3">
              نشارك بياناتك فقط مع مزودي الخدمة الضروريين لتشغيل المنصة:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-3 text-right font-semibold">الجهة</th>
                    <th className="border border-border p-3 text-right font-semibold">الغرض</th>
                    <th className="border border-border p-3 text-right font-semibold">الموقع</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr>
                    <td className="border border-border p-3">Stripe Inc.</td>
                    <td className="border border-border p-3">معالجة المدفوعات</td>
                    <td className="border border-border p-3">الولايات المتحدة</td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="border border-border p-3">Resend Inc.</td>
                    <td className="border border-border p-3">إرسال البريد الإلكتروني</td>
                    <td className="border border-border p-3">الولايات المتحدة</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">TiDB Cloud</td>
                    <td className="border border-border p-3">تخزين قاعدة البيانات</td>
                    <td className="border border-border p-3">سنغافورة/الولايات المتحدة</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-muted-foreground mt-3 text-sm">
              جميع هؤلاء المزودين ملتزمون بمعايير حماية البيانات الدولية ومرتبطون باتفاقيات معالجة البيانات معنا.
            </p>
          </section>

          {/* الاحتفاظ بالبيانات */}
          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">5. الاحتفاظ بالبيانات</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mr-4">
              <li>بيانات الحساب: طوال مدة الاشتراك + 3 سنوات بعد الإلغاء</li>
              <li>سجلات الفواتير والمعاملات المالية: 10 سنوات (متطلب نظام الزكاة والضريبة)</li>
              <li>سجلات الدخول والأمان: 12 شهراً</li>
              <li>يمكنك طلب حذف بياناتك الشخصية في أي وقت (باستثناء ما يُلزم القانون بالاحتفاظ به)</li>
            </ul>
          </section>

          {/* حقوقك */}
          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">6. حقوقك وفق نظام PDPL</h2>
            <p className="text-muted-foreground mb-3">
              يمنحك نظام حماية البيانات الشخصية السعودي الحقوق التالية:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: "حق الاطلاع", desc: "معرفة البيانات التي نحتفظ بها عنك" },
                { title: "حق التصحيح", desc: "تصحيح البيانات غير الدقيقة أو المكتملة" },
                { title: "حق الحذف", desc: "طلب حذف بياناتك (مع مراعاة الالتزامات القانونية)" },
                { title: "حق النقل", desc: "الحصول على نسخة من بياناتك بصيغة قابلة للقراءة" },
                { title: "حق الاعتراض", desc: "الاعتراض على معالجة بياناتك لأغراض معينة" },
                { title: "حق سحب الموافقة", desc: "سحب موافقتك في أي وقت دون أثر رجعي" },
              ].map((right) => (
                <div key={right.title} className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-1">{right.title}</h4>
                  <p className="text-muted-foreground text-xs">{right.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground mt-4 text-sm">
              لممارسة أي من هذه الحقوق، تواصل معنا على: <a href={`mailto:${COMPANY_EMAIL}`} className="text-primary underline">{COMPANY_EMAIL}</a>
            </p>
          </section>

          {/* الأمان */}
          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">7. الأمان وحماية البيانات</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mr-4">
              <li>تشفير البيانات أثناء النقل باستخدام TLS 1.3</li>
              <li>تشفير كلمات المرور باستخدام bcrypt</li>
              <li>المصادقة الثنائية عبر OTP للحسابات الحساسة</li>
              <li>نسخ احتياطية يومية مشفّرة لقاعدة البيانات</li>
              <li>مراقبة مستمرة للوصول غير المصرح به</li>
              <li>في حالة اختراق البيانات، نُخطرك خلال 72 ساعة وفق متطلبات PDPL</li>
            </ul>
          </section>

          {/* ملفات تعريف الارتباط */}
          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">8. ملفات تعريف الارتباط (Cookies)</h2>
            <p className="text-muted-foreground leading-relaxed">
              نستخدم ملفات تعريف الارتباط الضرورية فقط للحفاظ على جلسة تسجيل الدخول وضمان أمان الحساب.
              لا نستخدم ملفات تعريف الارتباط للتتبع الإعلاني أو التحليلات الخارجية.
            </p>
          </section>

          {/* ZATCA Placeholder */}
          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">9. الامتثال الضريبي (ZATCA)</h2>
            <p className="text-muted-foreground leading-relaxed">
              تلتزم تكامل بمتطلبات هيئة الزكاة والضريبة والجمارك (ZATCA). جميع الفواتير الصادرة
              تتضمن ضريبة القيمة المضافة بنسبة 15%. نعمل على تطوير دعم الفوترة الإلكترونية (ZATCA e-invoicing)
              وفق المرحلة الثانية من متطلبات الهيئة.
            </p>
          </section>

          {/* التعديلات */}
          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">10. تعديلات السياسة</h2>
            <p className="text-muted-foreground leading-relaxed">
              قد نُحدّث هذه السياسة دورياً. في حالة التعديلات الجوهرية، سنُخطرك عبر البريد الإلكتروني
              أو إشعار داخل المنصة قبل 30 يوماً من سريان التعديلات. استمرارك في استخدام المنصة بعد
              التعديلات يعني موافقتك عليها.
            </p>
          </section>

          {/* التواصل */}
          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">11. التواصل معنا</h2>
            <div className="bg-muted/50 rounded-lg p-6">
              <p className="font-semibold mb-3">{COMPANY_NAME}</p>
              <div className="space-y-2 text-muted-foreground text-sm">
                <p>البريد الإلكتروني: <a href={`mailto:${COMPANY_EMAIL}`} className="text-primary underline">{COMPANY_EMAIL}</a></p>
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
