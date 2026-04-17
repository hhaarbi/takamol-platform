const { Service } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const { category, is_active } = req.query;
    const where = {};
    if (category) where.category = category;
    if (is_active !== undefined) where.is_active = is_active === 'true';
    else where.is_active = true;

    const services = await Service.findAll({ where, order: [['category', 'ASC'], ['sort_order', 'ASC']] });
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { service_code, name, category, description, department, sort_order } = req.body;
    const existing = await Service.findOne({ where: { service_code } });
    if (existing) return res.status(400).json({ success: false, message: 'كود الخدمة مستخدم بالفعل.' });

    const service = await Service.create({ service_code, name, category, description, department, sort_order });
    res.status(201).json({ success: true, message: 'تم إضافة الخدمة.', data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'الخدمة غير موجودة.' });
    await service.update(req.body);
    res.json({ success: true, message: 'تم تحديث الخدمة.', data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

exports.toggleActive = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'الخدمة غير موجودة.' });
    await service.update({ is_active: !service.is_active });
    res.json({ success: true, message: `تم ${service.is_active ? 'تفعيل' : 'تعطيل'} الخدمة.`, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};
