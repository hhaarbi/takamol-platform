const { Transaction, Quotation, Client, User, WorkflowTask } = require('../models');
const { generateTransactionCode } = require('../services/codeGenerator');
const { createWorkflowTasks, advanceWorkflow } = require('../services/workflowService');
const { Op } = require('sequelize');

// تحويل تسعير معتمد إلى معاملة نشطة
exports.convertFromQuotation = async (req, res) => {
  try {
    const { quotation_id, project_location, land_area, deed_number, notes } = req.body;

    const quotation = await Quotation.findByPk(quotation_id, {
      include: [{ model: Client, as: 'client' }]
    });

    if (!quotation) return res.status(404).json({ success: false, message: 'التسعير غير موجود.' });
    if (quotation.status !== 'client_accepted') {
      return res.status(400).json({ success: false, message: 'يجب تسجيل موافقة العميل على التسعير أولاً.' });
    }

    // تحديد الفئة الرئيسية من أول بند في التسعير
    const firstItem = quotation.items[0];
    const categoryMap = { LIC: 'licenses', SUR: 'survey', REP: 'reports', DES: 'design' };
    const codePrefix = firstItem?.service_code?.split('-')[0] || 'LIC';
    const primary_category = categoryMap[codePrefix] || 'licenses';

    const transaction_code = await generateTransactionCode(primary_category);

    const transaction = await Transaction.create({
      transaction_code,
      quotation_id,
      client_id: quotation.client_id,
      created_by: req.user.id,
      primary_category,
      title: `${quotation.items.map(i => i.service_name).join(' + ')} - ${quotation.client.full_name}`,
      total_amount: quotation.total_amount,
      project_location,
      land_area,
      deed_number,
      notes,
      status: 'pending_payment'
    });

    // إنشاء مهام سير العمل تلقائياً
    await createWorkflowTasks(transaction, quotation.items);

    // تحديث حالة التسعير
    await quotation.update({ status: 'converted' });

    const result = await Transaction.findByPk(transaction.id, {
      include: [
        { model: Client, as: 'client', attributes: ['id', 'full_name', 'phone'] },
        { model: WorkflowTask, as: 'tasks', order: [['stage_order', 'ASC']] }
      ]
    });

    res.status(201).json({
      success: true,
      message: `تم إنشاء المعاملة بنجاح. الكود: ${transaction_code}. في انتظار تأكيد الدفعة من المحاسبة.`,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// قائمة المعاملات
exports.getAll = async (req, res) => {
  try {
    const { status, primary_category, current_stage } = req.query;
    const where = {};
    if (status) where.status = status;
    if (primary_category) where.primary_category = primary_category;
    if (current_stage) where.current_stage = current_stage;

    // الموظف يرى المعاملات الموكلة إليه فقط عبر مهام سير العمل
    if (!['super_admin', 'admin'].includes(req.user.role)) {
      if (req.user.role === 'dept_head') {
        // مدير القسم يرى معاملات قسمه
        const deptTransactions = await WorkflowTask.findAll({
          where: { assigned_dept: req.user.department },
          attributes: ['transaction_id'],
          group: ['transaction_id']
        });
        where.id = { [Op.in]: deptTransactions.map(t => t.transaction_id) };
      } else {
        // الموظف يرى المعاملات التي لديه مهام فيها
        const myTasks = await WorkflowTask.findAll({
          where: { assigned_to: req.user.id },
          attributes: ['transaction_id'],
          group: ['transaction_id']
        });
        where.id = { [Op.in]: myTasks.map(t => t.transaction_id) };
      }
    }

    const transactions = await Transaction.findAll({
      where,
      include: [
        { model: Client, as: 'client', attributes: ['id', 'full_name', 'phone'] },
        { model: User, as: 'creator', attributes: ['id', 'full_name', 'employee_code'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// تفاصيل معاملة كاملة
exports.getById = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client' },
        { model: Quotation, as: 'quotation' },
        { model: User, as: 'creator', attributes: ['id', 'full_name', 'employee_code'] },
        {
          model: WorkflowTask, as: 'tasks',
          include: [{ model: User, as: 'assignedUser', attributes: ['id', 'full_name', 'employee_code'] }],
          order: [['stage_order', 'ASC']]
        }
      ]
    });
    if (!transaction) return res.status(404).json({ success: false, message: 'المعاملة غير موجودة.' });
    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// تعيين موظف لمهمة في سير العمل
exports.assignTask = async (req, res) => {
  try {
    const { task_id, assigned_to, due_date } = req.body;
    const task = await WorkflowTask.findByPk(task_id);
    if (!task) return res.status(404).json({ success: false, message: 'المهمة غير موجودة.' });

    await task.update({ assigned_to, due_date, status: 'in_progress', started_at: new Date() });
    res.json({ success: true, message: 'تم تعيين الموظف للمهمة.', data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// إكمال مرحلة والانتقال للتالية
exports.completeStage = async (req, res) => {
  try {
    const { stage_name, completion_notes } = req.body;
    const result = await advanceWorkflow(req.params.id, stage_name, completion_notes, req.user.id);
    res.json({ success: true, message: 'تم إكمال المرحلة والانتقال للمرحلة التالية.', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// لوحة تحكم الإدارة - إحصائيات
exports.getDashboard = async (req, res) => {
  try {
    const { sequelize } = require('../models');

    const [total, byStatus, byCategory] = await Promise.all([
      Transaction.count(),
      Transaction.findAll({
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status']
      }),
      Transaction.findAll({
        attributes: ['primary_category', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['primary_category']
      })
    ]);

    res.json({ success: true, data: { total, by_status: byStatus, by_category: byCategory } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};
