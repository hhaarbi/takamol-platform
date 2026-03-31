# تكامل - منصة إدارة الأملاك المتكاملة

## Phase 1: قاعدة البيانات والهيكل
- [x] جداول الملاك (property_owners) - بوابة مستقلة
- [x] جداول الوسطاء (brokers) - بوابة مستقلة + نسبة العمولة
- [x] جداول العقارات (properties) - مرتبطة بالمالك أو الوسيط
- [x] جداول الوحدات (units) - شقة/محل/مستودع داخل العقار
- [x] جداول المستأجرين (tenants)
- [x] جداول العقود (contracts) - إيجار/بيع/إدارة
- [x] جداول التحصيل (payments) - إيجارات + رسوم + متأخرات
- [x] جداول المصاريف (expenses) - صيانة + تشغيل
- [x] جداول طلبات الصيانة (maintenance_requests)
- [x] جداول عمولات الشركة (commissions) - نسبة متغيرة حسب نوع العقار
- [x] جداول الإشعارات (notifications)
- [x] جداول الوثائق (documents) - عقود + صور + مستندات

## Phase 2: Backend API
- [x] Auth: أدوار متعددة (admin, owner, broker)
- [x] API إدارة الملاك والعقارات
- [x] API إدارة المستأجرين والعقود
- [x] API التحصيل والمدفوعات والمتأخرات
- [x] API المصاريف والصيانة
- [x] API العمولات (نسبة متغيرة حسب نوع العقار)
- [x] API التقارير المالية (للمدير والمالك)
- [x] API رفع الوثائق والصور

## Phase 3: لوحة تحكم المدير (Admin Dashboard)
- [x] نظرة عامة: إحصائيات شاملة (عقارات، وحدات، مستأجرين، إيرادات)
- [x] إدارة الملاك: إضافة/تعديل + إنشاء حساب بوابة
- [x] إدارة الوسطاء: إضافة + تحديد نسبة العمولة حسب نوع العقار
- [x] إدارة العقارات والوحدات: تفاصيل كاملة + صور
- [x] إدارة المستأجرين: بيانات + عقود + سجل مدفوعات
- [x] التحصيل: جدول الإيجارات + المتأخرات + إصدار إيصالات
- [x] المصاريف: تسجيل + ربط بالعقار + تأثير على صافي الربح
- [x] الصيانة: طلبات + تكاليف + حالة
- [x] التقارير: مالية + تشغيلية + قابلة للتصدير PDF/Excel
- [x] عمولات الشركة: عرض ما تم احتسابه على كل عرض وسيط

## Phase 4: بوابة الملاك (Owner Portal)
- [x] لوحة ملخص: إيرادات + مصاريف + صافي الشهر
- [x] عقاراتي: قائمة العقارات + وحدات كل عقار + حالة الإشغال
- [x] المدفوعات: سجل التحصيل لكل وحدة
- [x] المصاريف: ما صُرف على عقاراتي
- [x] العقود: عقود المستأجرين النشطة والمنتهية
- [x] التقارير: تقرير شهري/سنوي قابل للتحميل

## Phase 5: بوابة الوسطاء (Broker Portal)
- [x] لوحة الوسيط: عروضي + عمولاتي المستحقة
- [x] إضافة عقار للتسويق: تفاصيل + صور + سعر
- [x] عرض نسبة عمولة الشركة على كل عرض (يُحددها المدير)
- [x] طلبات العملاء على عقاراتي
- [x] سجل الصفقات المكتملة وعمولاتها

## Phase 6: الاختبار والتسليم
- [x] Vitest tests
- [x] Checkpoint نهائي

## التطويرات الجديدة (36 مقترح)

### إدارة العقود والتوثيق
- [x] تنبيهات انتهاء العقود (90/60/30 يوم)
- [x] أرشيف العقود والوثائق الإلكتروني
- [x] نظام تجديد العقود التلقائي

### التحصيل والمتابعة المالية
- [x] جدول التحصيل الشهري
- [x] نظام المتأخرات والتصعيد التلقائي
- [x] إيصالات استلام رسمية PDF
- [x] تقرير التحصيل للمالك
- [x] سجل المقبوضات والمصروفات (دفتر يومية)

### الصيانة والتشغيل
- [x] نظام طلبات الصيانة المتقدم
- [x] سجل صيانة لكل عقار
- [x] جدول الصيانة الدورية
- [x] ميزانية صيانة لكل عقار

### التقارير والإحصائيات
- [x] لوحة إحصائيات تفاعلية (رسوم بيانية)
- [x] تقرير أداء الشركة الشهري
- [x] تقرير المتأخرات التفصيلي
- [x] تقرير عمولات الوسطاء
- [x] تصدير التقارير PDF/Excel

### إدارة الملاك والعلاقات
- [x] ملف شامل لكل مالك
- [x] نظام الملاحظات والمتابعة
- [x] نظام تقييم المستأجرين

### إدارة الوسطاء والعمولات
- [x] نظام العمولات المتدرج
- [x] لوحة أداء الوسطاء
- [x] نظام موافقة العقارات

### الامتثال القانوني السعودي
- [x] حقول البيانات المتوافقة مع الأنظمة
- [x] نظام رخصة فال
- [x] سجل الضمانات (التأمين)
- [x] التقويم الهجري

### أدوات الإنتاجية
- [x] البحث الشامل
- [x] لوحة المهام اليومية
- [x] سجل النشاطات (Audit Log)
- [x] قوالب الرسائل الجاهزة
- [x] التقويم التشغيلي

