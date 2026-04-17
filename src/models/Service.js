const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Service = sequelize.define('Service', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  service_code: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false,
    comment: 'مثال: LIC-01, SUR-01, REP-01, DES-01'
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('licenses', 'survey', 'reports', 'design'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  department: {
    type: DataTypes.ENUM('licenses', 'survey', 'reports', 'design'),
    allowNull: false,
    comment: 'القسم المسؤول عن تنفيذ هذه الخدمة'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'services'
});

module.exports = Service;
