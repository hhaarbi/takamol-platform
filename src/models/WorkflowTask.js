const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkflowTask = sequelize.define('WorkflowTask', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  transaction_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'transactions', key: 'id' }
  },
  stage_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'اسم المرحلة: accounting, survey, licenses, design, reports'
  },
  stage_order: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  assigned_to: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  assigned_dept: {
    type: DataTypes.ENUM('management', 'licenses', 'survey', 'design', 'reports', 'sales', 'accounting'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('waiting', 'active', 'in_progress', 'completed', 'rejected'),
    defaultValue: 'waiting'
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completion_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'مسارات الملفات المرفوعة'
  }
}, {
  tableName: 'workflow_tasks'
});

module.exports = WorkflowTask;