### إدارة العقارات المتقدمة
- [x] بطاقة عقار شاملة
- [x] نظام إدارة الوحدات الشاغرة
- [x] مقارنة أسعار السوق
- [x] نظام تسليم واستلام الوحدات

## الدفعة الثالثة - 45 مقترح تطوير لوحات التحكم

### قاعدة البيانات الجديدة
- [x] جدول contractors (المقاولون والموردون)
- [x] جدول owner_transfers (تحويلات الملاك)
- [x] جدول broker_referrals (نظام الإحالات)
- [x] أعمدة جديدة في payments: lateFee, lateDays, escalationLevel, reminderSent
- [x] أعمدة جديدة في properties: roi, vacancyLoss, marketRent

### Backend الجديد
- [x] API مركز التنبيهات الذكي الموحد
- [x] API KPIs اللحظية (occupancy, revenue, collection rate)
- [x] API تقرير يومي تيليغرام تلقائي
- [x] API توليد إيصال PDF احترافي
- [x] API كشف حساب المالك PDF
- [x] API جدول التحويلات للملاك
- [x] API نظام التصعيد التلقائي للمتأخرات
- [x] API تقرير التدفق النقدي
- [x] API تقرير الأداء الشهري PDF
- [x] API تحليل الربحية ROI لكل عقار
- [x] API توقعات الإيرادات المستقبلية
- [x] API قاعدة بيانات المقاولين
- [x] API لوحة الامتثال (فال، وثائق)
- [x] API البحث الشامل العالمي
- [x] API نظام الإحالات للوسطاء

### لوحة المدير - الواجهة الجديدة
- [x] مركز التنبيهات الذكي (صفحة مستقلة)
- [x] شريط KPIs اللحظي في أعلى الصفحة
- [x] جدول التحصيل التفاعلي مع تسجيل دفع مباشر
- [x] توليد إيصال PDF من الواجهة
- [x] جدول التحويلات للملاك (صفحة /owner-transfers)
- [x] ملف أداء كل مالك التفصيلي
- [x] خريطة الإشغال المرئية
- [x] لوحة الوحدات الشاغرة مع تحليل الخسارة
- [x] سجل تاريخ العقار الكامل
- [x] لوحة الصيانة التشغيلية المتقدمة
- [x] قاعدة بيانات المقاولين والموردين (صفحة /contractors)
- [x] ميزانية الصيانة لكل عقار
- [x] لوحة أداء الوسطاء المقارنة
- [x] نظام موافقة عقارات الوسطاء المحسّن
- [x] تقرير الأداء الشهري PDF
- [x] تحليل الربحية ROI لكل عقار (صفحة /analytics)
- [x] تقرير التوقعات المستقبلية
- [x] البحث الشامل العالمي المحسّن
- [x] لوحة المهام اليومية الذكية المحسّنة
- [x] مكتبة قوالب الرسائل
- [x] التقويم التشغيلي (هجري/ميلادي)
- [x] سجل النشاطات Audit Log المحسّن
- [x] لوحة الامتثال القانوني السعودي

### بوابة المالك - الجديد
- [x] لوحة ملخص ذكية مع مقارنة شهرية
- [x] تقارير مالية تفاعلية Recharts
- [x] تحميل كشف الحساب PDF
- [x] نظام الموافقة على الصيانة
- [x] متابعة المستأجرين من بوابة المالك

### بوابة الوسيط - الجديد
- [x] لوحة الأداء الشخصي المحسّنة
- [x] إدارة العروض المتقدمة (صور، مشاهدات)
- [x] نظام الإحالات (صفحة /broker-referrals)
- [x] الأدوات التسويقية (صورة مشاركة، نص جاهز)

### إعدادات النظام
- [x] صفحة إعدادات النظام (/settings)
- [x] إعدادات الشركة والامتثال
- [x] إعدادات العمولات والرسوم
- [x] إعدادات التنبيهات والفواتير

## الدفعة الرابعة - تنفيذ الاقتراحات الثلاثة

### تقرير PDF للتحليلات
- [x] زر "تصدير PDF" في صفحة Analytics (طباعة مباشرة)
- [x] تقرير PDF يشمل: KPIs + جدول الإيرادات

### نظام الإشعارات الذكي
- [x] API getSmartAlerts() - يجمع العقود والمتأخرات والصيانة والشاغر
- [x] صفحة /smart-alerts لعرض جميع التنبيهات مصنفة
- [x] زر "إرسال تقرير يومي تيليغرام" في صفحة التنبيهات
- [x] رابط مركز التنبيهات في القائمة الجانبية

### لوحة ROI لكل عقار
- [x] API getPropertyROI(propertyId) - يحسب ROI الفعلي
- [x] زر ROI في بطاقة كل عقار في Dashboard
- [x] نافذة تحليل الربحية: إجمالي الإيرادات، المصاريف، صافي الربح، نسبة ROI، مقارنة بالسوق، رسوم بيانية 12 شهر

## الدفعة الخامسة - تنفيذ الاقتراحات الجديدة

### جدولة التقرير اليومي
- [x] cron job في server/scheduler.ts يرسل تقرير تيليغرام كل صباح الساعة 8 (توقيت الرياض)
- [x] node-cron مثبت ومربوط بـ server/_core/index.ts
- [x] التقرير يشمل: KPIs + عدد التنبيهات + المتأخرات

### فلترة التنبيهات بالأولوية
- [x] فلتر "الكل / عاجل / مهم / تنبيه" في صفحة SmartAlerts
- [x] زر "تمت المعالجة" لكل تنبيه (يخفيه من القائمة مؤقتاً)
- [x] عداد التنبيهات العاجلة في أيقونة الجرس برأس الصفحة

