const sequelize = require('../config/database');
const User = require('./User');
const Client = require('./Client');
const Appointment = require('./Appointment');
const Ticket = require('./Ticket');
const TicketMessage = require('./TicketMessage');
const Service = require('./Service');
const Quotation = require('./Quotation');
const Transaction = require('./Transaction');
const WorkflowTask = require('./WorkflowTask');

// ========== العلاقات ==========

// المستخدم - المواعيد
User.hasMany(Appointment, { foreignKey: 'engineer_id', as: 'engineerAppointments' });
User.hasMany(Appointment, { foreignKey: 'created_by', as: 'createdAppointments' });
Appointment.belongsTo(User, { foreignKey: 'engineer_id', as: 'engineer' });
Appointment.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// العميل - المواعيد
Client.hasMany(Appointment, { foreignKey: 'client_id', as: 'appointments' });
Appointment.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

// التذاكر
Client.hasMany(Ticket, { foreignKey: 'client_id', as: 'tickets' });
Ticket.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });
User.hasMany(Ticket, { foreignKey: 'assigned_to', as: 'assignedTickets' });
Ticket.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignedEngineer' });
Ticket.hasMany(TicketMessage, { foreignKey: 'ticket_id', as: 'messages' });
TicketMessage.belongsTo(Ticket, { foreignKey: 'ticket_id' });
TicketMessage.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// التسعير
Client.hasMany(Quotation, { foreignKey: 'client_id', as: 'quotations' });
Quotation.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });
User.hasMany(Quotation, { foreignKey: 'created_by', as: 'createdQuotations' });
Quotation.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Quotation.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });
Appointment.hasMany(Quotation, { foreignKey: 'appointment_id', as: 'quotations' });
Quotation.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });

// المعاملات
Client.hasMany(Transaction, { foreignKey: 'client_id', as: 'transactions' });
Transaction.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });
Quotation.hasOne(Transaction, { foreignKey: 'quotation_id', as: 'transaction' });
Transaction.belongsTo(Quotation, { foreignKey: 'quotation_id', as: 'quotation' });
User.hasMany(Transaction, { foreignKey: 'created_by', as: 'createdTransactions' });
Transaction.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// مهام سير العمل
Transaction.hasMany(WorkflowTask, { foreignKey: 'transaction_id', as: 'tasks' });
WorkflowTask.belongsTo(Transaction, { foreignKey: 'transaction_id', as: 'transaction' });
User.hasMany(WorkflowTask, { foreignKey: 'assigned_to', as: 'assignedTasks' });
WorkflowTask.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignedUser' });

module.exports = {
  sequelize,
  User,
  Client,
  Appointment,
  Ticket,
  TicketMessage,
  Service,
  Quotation,
  Transaction,
  WorkflowTask
};
