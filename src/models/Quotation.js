const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Quotation = sequelize.define('Quotation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  quotation_number: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
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
  approved_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  appointment_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'appointments', key: 'id' }
  },
  // بنود التسعير اليدوي
  items: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'مصفوفة من: {service_code, service_name, price, notes, sub_items: [{name, price}]}'
  },
  total_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // حالة دورة التعميد
  status: {
    type: DataTypes.ENUM('draft', 'pending_approval', 'approved', 'rejected', 'client_accepted', 'client_rejected', 'converted'),
    defaultValue: 'draft'
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  approval_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  client_response_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  validity_days: {
    type: DataTypes.INTEGER,
    defaultValue: 30
  },
  // تتبع المتابعة
  follow_up_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  follow_up_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'quotations'
});

module.exports = Quotation;
