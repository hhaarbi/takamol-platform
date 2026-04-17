const { Quotation, Client, User, Appointment } = require('../models');
const { generateQuotationNumber } = require('../services/codeGenerator');
const { Op } = require('sequelize');

// إنشاء مسودة تسعير جديدة
exports.create = async (req, res) => {
  try {
    const { client_id, appointment_id, items, notes, validity_days } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'يجب إضافة خدمة واحدة على الأقل.' });
    }

    // حساب الإجمالي من الأسعار اليدوية
    let total = 0;
    items.forEach(item => {
      total += parseFloat(item.price || 0);
      if (item.sub_items) {
        item.sub_items.forEach(sub => { total += parseFloat(sub.price || 0); });
      }
    });

    const quotation_number = await generateQuotationNumber();

    const quotation = await Quotation.create({
      quotation_number,
      client_id,
      created_by: req.user.id,
      appointment_id: appointment_id || null,
      items,
      total_amount: total,
      notes,
      validity_days: validity_days || 30,
      status: 'draft'
    });

    const result = await Quotation.findByPk(quotation.id, {
      include: [
        { model: Client, as: 'client', attributes: ['id', 'full_name', 'phone'] },
        { model: User, as: 'creator', attributes: ['id', 'full_name', 'employee_code'] }
      ]
    });

    res.status(201).json({ success: true, message: `تم إنشاء مسودة التسعير رقم ${quotation_number}.`, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// إرسال للاعتماد
exports.submitForApproval = async (req, res) => {
  try {
    const quotation = await Quotation.findByPk(req.params.id);
    if (!quotation) return res.status(404).json({ success: false, message: 'التسعير غير موجود.' });
    if (quotation.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'يمكن إرسال المسودات فقط للاعتماد.' });
    }

    await quotation.update({ status: 'pending_approval' });
    res.json({ success: true, message: 'تم إرسال التسعير للاعتماد.', data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// اعتماد التسعير (مدير القسم أو الإدارة)
exports.approve = async (req, res) => {
  try {
    const { approval_notes } = req.body;
    const quotation = await Quotation.findByPk(req.params.id);
    if (!quotation) return res.status(404).json({ success: false, message: 'التسعير غير موجود.' });
    if (quotation.status !== 'pending_approval') {
      return res.status(400).json({ success: false, message: 'هذا التسعير ليس في مرحلة الاعتماد.' });
    }

    await quotation.update({
      status: 'approved',
      approved_by: req.user.id,
      approved_at: new Date(),
      approval_notes,
      follow_up_required: true,
      follow_up_at: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 ساعة
    });

    res.json({ success: true, message: 'تم اعتماد التسعير. يمكن الآن إبلاغ العميل بالسعر.', data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// رفض التسعير مع ملاحظات
exports.reject = async (req, res) => {
  try {
    const { rejection_reason } = req.body;
    const quotation = await Quotation.findByPk(req.params.id);
    if (!quotation) return res.status(404).json({ success: false, message: 'التسعير غير موجود.' });

    await quotation.update({ status: 'rejected', rejection_reason });
    res.json({ success: true, message: 'تم رفض التسعير. يرجى مراجعة الملاحظات وإعادة التسعير.', data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// تسجيل موافقة العميل
exports.clientAccept = async (req, res) => {
  try {
    const quotation = await Quotation.findByPk(req.params.id);
    if (!quotation) return res.status(404).json({ success: false, message: 'التسعير غير موجود.' });
    if (quotation.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'يجب اعتماد التسعير أولاً قبل تسجيل موافقة العميل.' });
    }

    await quotation.update({
      status: 'client_accepted',
      client_response_at: new Date(),
      follow_up_required: false
    });

    res.json({
      success: true,
      message: 'تم تسجيل موافقة العميل. يمكنك الآن تحويل التسعير إلى معاملة نشطة.',
      data: quotation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// قائمة التسعيرات
exports.getAll = async (req, res) => {
  try {
    const { status, client_id } = req.query;
    const where = {};
    if (status) where.status = status;
    if (client_id) where.client_id = client_id;

    // الموظف يرى تسعيراته فقط
    if (!['super_admin', 'admin', 'dept_head'].includes(req.user.role)) {
      where.created_by = req.user.id;
    }

    const quotations = await Quotation.findAll({
      where,
      include: [
        { model: Client, as: 'client', attributes: ['id', 'full_name', 'phone'] },
        { model: User, as: 'creator', attributes: ['id', 'full_name', 'employee_code'] },
        { model: User, as: 'approver', attributes: ['id', 'full_name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: quotations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// التسعيرات التي تحتاج متابعة (مرت 48 ساعة)
exports.getFollowUps = async (req, res) => {
  try {
    const quotations = await Quotation.findAll({
      where: {
        follow_up_required: true,
        follow_up_at: { [Op.lte]: new Date() },
        status: 'approved'
      },
      include: [{ model: Client, as: 'client', attributes: ['id', 'full_name', 'phone', 'whatsapp'] }],
      order: [['follow_up_at', 'ASC']]
    });

    res.json({ success: true, count: quotations.length, data: quotations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};
