const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TicketMessage = sequelize.define('TicketMessage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ticket_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'tickets', key: 'id' }
  },
  sender_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  sender_type: {
    type: DataTypes.ENUM('staff', 'client', 'system'),
    defaultValue: 'staff'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  is_internal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'ملاحظة داخلية لا يراها العميل'
  }
}, {
  tableName: 'ticket_messages'
});

module.exports = TicketMessage;
