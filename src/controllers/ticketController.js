const { Ticket, TicketMessage, Client, User } = require('../models');
const { Op } = require('sequelize');
const { generateTicketNumber } = require('../services/codeGenerator');

// إنشاء تذكرة جديدة
exports.create = async (req, res) => {
  try {
    const { client_id, client_phone, subject, description, channel, category, priority } = req.body;

    // التوجيه الآلي بناءً على الفئة
    const deptMap = {
      licenses: 'licenses', survey: 'survey',
      reports: 'reports', design: 'design',
      pricing: 'sales', complaint: 'management', general: 'sales'
    };

    const ticket_number = await generateTicketNumber();

    const ticket = await Ticket.create({
      ticket_number,
      client_id: client_id || null,
      client_phone,
      created_by: req.user.id,
      subject, description,
      channel: channel || 'whatsapp',
      category,
      priority: priority || 'medium'
    });

    // رسالة النظام الأولى
    await TicketMessage.create({
      ticket_id: ticket.id,
      sender_type: 'system',
      message: `تم فتح التذكرة رقم ${ticket_number} في قسم: ${deptMap[category] || 'المبيعات'}.`,
      is_internal: true
    });

    res.status(201).json({ success: true, message: `تم فتح التذكرة رقم ${ticket_number}.`, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// قائمة التذاكر
exports.getAll = async (req, res) => {
  try {
    const { status, category, priority, assigned_to } = req.query;
    const where = {};

    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;

    // الموظف يرى تذاكره فقط
    if (req.user.role === 'engineer' || req.user.role === 'sales') {
      where.assigned_to = req.user.id;
    } else if (assigned_to) {
      where.assigned_to = assigned_to;
    }

    const tickets = await Ticket.findAll({
      where,
      include: [
        { model: Client, as: 'client', attributes: ['id', 'full_name', 'phone'] },
        { model: User, as: 'assignedEngineer', attributes: ['id', 'full_name', 'employee_code'] }
      ],
      order: [
        [{ raw: "CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END" }],
        ['created_at', 'DESC']
      ]
    });

    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// تفاصيل تذكرة مع رسائلها
exports.getById = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client' },
        { model: User, as: 'assignedEngineer', attributes: ['id', 'full_name', 'employee_code'] },
        {
          model: TicketMessage, as: 'messages',
          include: [{ model: User, as: 'sender', attributes: ['id', 'full_name'] }],
          order: [['created_at', 'ASC']]
        }
      ]
    });
    if (!ticket) return res.status(404).json({ success: false, message: 'التذكرة غير موجودة.' });
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// إضافة رسالة للتذكرة
exports.addMessage = async (req, res) => {
  try {
    const { message, is_internal } = req.body;
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'التذكرة غير موجودة.' });

    const msg = await TicketMessage.create({
      ticket_id: ticket.id,
      sender_id: req.user.id,
      sender_type: 'staff',
      message,
      is_internal: is_internal || false
    });

    if (ticket.status === 'open') {
      await ticket.update({ status: 'in_progress' });
    }

    res.status(201).json({ success: true, message: 'تم إضافة الرد.', data: msg });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// تعيين التذكرة لموظف
exports.assign = async (req, res) => {
  try {
    const { assigned_to } = req.body;
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'التذكرة غير موجودة.' });

    await ticket.update({ assigned_to, status: 'in_progress' });

    await TicketMessage.create({
      ticket_id: ticket.id,
      sender_id: req.user.id,
      sender_type: 'system',
      message: `تم تعيين التذكرة للموظف.`,
      is_internal: true
    });

    res.json({ success: true, message: 'تم تعيين التذكرة.', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// إغلاق التذكرة
exports.resolve = async (req, res) => {
  try {
    const { resolution_notes } = req.body;
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'التذكرة غير موجودة.' });

    await ticket.update({ status: 'resolved', resolution_notes, resolved_at: new Date() });
    res.json({ success: true, message: 'تم إغلاق التذكرة.', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};
