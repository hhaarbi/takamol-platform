const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  client_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'clients', key: 'id' }
  },
  engineer_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  appointment_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  appointment_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  duration_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 60,
    validate: { isIn: [[15, 30, 60, 90]] }
  },
  meeting_type: {
    type: DataTypes.ENUM('initial_consultation', 'design_review', 'contract_signing', 'site_visit', 'follow_up'),
    defaultValue: 'initial_consultation'
  },
  service_category: {
    type: DataTypes.ENUM('licenses', 'survey', 'reports', 'design', 'other'),
    allowNull: false
  },
  // نموذج الفرز المسبق
  pre_qualification: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'بيانات الفرز المسبق: مساحة الأرض، الموقع، الميزانية، حالة الصك'
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'),
    defaultValue: 'pending'
  },
  cancellation_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reminder_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'appointments'
});

module.exports = Appointment;