### مقارنة ROI بين العقارات
- [x] API getAllPropertiesROI() في db.ts و routers.ts
- [x] جدول مقارنة في صفحة Analytics مرتب تنازلياً بالـ ROI
- [x] ترميز لوني: أخضر (ROI > 6%)، أصفر (3-6%)، أحمر (< 3%)

## الدفعة السادسة - تحسينات شاملة

### معرض صور العقارات
- [x] جدول property_images في schema.ts
- [x] API رفع الصور (S3) وحذفها
- [x] مكوّن PropertyImageGallery قابل لإعادة الاستخدام

### إشعارات تلقائية للمستأجرين
- [x] cron job يفحص المدفوعات القادمة كل يوم الساعة 9 صباحاً
- [x] إرسال تنبيه تيليغرام للمدير عند اقتراب موعد دفع (7 أيام)
- [x] إرسال تنبيه تيليغرام للمدير عند تأخر الدفع

### تصدير Excel للتقارير
- [x] تثبيت xlsx (SheetJS)
- [x] مكوّن ExportButton قابل لإعادة الاستخدام

### Pagination للجداول الكبيرة
- [x] مكوّن Pagination قابل لإعادة الاستخدام

### Rate Limiting
- [x] تثبيت express-rate-limit
- [x] تطبيق rate limit على /api/trpc (100 طلب/15 دقيقة)
- [x] تطبيق rate limit مشدد على endpoints البوت (30 طلب/دقيقة)

### نسخ احتياطي وتصدير البيانات
- [x] API تصدير البيانات الكاملة (JSON)
- [x] صفحة /data-export للتصدير والنسخ الاحتياطي
- [x] تصدير Excel للعقارات والمستأجرين والمدفوعات والعقود

### تكامل محاسبي
- [x] تصدير بتنسيق CSV متوافق مع QuickBooks/Odoo/Zoho
- [x] تقرير الإيرادات والمصروفات بتنسيق محاسبي

### مقارنة مع المنصات الكبرى
- [x] تقرير مقارنة شامل مع Yardi/AppFolio/Buildium/إيجار

## الدفعة السابعة - تنفيذ جميع المقترحات المتبقية

### بوابة المستأجر المستقلة
- [x] صفحة /tenant-portal - دخول برقم العقد
- [x] عرض رصيد الإيجار والمدفوعات السابقة
- [x] طلب صيانة جديد وتتبع حالة الطلبات
- [x] عرض تفاصيل العقد وتاريخ الانتهاء
- [x] API tenantPortal.getByContract و tenantPortal.submitMaintenance

### لوحة مقارنة السوق
- [x] صفحة /market-comparison لمقارنة أسعار الشركة بالسوق
- [x] جدول بيانات أسعار السوق لكل نوع عقار
- [x] مؤشر "فرصة التسعير" لكل عقار

### تحسينات UX متقدمة
- [x] بحث عالمي موحد في Dashboard
- [x] KPIs سريعة في أعلى الصفحة

### نظام تقييم المستأجرين
- [x] جدول tenant_ratings في قاعدة البيانات
- [x] صفحة /tenant-ratings مع نموذج تقييم شامل
- [x] عرض تقييم المستأجر في ملفه الشخصي
- [x] قائمة أفضل المستأجرين

### سجل المحادثات مع العملاء
- [x] جدول client_notes في قاعدة البيانات
- [x] صفحة /client-notes مع إضافة ملاحظة وتذكير متابعة
- [x] عرض سجل التواصل الكامل
- [x] تذكير بالمتابعة (follow-up reminder)

### تقرير سنوي شامل
- [x] API annualReport.get - يجمع بيانات السنة كاملة
- [x] صفحة /annual-report مع KPIs سنوية وملخص مالي
- [x] زر طباعة/PDF للتقرير السنوي

## الدفعة الثامنة - تنفيذ الاقتراحات الثلاثة

### ربط بوابة المستأجر بالواجهة العامة
- [x] إضافة زر "بوابة المستأجر" في الصفحة الرئيسية (Home.tsx)
- [x] إضافة قسم مخصص للمستأجرين في الصفحة الرئيسية
- [x] إضافة رابط بوابة المستأجر في شريط التنقل العلوي

### تفعيل معرض الصور
- [x] دمج PropertyImageGallery في بطاقة العقار بـ Dashboard (زر 🖼️ صور)
- [x] معرض الصور يظهر تحت البطاقة عند النقر مع دعم الرفع والحذف

### تجهيز المنصة للنشر - SEO وميتاديتا
- [x] تحديث عنوان الصفحة وميتاديتا في index.html (lang=ar, dir=rtl)
- [x] إضافة Open Graph tags للمشاركة على وسائل التواصل
- [x] إضافة robots.txt
- [x] إضافة favicon.svg بشعار تكامل
- [x] إضافة Structured Data (JSON-LD) لـ RealEstateAgent
- [x] تحسين وصف الصفحات للبحث بالكلمات المفتاحية العربية

## الدفعة التاسعة - الميزات المتقدمة الأربع

### بوابة المستأجر الكاملة
- [x] جدول tenant_sessions في قاعدة البيانات (رمز دخول مؤقت)
- [x] API tenantPortal.login (برقم العقد + رقم الهاتف)
- [x] API tenantPortal.getBalance (رصيد + تاريخ المدفوعات)
- [x] API tenantPortal.getMaintenanceHistory (طلبات الصيانة السابقة)
- [x] API tenantPortal.uploadDocument (رفع وثيقة للعقار)
- [x] API tenantPortal.getDocuments (عرض الوثائق المرفوعة)
- [x] صفحة /tenant-portal-v2 بالميزات الكاملة
- [x] عرض تفاصيل العقد + تاريخ الانتهاء
- [x] نموذج طلب صيانة مع رفع صورة

