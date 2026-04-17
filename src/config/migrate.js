require('dotenv').config();
const { sequelize } = require('../models');

const migrate = async () => {
  try {
    console.log('🔄 جاري مزامنة قاعدة البيانات...');
    await sequelize.sync({ alter: true });
    console.log('✅ تم إنشاء/تحديث جميع الجداول بنجاح.');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ في مزامنة قاعدة البيانات:', error.message);
    process.exit(1);
  }
};

migrate();
