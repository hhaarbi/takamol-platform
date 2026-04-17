const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ticket_number: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
  },
  client_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'clients', key: 'id' }
  },
  client_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'رقم الهاتف في حال لم يكن العميل مسجلاً'
  },
  assigned_to: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  subject: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  channel: {
    type: DataTypes.ENUM('whatsapp', 'phone', 'walk_in', 'email'),
    defaultValue: 'whatsapp'
  },
  category: {
    type: DataTypes.ENUM('licenses', 'survey', 'reports', 'design', 'pricing', 'complaint', 'general'),
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('open', 'in_progress', 'waiting_client', 'resolved', 'closed'),
    defaultValue: 'open'
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resolution_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'tickets'
});

module.exports = Ticket;