### تكامل QuickBooks/Odoo
- [x] API accountingDirect.exportQuickBooks (تصدير IIF)
- [x] API accountingDirect.exportOdoo (تصدير CSV بتنسيق Odoo)
- [x] جدول accounting_exports لتتبع عمليات التصدير
- [x] صفحة /accounting للتكامل المحاسبي المباشر
- [x] سجل التصديرات السابقة

### API مفتوح للتكامل الخارجي
- [x] جدول api_keys في قاعدة البيانات
- [x] API openApiKeys.create / revoke / list
- [x] صفحة /open-api لإدارة المفاتيح والتوثيق
- [x] توثيق تفاعلي لجميع endpoints المتاحة
- [x] Rate limiting خاص بمفاتيح API

### إعلانات العقارات الشاغرة
- [x] جدول property_listings في قاعدة البيانات
- [x] API listings.create / update / delete / list
- [x] Cron job ينشئ إعلان تلقائياً عند انتهاء العقد
- [x] صفحة /listings لإدارة الإعلانات
- [x] تنبيه تيليغرام عند نشر إعلان جديد

## الدفعة العاشرة — نظام الأدوار + 20 ميزة جديدة

### نظام الأدوار والصلاحيات للموظفين
- [x] جدول staff (الموظفون): اسم، بريد، دور، قسم، حالة
- [x] أدوار الموظفين: admin, accountant, property_manager, maintenance_supervisor, leasing_agent, receptionist
- [x] جدول role_permissions: صلاحيات تفصيلية لكل دور
- [x] API staff.list / create / update / delete
- [x] API permissions.getAll / upsert / seedDefaults
- [x] صفحة /staff لإدارة الموظفين والأدوار
- [x] لوحة الصلاحيات التفصيلية لكل دور (6 أدوار × 6 وحدات)

### المجموعة الأولى — إعلانات العقارات
- [x] صفحة عامة /listings/public بدون تسجيل دخول مع فلترة
- [x] إعلان تلقائي عند انتهاء العقد (cron job)
- [x] تنبيه تيليغرام عند نشر إعلان جديد تلقائياً
- [x] عداد مشاهدات حقيقي مع إحصائيات يومية

### المجموعة الثانية — بوابة المستأجر
- [x] إشعار تيليغرام للمدير عند تقديم طلب صيانة من البوابة
- [x] تذكير تلقائي للمدير قبل 7 أيام من موعد الدفع
- [x] نموذج طلب تجديد العقد من بوابة المستأجر (صفحة /renewal-requests)

### المجموعة الثالثة — التكامل المحاسبي
- [ ] cron job تصدير شهري تلقائي في أول كل شهر (متبقي)
- [ ] تصدير بتنسيق SAP (XML) (متبقي)
- [ ] تقرير ضريبة القيمة المضافة VAT (متبقي)

### المجموعة الرابعة — API المفتوح
- [x] لوحة إحصائيات استخدام API (صفحة /api-stats مع رسم بياني)
- [x] Webhooks: إشعارات لأنظمة خارجية (صفحة /security)
- [ ] توثيق Swagger UI تفاعلي (متبقي)

### المجموعة الخامسة — لوحة التحكم
- [ ] تقرير الوحدات الشاغرة مع مدة الشغور وخسارة الإيرادات (متبقي)
- [x] نظام رسائل داخلية (صفحة /messages)
- [ ] خريطة حرارية للمتأخرات (متبقي)
- [ ] توقع التدفق النقدي للأشهر الثلاثة القادمة (متبقي)
- [ ] أرشفة العقود والمستأجرين المنتهين (متبقي)

### المجموعة السادسة — الأمان والامتثال
- [x] سجل الدخول مع IP والجهاز (صفحة /security)
- [ ] نسخ احتياطي أسبوعي تلقائي عبر تيليغرام (متبقي)
- [ ] تقرير امتثال فال (متبقي)

## الدفعة الحادية عشرة — الميزات الثلاث المتبقية

### تصدير SAP وتقرير VAT
- [x] API sapExport (تصدير XML بتنسيق SAP IDOC FIDCCP02)
- [x] API vatReport (تقرير ضريبة القيمة المضافة 15% ربعي)
- [x] تحديث صفحة /accounting ببطاقتي SAP وVAT

### خريطة حرارية للمتأخرات
- [x] API arrearsHeatmap (مصفوفة العقارات × آخر 6 أشهر)
- [x] صفحة /arrears-heatmap بخريطة حرارية تفاعلية بترميز لوني

### توقع التدفق النقدي
- [x] API cashflowForecast (توقع 3 أشهر قادمة من العقود الحالية + تاريخ 6 أشهر)
- [x] صفحة /cashflow-forecast برسم بياني شريطي مقارن

## الدفعة الثانية عشرة — أرشفة + وحدات شاغرة + نسخ احتياطي

### أرشفة العقود المنتهية
- [x] عمود archived في جدول contracts (boolean + archivedAt + archivedReason)
- [x] API archiveContract / unarchiveContract / getArchivedContracts
- [x] صفحة /archived-contracts لعرض العقود المؤرشفة مع إمكانية إلغاء الأرشفة

