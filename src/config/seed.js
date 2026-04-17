require('dotenv').config();
const { sequelize, User, Service } = require('../models');

const services = [
  // رخص البناء
  { service_code: 'LIC-01', name: 'رخصة بناء جديدة', category: 'licenses', department: 'licenses', sort_order: 1 },
  { service_code: 'LIC-02', name: 'تمديد رخصة بناء', category: 'licenses', department: 'licenses', sort_order: 2 },
  { service_code: 'LIC-03', name: 'تعديل على رخصة قائمة', category: 'licenses', department: 'licenses', sort_order: 3 },
  { service_code: 'LIC-04', name: 'رخصة هدم', category: 'licenses', department: 'licenses', sort_order: 4 },
  { service_code: 'LIC-05', name: 'شهادة إتمام البناء', category: 'licenses', department: 'licenses', sort_order: 5 },
  { service_code: 'LIC-06', name: 'رخصة إضافة دور', category: 'licenses', department: 'licenses', sort_order: 6 },
  // الخدمات المساحية
  { service_code: 'SUR-01', name: 'رفع مساحي للأرض', category: 'survey', department: 'survey', sort_order: 1 },
  { service_code: 'SUR-02', name: 'تحديث صك', category: 'survey', department: 'survey', sort_order: 2 },
  { service_code: 'SUR-03', name: 'تقسيم أرض', category: 'survey', department: 'survey', sort_order: 3 },
  { service_code: 'SUR-04', name: 'دمج قطعتين', category: 'survey', department: 'survey', sort_order: 4 },
  { service_code: 'SUR-05', name: 'تحديد حدود الأرض', category: 'survey', department: 'survey', sort_order: 5 },
  { service_code: 'SUR-06', name: 'كروكي موقع', category: 'survey', department: 'survey', sort_order: 6 },
  // التقارير ودراسة التربة
  { service_code: 'REP-01', name: 'دراسة تربة', category: 'reports', department: 'reports', sort_order: 1 },
  { service_code: 'REP-02', name: 'تقرير فني للمنشأة', category: 'reports', department: 'reports', sort_order: 2 },
  { service_code: 'REP-03', name: 'تقرير كشف عيوب', category: 'reports', department: 'reports', sort_order: 3 },
  { service_code: 'REP-04', name: 'تقرير تقييم عقاري', category: 'reports', department: 'reports', sort_order: 4 },
  // التصميم والإشراف
  { service_code: 'DES-01', name: 'تصميم معماري', category: 'design', department: 'design', sort_order: 1 },
  { service_code: 'DES-02', name: 'تصميم إنشائي', category: 'design', department: 'design', sort_order: 2 },
  { service_code: 'DES-03', name: 'تصميم كهربائي', category: 'design', department: 'design', sort_order: 3 },
  { service_code: 'DES-04', name: 'تصميم صحي', category: 'design', department: 'design', sort_order: 4 },
  { service_code: 'DES-05', name: 'إشراف هندسي', category: 'design', department: 'design', sort_order: 5 },
  { service_code: 'DES-06', name: 'حصر كميات', category: 'design', department: 'design', sort_order: 6 }
];

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('🔄 جاري إدراج البيانات الأولية...');

    // إنشاء حساب Super Admin
    const adminExists = await User.findOne({ where: { username: process.env.SUPER_ADMIN_USERNAME } });
    if (!adminExists) {
      await User.create({
        username: process.env.SUPER_ADMIN_USERNAME,
        password: process.env.SUPER_ADMIN_PASSWORD,
        full_name: 'مدير النظام',
        email: process.env.SUPER_ADMIN_EMAIL,
        role: 'super_admin',
        department: 'management',
        employee_code: 'MGT-001',
        is_active: true
      });
      console.log(`✅ تم إنشاء حساب المدير: ${process.env.SUPER_ADMIN_USERNAME}`);
    }

    // إدراج الخدمات
    for (const svc of services) {
      await Service.findOrCreate({ where: { service_code: svc.service_code }, defaults: svc });
    }
    console.log(`✅ تم إدراج ${services.length} خدمة.`);

    console.log('🎉 اكتمل إدراج البيانات الأولية بنجاح.');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ في إدراج البيانات:', error.message);
    process.exit(1);
  }
};

seed();
