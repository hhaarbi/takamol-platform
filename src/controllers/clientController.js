const { Client, Appointment, Quotation, Transaction, User } = require('../models');
const { Op } = require('sequelize');

// إنشاء عميل جديد
exports.create = async (req, res) => {
  try {
    const { full_name, phone, whatsapp, email, id_number, client_type, company_name, city, notes } = req.body;

    const existing = await Client.findOne({ where: { phone } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'يوجد عميل مسجل بهذا الرقم.', data: existing });
    }

    const client = await Client.create({
      full_name, phone, whatsapp: whatsapp || phone,
      email, id_number, client_type: client_type || 'individual',
      company_name, city: city || 'المدينة المنورة', notes
    });

    res.status(201).json({ success: true, message: 'تم تسجيل العميل بنجاح.', data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// قائمة العملاء
exports.getAll = async (req, res) => {
  try {
    const { search, client_type } = req.query;
    const where = {};
    if (client_type) where.client_type = client_type;
    if (search) {
      where[Op.or] = [
        { full_name: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { company_name: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const clients = await Client.findAll({ where, order: [['created_at', 'DESC']] });
    res.json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// تفاصيل عميل مع سجله الكامل
exports.getById = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id, {
      include: [
        {
          model: Appointment, as: 'appointments',
          include: [{ model: User, as: 'engineer', attributes: ['id', 'full_name', 'employee_code'] }],
          order: [['appointment_date', 'DESC']],
          limit: 10
        },
        {
          model: Quotation, as: 'quotations',
          attributes: ['id', 'quotation_number', 'total_amount', 'status', 'created_at'],
          order: [['created_at', 'DESC']],
          limit: 10
        },
        {
          model: Transaction, as: 'transactions',
          attributes: ['id', 'transaction_code', 'title', 'status', 'total_amount', 'created_at'],
          order: [['created_at', 'DESC']],
          limit: 10
        }
      ]
    });

    if (!client) return res.status(404).json({ success: false, message: 'العميل غير موجود.' });
    res.json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// تحديث بيانات العميل
exports.update = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'العميل غير موجود.' });

    await client.update(req.body);
    res.json({ success: true, message: 'تم تحديث بيانات العميل.', data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};