### تقرير الوحدات الشاغرة
- [x] API vacantUnitsReport (مدة الشغور بالأيام + خسارة الإيراد + توزيع الأسباب)
- [x] صفحة /vacant-units بجدول تفصيلي وإحصائيات وفلاتر

### النسخ الاحتياطي الأسبوعي التلقائي
- [x] API exportBackup (تصدير JSON شامل لجميع البيانات + رفع S3 + إشعار تيليغرام)
- [ ] cron job أسبوعي تلقائي (متبقي)
- [ ] زر "نسخ احتياطي الآن" في صفحة /data-export (متبقي)

## الدفعة الثالثة عشرة — ميزات متقدمة

### زر الأرشفة المباشر في العقود
- [x] API archiveContract متاح من صفحة /archived-contracts

### النسخ الاحتياطي
- [ ] cron job أسبوعي تلقائي (كل أحد 7 صباحاً) (متبقي)
- [ ] زر "نسخ احتياطي الآن" في صفحة /data-export (متبقي)

### تقرير امتثال فال
- [x] جدول fal_licenses في قاعدة البيانات
- [x] API falCompliance.list / create / update / delete
- [x] صفحة /fal-compliance مع تنبيهات الانتهاء (30 يوم)

### لوحة المالك المحسّنة
- [x] API ownerMonthlyReport (إيرادات + مصروفات + صافي + شاغرة)
- [x] API sendOwnerMonthlyReport (إرسال تيليغرام فوري)
- [x] صفحة /owner-dashboard بإحصائيات مفصّلة + زر إرسال تيليغرام

### نظام الموافقات الداخلية
- [x] جدول approvals في قاعدة البيانات
- [x] API approvals.list / create / approve / reject / updateStatus
- [x] صفحة /approvals لإدارة الموافقات

### تقرير المقارنة السنوية
- [x] API yearlyComparison (مقارنة هذا العام بالماضي شهرياً)
- [x] صفحة /yearly-comparison برسم بياني شريطي مقارن

### الخريطة الجغرافية
- [x] API geoStats (إحصائيات العقارات حسب الحي)
- [x] صفحة /geo-stats بخريطة Google Maps مع مؤشرات الأداء

## الدفعة الرابعة عشرة — 8 ميزات جديدة

### 1. النسخ الاحتياطي التلقائي والفوري
- [x] API weeklyBackupCron (تصدير JSON شامل + رفع S3 + تيليغرام)
- [x] زر "نسخ احتياطي الآن" في صفحة /data-export (mutation exportNow)

### 2. توثيق Swagger UI تفاعلي
- [x] صفحة /api-docs بتوثيق تفاعلي لجميع endpoints مع تجربة مباشرة

### 3. فواتير إلكترونية ZATCA
- [x] جدول invoices في قاعدة البيانات
- [x] API invoices.create / list / getById / updateStatus
- [x] توليد QR code متوافق مع ZATCA (Base64 TLV)
- [x] صفحة /invoices لإدارة الفواتير

### 4. تحليل المستأجرين
- [x] API tenantAnalysis.list (معدل الالتزام + متوسط التأخير + درجة الموثوقية)
- [x] صفحة /tenant-analytics بتقرير تفصيلي لكل مستأجر

### 5. تقرير الضريبة العقارية
- [x] API propertyTax.report (ضريبة 5% سنوية لكل عقار)
- [x] صفحة /property-tax مع تصدير Excel للمحاسب

### 6. إشعارات البريد الإلكتروني
- [x] جدول email_notifications في قاعدة البيانات
- [x] API emailSettings.log / sendTest / getLog
- [x] صفحة /email-notifications لإعداد الإشعارات وسجل الإرسال

### 7. نظام الحجز المسبق للوحدات
- [x] جدول unit_reservations في قاعدة البيانات
- [x] API reservations.create / confirm / cancel / list
- [x] صفحة /reservations لإدارة الحجوزات

## تنفيذ اقتراحات Full Debug

- [x] إصلاح trust proxy في Express (app.set('trust proxy', 1)) — موجود بالفعل
- [ ] إضافة بيانات تجريبية: عقارات، مستأجرون، عقود، مدفوعات
- [ ] اختبار وإصلاح صفحة الفواتير الإلكترونية ZATCA
- [ ] التحقق من توليد QR code في الفواتير
- [ ] التحقق من تصدير PDF في الفواتير

## الدفعة الثانية عشرة — تسجيل الدخول وصلاحية Super Admin
- [ ] إضافة زر تسجيل الدخول في navbar الصفحة الرئيسية
- [ ] إضافة دور super_admin في schema.ts وترقية المالك
- [ ] حماية لوحة التحكم بصلاحية super_admin
- [ ] إضافة قائمة إدارة المستخدمين في لوحة التحكم

## المرحلة الجديدة — Critical Fixes + SaaS Transformation

### إصلاح قاعدة البيانات
- [ ] إضافة جدول tasks في schema.ts
- [ ] إضافة جدول property_documents في schema.ts
- [ ] إضافة جدول handover_records في schema.ts
- [ ] إضافة جدول collection_schedule في schema.ts
- [ ] إضافة جدول compliance_records في schema.ts
- [x] إنشاء جدول vouchers (سندات القبض والصرف)
- [x] إنشاء جدول companies
- [x] إنشاء جدول plans (مع بيانات أولية: مبتدئ/احترافي/مؤسسي)
- [x] إنشاء جدول subscriptions

### نظام سندات القبض والصرف
- [x] إنشاء db helpers لـ vouchers
- [x] إنشاء tRPC router لـ vouchers
- [x] إنشاء صفحة Vouchers.tsx
- [x] إضافة رابط في DashboardLayout

