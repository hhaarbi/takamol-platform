const { Appointment, Client, User } = require('../models');
const { Op } = require('sequelize');

// إنشاء موعد جديد
exports.create = async (req, res) => {
  try {
    const {
      client_id, engineer_id, appointment_date, appointment_time,
      duration_minutes, meeting_type, service_category,
      pre_qualification, notes
    } = req.body;

    // التحقق من عدم وجود تعارض في جدول المهندس
    const conflict = await Appointment.findOne({
      where: {
        engineer_id,
        appointment_date,
        appointment_time,
        status: { [Op.notIn]: ['cancelled', 'rescheduled'] }
      }
    });
    if (conflict) {
      return res.status(409).json({ success: false, message: 'يوجد موعد آخر للمهندس في نفس الوقت.' });
    }

    const appointment = await Appointment.create({
      client_id, engineer_id,
      created_by: req.user.id,
      appointment_date, appointment_time,
      duration_minutes: duration_minutes || 60,
      meeting_type: meeting_type || 'initial_consultation',
      service_category,
      pre_qualification: pre_qualification || {},
      notes
    });

    const result = await Appointment.findByPk(appointment.id, {
      include: [
        { model: Client, as: 'client' },
        { model: User, as: 'engineer', attributes: ['id', 'full_name', 'employee_code', 'department'] }
      ]
    });

    res.status(201).json({ success: true, message: 'تم حجز الموعد بنجاح.', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// قائمة المواعيد
exports.getAll = async (req, res) => {
  try {
    const { date, engineer_id, status, service_category } = req.query;
    const where = {};

    if (date) where.appointment_date = date;
    if (status) where.status = status;
    if (service_category) where.service_category = service_category;

    // المهندس يرى مواعيده فقط
    if (req.user.role === 'engineer') {
      where.engineer_id = req.user.id;
    } else if (engineer_id) {
      where.engineer_id = engineer_id;
    }

    // مدير القسم يرى مواعيد مهندسي قسمه
    if (req.user.role === 'dept_head') {
      const deptEngineers = await User.findAll({
        where: { department: req.user.department },
        attributes: ['id']
      });
      where.engineer_id = { [Op.in]: deptEngineers.map(e => e.id) };
    }

    const appointments = await Appointment.findAll({
      where,
      include: [
        { model: Client, as: 'client', attributes: ['id', 'full_name', 'phone'] },
        { model: User, as: 'engineer', attributes: ['id', 'full_name', 'employee_code'] }
      ],
      order: [['appointment_date', 'ASC'], ['appointment_time', 'ASC']]
    });

    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// تفاصيل موعد
exports.getById = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client' },
        { model: User, as: 'engineer', attributes: ['id', 'full_name', 'employee_code', 'phone'] },
        { model: User, as: 'creator', attributes: ['id', 'full_name'] }
      ]
    });
    if (!appointment) return res.status(404).json({ success: false, message: 'الموعد غير موجود.' });
    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// تحديث حالة الموعد
exports.updateStatus = async (req, res) => {
  try {
    const { status, cancellation_reason } = req.body;
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'الموعد غير موجود.' });

    await appointment.update({ status, cancellation_reason });
    res.json({ success: true, message: 'تم تحديث حالة الموعد.', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// إعادة جدولة موعد
exports.reschedule = async (req, res) => {
  try {
    const { appointment_date, appointment_time } = req.body;
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'الموعد غير موجود.' });

    // التحقق من عدم التعارض
    const conflict = await Appointment.findOne({
      where: {
        engineer_id: appointment.engineer_id,
        appointment_date,
        appointment_time,
        id: { [Op.ne]: appointment.id },
        status: { [Op.notIn]: ['cancelled', 'rescheduled'] }
      }
    });
    if (conflict) {
      return res.status(409).json({ success: false, message: 'يوجد موعد آخر للمهندس في هذا الوقت.' });
    }

    await appointment.update({ appointment_date, appointment_time, status: 'rescheduled' });
    res.json({ success: true, message: 'تم إعادة جدولة الموعد.', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// الأوقات المتاحة لمهندس في يوم معين
exports.getAvailableSlots = async (req, res) => {
  try {
    const { engineer_id, date } = req.query;
    const workingHours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

    const booked = await Appointment.findAll({
      where: {
        engineer_id,
        appointment_date: date,
        status: { [Op.notIn]: ['cancelled', 'rescheduled'] }
      },
      attributes: ['appointment_time']
    });

    const bookedTimes = booked.map(a => a.appointment_time.slice(0, 5));
    const available = workingHours.filter(h => !bookedTimes.includes(h));

    res.json({ success: true, data: { date, engineer_id, available_slots: available } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};
