const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // الكود الفريد للمعاملة مثل LIC-26-001
  transaction_code: {
    type: DataTypes.STRING(30),
    unique: true,
    allowNull: false
  },
  quotation_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'quotations', key: 'id' }
  },
  client_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'clients', key: 'id' }
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  primary_category: {
    type: DataTypes.ENUM('licenses', 'survey', 'reports', 'design'),
    allowNull: false,
    comment: 'الفئة الرئيسية التي يُبنى عليها الكود'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  total_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  // حالة المعاملة الكاملة
  status: {
    type: DataTypes.ENUM(
      'pending_payment',    // بانتظار تأكيد الدفعة الأولى
      'in_progress',        // قيد التنفيذ
      'on_hold',            // موقوفة
      'completed',          // مكتملة
      'cancelled'           // ملغاة
    ),
    defaultValue: 'pending_payment'
  },
  // المرحلة الحالية في سير العمل
  current_stage: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'المرحلة الحالية مثل: accounting, survey, licenses, design'
  },
  // تفاصيل سير العمل
  workflow_stages: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'مصفوفة المراحل المطلوبة مع حالة كل مرحلة'
  },
  // بيانات المشروع
  project_location: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  land_area: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  deed_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'رقم الصك'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'transactions'
});

module.exports = Transaction;