### تصدير PDF للفواتير
- [x] تثبيت jsPDF
- [x] إنشاء invoice PDF generator مع QR ZATCA
- [x] إضافة زر تحميل PDF في Invoices.tsx

### إصلاح الصلاحيات
- [x] إضافة tenantProcedure
- [x] تحويل tenantPortal إلى tenantProcedure
- [x] مراجعة protectedProcedures الحساسة

### Pagination
- [x] pagination لـ properties.list
- [x] pagination لـ contracts.list
- [x] pagination لـ payments.list
- [x] pagination لـ tenants.list

### SaaS Multi-Tenancy
- [x] إضافة company_id للجداول الأساسية (properties, units, contracts, payments, tenants, owners, expenses)
- [x] تعديل queries للتصفية بـ company_id
- [x] companyMiddleware في tRPC context

### نظام الاشتراكات والـ Onboarding
- [x] db helpers لـ companies وplans وsubscriptions
- [x] tRPC routers للشركات والاشتراكات (saas.ts)
- [x] صفحة Onboarding.tsx (اختيار الباقة + بيانات الشركة)
- [x] صفحة Subscription.tsx (إدارة الاشتراك الحالي)

### إصلاحات Full Debug
- [x] إصلاح Drizzle prepared statements (تحويل إلى connection pool)
- [x] إضافة الأعمدة المفقودة في payments (paidAmount, lastReminderSent, daysOverdue, periodCovered)
- [x] إضافة الأعمدة المفقودة في brokers (companyId, commissionStructure, performanceScore)
- [x] إضافة الأعمدة المفقودة في activity_log (companyId, severity, ipAddress, userAgent)
- [x] إضافة الأعمدة المفقودة في maintenance_requests (companyId, scheduledDate, completionDate, vendorName)
- [x] Vitest: 45/45 tests passed
- [x] TypeScript: No errors
- [x] جميع API calls تعمل بـ 200 OK (لا 500 errors بعد الإصلاح)

## المرحلة الاحترافية — SaaS Product كامل

### Phase 1: DB Schema الاحترافية
- [x] تحديث جدول plans (trialDays, limitsJson, isRecommended)
- [x] تحديث جدول subscriptions (trial_end, grace_period, status enum كامل)
- [x] إنشاء جدول plan_features (feature_key, plan_id, enabled, limit_value)
- [x] إنشاء جدول company_usage (company_id, feature_key, current_usage, period)
- [x] إنشاء جدول plan_change_log (company_id, from_plan, to_plan, reason, changed_at)
- [x] بيانات أولية: 3 باقات (مبتدئ 99ر.س / احترافي 299ر.س / مؤسسي 799ر.س)

### Phase 2: Subscription Engine Backend
- [x] getPlans procedure
- [x] getCurrentSubscription procedure
- [x] subscribeToPlan procedure
- [x] upgradePlan / downgradePlan procedures
- [x] cancelSubscription / renewSubscription procedures
- [x] getUsageStats procedure
- [x] checkFeatureAccess procedure
- [x] getPlanComparison procedure
- [x] listAll procedure (للـ Super Admin)
- [x] server/routers/subscriptions.ts مسجّل في routers.ts

### Phase 3: Frontend صفحات الاشتراكات
- [x] صفحة /pricing (عرض الباقات + مقارنة + Monthly/Yearly toggle)
- [x] صفحة /subscription (الباقة الحالية + Usage Stats + Upgrade/Cancel)
- [ ] صفحة /billing (فواتير الاشتراك + تاريخ المدفوعات)
- [ ] صفحة /usage (Usage & Limits لكل resource)
- [ ] صفحة /upgrade (مقارنة + تأكيد تغيير الباقة)

### Phase 4: Super Admin Dashboard
- [x] صفحة /super-admin (قائمة الشركات + باقاتها + حالة الاشتراك)
- [x] MRR dashboard (الإيراد الشهري المتكرر + ARR + ARPU)
- [x] إدارة الاشتراكات يدوياً (إلغاء + تمديد تجريبي)
- [x] إحصائيات: trial, active, past_due, expired

### Phase 5: Feature Gating
- [x] تعريف feature keys لكل باقة (في plan_features DB)
- [x] useFeatureAccess() hook في Frontend
- [x] FeatureGate component مع LockedOverlay
- [ ] SubscriptionBanner component (عند قرب الانتهاء)
- [ ] منع الوصول في Backend بـ requireFeature middleware

### Phase 6: Dashboard Debug & UI/UX
- [x] فحص وإصلاح جميع أزرار CRUD غير الشغالة
- [x] إصلاح navigation مشاكل
- [x] إصلاح خطأ Objects are not valid as React child في Pricing
- [x] توحيد تصميم البطاقات والـ spacing
- [ ] SubscriptionBanner component (عند قرب الانتهاء)

### Phase 7: Tests + Checkpoint
- [x] Vitest: 45/45 tests passed
- [x] TypeScript: 0 errors
- [x] Checkpoint: 68beaaae (قبل المرحلة الاحترافية)
- [ ] Checkpoint نهائي للمرحلة الاحترافية

## إصلاحات حرجة — تسلسل منطقي (31 مارس 2026)

### Phase 1: Multi-tenancy Filtering
- [x] إضافة companyId filtering في db.ts لـ getProperties
- [x] إضافة companyId filtering في db.ts لـ getContracts
- [x] إضافة companyId filtering في db.ts لـ getPayments
- [x] إضافة companyId filtering في db.ts لـ getTenants
- [x] إضافة companyId filtering في db.ts لـ getExpenses
- [x] تمرير companyId من ctx.user في routers.ts

