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
