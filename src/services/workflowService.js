const { Transaction, WorkflowTask, User } = require('../models');

/**
 * تحديد مراحل سير العمل بناءً على الخدمات في المعاملة
 */
const buildWorkflowStages = (items) => {
  const stages = [];
  let order = 1;

  // المرحلة الأولى دائماً: المحاسبة لتأكيد الدفعة
  stages.push({
    stage_name: 'accounting',
    stage_order: order++,
    assigned_dept: 'accounting',
    title: 'تأكيد استلام الدفعة الأولى',
    description: 'يرجى تأكيد استلام الدفعة الأولى من العميل لبدء تنفيذ المعاملة.',
    status: 'active'
  });

  const categories = new Set(items.map(i => i.category || i.service_code?.split('-')[0]?.toLowerCase()));
  const serviceNames = items.map(i => i.service_name || '').join(' ').toLowerCase();

  // إضافة مرحلة المساحة إذا وُجدت خدمات مساحية
  const needsSurvey = categories.has('sur') || serviceNames.includes('مساح') || serviceNames.includes('صك') || serviceNames.includes('رفع');
  if (needsSurvey) {
    stages.push({
      stage_name: 'survey',
      stage_order: order++,
      assigned_dept: 'survey',
      title: 'تنفيذ الأعمال المساحية',
      description: 'تنفيذ الرفع المساحي وإعداد التقارير والمخططات المساحية المطلوبة.',
      status: 'waiting'
    });
  }

  // إضافة مرحلة التقارير إذا وُجدت
  const needsReports = categories.has('rep') || serviceNames.includes('تربة') || serviceNames.includes('تقرير');
  if (needsReports) {
    stages.push({
      stage_name: 'reports',
      stage_order: order++,
      assigned_dept: 'reports',
      title: 'إعداد التقارير الفنية',
      description: 'إعداد دراسات التربة والتقارير الفنية المطلوبة للمشروع.',
      status: 'waiting'
    });
  }

  // إضافة مرحلة التصميم إذا وُجدت
  const needsDesign = categories.has('des') || serviceNames.includes('تصميم') || serviceNames.includes('مخطط') || serviceNames.includes('إشراف');
  if (needsDesign) {
    stages.push({
      stage_name: 'design',
      stage_order: order++,
      assigned_dept: 'design',
      title: 'التصميم الهندسي والمعماري',
      description: 'إعداد المخططات المعمارية والإنشائية والإشراف الهندسي.',
      status: 'waiting'
    });
  }

  // إضافة مرحلة الرخص إذا وُجدت
  const needsLicenses = categories.has('lic') || serviceNames.includes('رخصة') || serviceNames.includes('تعديل') || serviceNames.includes('شهادة');
  if (needsLicenses) {
    stages.push({
      stage_name: 'licenses',
      stage_order: order++,
      assigned_dept: 'licenses',
      title: 'إجراءات الرخص والتراخيص البلدية',
      description: 'تقديم الطلبات وإنهاء إجراءات الرخص عبر منصة بلدي والجهات المختصة.',
      status: 'waiting'
    });
  }

  // المرحلة الأخيرة: الإغلاق والتسليم
  stages.push({
    stage_name: 'delivery',
    stage_order: order++,
    assigned_dept: 'management',
    title: 'التسليم النهائي وإغلاق المعاملة',
    description: 'مراجعة جميع المخرجات وتسليمها للعميل وإغلاق المعاملة رسمياً.',
    status: 'waiting'
  });

  return stages;
};

/**
 * إنشاء مهام سير العمل لمعاملة جديدة
 */
const createWorkflowTasks = async (transaction, items) => {
  const stages = buildWorkflowStages(items);

  const tasks = await WorkflowTask.bulkCreate(
    stages.map(stage => ({
      transaction_id: transaction.id,
      ...stage
    }))
  );

  await transaction.update({
    workflow_stages: stages,
    current_stage: 'accounting'
  });

  return tasks;
};

/**
 * الانتقال للمرحلة التالية في سير العمل
 */
const advanceWorkflow = async (transactionId, completedStage, completionNotes, userId) => {
  const transaction = await Transaction.findByPk(transactionId, {
    include: [{ model: WorkflowTask, as: 'tasks', order: [['stage_order', 'ASC']] }]
  });

  if (!transaction) throw new Error('المعاملة غير موجودة');

  // إكمال المرحلة الحالية
  const currentTask = transaction.tasks.find(
    t => t.stage_name === completedStage && t.status === 'in_progress'
  );

  if (currentTask) {
    await currentTask.update({
      status: 'completed',
      completed_at: new Date(),
      completion_notes: completionNotes
    });
  }

  // تفعيل المرحلة التالية
  const nextTask = transaction.tasks
    .sort((a, b) => a.stage_order - b.stage_order)
    .find(t => t.status === 'waiting');

  if (nextTask) {
    await nextTask.update({ status: 'active', started_at: new Date() });
    await transaction.update({ current_stage: nextTask.stage_name });
  } else {
    // لا توجد مراحل متبقية - إغلاق المعاملة
    await transaction.update({
      status: 'completed',
      current_stage: 'completed',
      completed_at: new Date()
    });
  }

  return transaction.reload({ include: [{ model: WorkflowTask, as: 'tasks' }] });
};

module.exports = { buildWorkflowStages, createWorkflowTasks, advanceWorkflow };