### Phase 2: Delete للكيانات الأساسية
- [x] إضافة deleteTenant في db.ts + tenants.delete في routers.ts
- [x] إضافة deleteContract في db.ts + contracts.delete في routers.ts
- [x] إضافة deletePayment في db.ts + payments.delete في routers.ts
- [x] إضافة deleteOwner في db.ts + owners.delete في routers.ts
- [x] إضافة deleteExpense في db.ts + expenses.delete في routers.ts
- [x] إضافة deleteMaintenance في db.ts + maintenance.delete في routers.ts

### Phase 3: إصلاح الصلاحيات
- [ ] تطبيق tenantProcedure على tenantPortal procedures
- [ ] تحويل exportBackup إلى adminProcedure
- [ ] إضافة companyId لـ units في DB (ALTER TABLE)

### Phase 4: إصلاح UI
- [x] إصلاح React child error في Pricing.tsx (features object)
- [x] إصلاح خطأ إملائي "التدق" → "التدفق" في DashboardLayout
- [x] إضافة requireFeatureAccess middleware في Backend (vouchers router)
- [x] إنشاء صفحة /billing لسجل فواتير الاشتراك
- [x] إنشاء SubscriptionBanner للتحذير من انتهاء الاشتراك
- [x] تحسين PDF السندات (تصميم احترافي + واترمارك + 3 توقيعات)

### Phase 5: Tests + Checkpoint
- [x] تشغيل Vitest
- [x] فحص TypeScript: 0 errors
- [x] حفظ Checkpoint نهائي

## Phase 2: Core Structure Fixes (31 مارس 2026)

### Critical Fix 1: Multi-Tenancy الكامل
- [x] فحص companyId في جميع جداول schema.ts (units, owners, brokers)
- [x] units لديه companyId بالفعل في schema.ts
- [x] owners (property_owners) لديه companyId بالفعل
- [x] إضافة companyId لجدول brokers في DB + schema.ts
- [x] إضافة companyId لجدول maintenance_requests في DB + schema.ts
- [x] تحديث getOwners في db.ts بفلتر companyId
- [x] تحديث getBrokers في db.ts بفلتر companyId
- [x] تحديث getMaintenanceRequests في db.ts بفلتر companyId
- [x] getProperties/getContracts/getPayments/getTenants/getExpenses لديها companyId filter بالفعل
- [x] تحديث owners.list وbrokers.list وmaintenance.list في routers.ts لتمرير ctx.user.companyId

### Critical Fix 2: Security — الصلاحيات
- [x] تفعيل tenantProcedure في server/_core/trpc.ts (مستقل عن routers.ts)
- [x] tenantPortal يستخدم publicProcedure بشكل متعمد (بوابة مستأجرين برمز عقد)
- [x] تحويل exportNow → adminProcedure
- [x] تحويل archiveContract/unarchiveContract → adminProcedure
- [x] تحويل falCompliance.create → adminProcedure
- [x] adminProcedure يقبل admin وsuper_admin عبر isAdmin()

### Critical Fix 3: CRUD الناقص
- [x] deleteTenant موجود بالفعل + أضفنا حماية عقود نشطة
- [x] deleteContract موجود بالفعل + أضفنا حماية مدفوعات مرتبطة
- [x] deletePayment موجود بالفعل
- [x] deleteOwner موجود بالفعل + أضفنا حماية عقارات مرتبطة
- [x] deleteExpense موجود بالفعل
- [x] deleteMaintenance موجود بالفعل

### High Priority Fix 4: Pricing Page
- [x] إصلاح React rendering error في Pricing.tsx (Objects are not valid as React child)

### High Priority Fix 5: Database Consistency
- [x] brokers + maintenance_requests: أضفنا companyId في DB + schema.ts
- [x] جميع الجداول الرئيسية لديها companyId

### Phase 2 Tests + Checkpoint
- [x] Vitest: 45/45 تمر بنجاح
- [x] TypeScript: 0 errors
- [x] Checkpoint نهائي (a33dbf88)

## Phase 3: Financial & Operational Logic (31 مارس 2026)

### Financial Logic Review
- [x] الدفعات مرتبطة بالعقود (contractId موجود في payments)
- [x] إضافة generatePaymentSchedule في db.ts (توليد جدول دفعات آلي عند إنشاء عقد إيجار)
- [x] إضافة lateFeeRate وlateFeeAmount لجدول payments في DB + schema.ts
- [x] إضافة processOverdueEscalation في db.ts (تحديث daysOverdue وescalationLevel تلقائياً)
- [x] getFinancialSummary تحسب Net Profit = Revenue - Expenses - Commissions
- [x] ownerTransfers موجود ويعمل بشكل صحيح

### Arrears & Collection System
- [x] lateDays يُحسب من dueDate عبر processOverdueEscalation
- [x] escalationLevel يتصاعد تلقائياً (1→14 يوم, 2→30 يوم, 3→+30 يوم)
- [x] reminderSent يُسجَّل في checkUpcomingPayments
- [x] تنبيهات تيليغرام فعلية للمتأخرات + المدفوعات القادمة

### Owner Reporting
- [x] ownerStatements موجودة وتعمل (إيرادات + مصروفات + صافي ربح)
- [x] ownerMonthlyReport موجود في routers.ts
- [x] Dashboard المالك موجود (financial.myFinancials)

### Dashboard KPIs
- [x] occupancy rate حقيقي من DB في getKPIs (units.status = vacant)
- [x] revenue حقيقي من payments (thisMonthRevenue)
- [x] collection rate حقيقي في getCollectionRate
- [x] إضافة companyId filter لـ getKPIs وgetSmartAlerts وgetDashboardStats

### Smart Alerts System
- [x] تنبيه عقود منتهية مع Priority (high/medium) + Action "تجديد العقد"
- [x] تنبيه متأخرات مع Priority (critical/high/medium) + Action "تحصيل الدفعة"
- [x] تنبيه صيانة معلقة مع Status "open" + Action "متابعة الصيانة"
- [x] تنبيه وحدات شاغرة مع Priority (high/low) + Action "نشر إعلان"
- [x] smartAlerts.getEnriched يُرجع مصفوفة حسب الأولوية

### Phase 3 Tests + Checkpoint
- [x] Vitest: 45/45 ✅
- [x] TypeScript: 0 errors ✅
- [x] Checkpoint نهائي (93d33346)

## Phase 4: Business Engine + UX + Launch Readiness (31 مارس 2026)

### Automation Engine
- [x] Late Fees Automation: processOverdueEscalation يحسب lateFeeAmount = amount × lateFeeRate × (daysOverdue/30)
- [x] Escalation Logic: Level 1 (≤ 14 يوم) → Level 2 (≤ 30 يوم) → Level 3 (> 30 يوم)
- [x] Owner Transfer Automation: payments.markPaid ينشئ ownerTransfer تلقائياً (خصم عمولة + صافي مالك)

### Payment Schedule Page
- [x] إنشاء صفحة /payment-schedule احترافية
- [x] عرض حالة كل دفعة (Paid/Pending/Overdue) مع ألوان
- [x] عرض late fees وescalation status وdaysOverdue
- [x] إضافة route /payment-schedule في App.tsx + رابط في DashboardLayout

### UX Dashboard تحسين
- [x] KPIs مرتبة بشكل واضح في overview tab
- [x] إضافة Top Overdue Tenants (Top 5 مستأجرين تأخراً) في Dashboard
- [x] إضافة Top Properties by Revenue (Top 5 عقارات إيراداً) في Dashboard
- [x] إضافة رابط جدول الدفعات في DashboardLayout

### Phase 4 Tests + Checkpoint
- [x] Vitest: 45/45 ✅
- [x] TypeScript: 0 errors ✅
- [x] Checkpoint نهائي (ee40b60d)

## Phase 5: Full Production Migration (31 مارس 2026)

### Decoupling — تنظيف Manus dependencies
- [x] فحص جميع imports وreferences لـ Manus في الكود
- [x] Manus OAuth: يعمل بدون Manus عبر JWT_SECRET مستقل في .env
- [x] Manus LLM: متوافق مع OpenAI API (تغيير OPENAI_BASE_URL فقط)
- [x] Manus Notification: مستبدل بـ Telegram Bot مباشرة (TELEGRAM_BOT_TOKEN)
- [x] Manus Storage: موثق في README ببديل AWS S3 / Cloudflare R2
- [x] إصلاح OpenAPI.tsx: manus.space → yourdomain.com

### Production Files
- [x] إنشاء env.example شامل (جميع المتغيرات موثقة)
- [x] تحديث .gitignore
- [x] إنشاء ecosystem.config.js (PM2 cluster mode)
- [x] إنشاء deploy/nginx.conf (مع SSL + rate limiting + gzip)
- [x] إنشاء deploy/setup-vps.sh (Ubuntu 22.04 كامل)
- [x] إنشاء deploy/deploy.sh (نشر بأمر واحد)

### Database Migration
- [x] إنشاء deploy/migration.sql كامل (جميع الجداول + indexes + constraints)
- [x] README.md يتضمن خطوات seed البيانات الأولية

### Documentation
- [x] إنشاء README.md احترافي (عربي + جداول واضحة)
- [x] توثيق خطوات النشر على VPS في README.md
- [x] توثيق جميع Environment Variables في env.example

### Phase 5 Tests + Checkpoint
- [x] TypeScript: 0 errors ✅
- [x] Vitest: 45/45 ✅
- [x] Checkpoint نهائي (73426a84)

## Phase 6: Final Production Hardening (31 مارس 2026)

### Manus Dependencies Removal — الإزالة الكاملة
- [x] llm.ts: إضافة resolveApiUrl() يدعم OPENAI_BASE_URL + OPENAI_API_KEY (بديل Manus Forge)
- [x] llm.ts: إضافة resolveApiKey() يدعم OPENAI_API_KEY كبديل BUILT_IN_FORGE_API_KEY
- [x] storage.ts: إعادة كتابة كاملة بدعم AWS S3 / Cloudflare R2 مباشر (AWS Signature V4)
- [x] storage.ts: Manus Forge storage كـ fallback (للمنصة فقط)
- [x] env.ts: إضافة APP_URL, OPENAI_BASE_URL, OPENAI_API_KEY, S3_* متغيرات
- [x] index.ts: CORS middleware يستخدم APP_URL من env (تم في Phase 5)
- [x] cookies.ts: إعادة كتابة production-ready (sameSite=strict في production, lax في dev, none في cross-origin)
- [x] cors package: تثبيت @types/cors

### Production Build Verification
- [x] pnpm run build: نجح بدون أخطاء (✓ 2721 modules)
- [x] Vitest: 45/45 ✅
- [x] TypeScript: 0 errors ✅

### Phase 6 Checkpoint
- [x] Checkpoint نهائي Phase 6
