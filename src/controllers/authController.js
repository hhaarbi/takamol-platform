const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { generateEmployeeCode } = require('../services/codeGenerator');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, department: user.department },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// تسجيل الدخول
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'اسم المستخدم وكلمة المرور مطلوبان.' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
    }

    await user.update({ last_login: new Date() });
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح.',
      data: { token, user }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// الحصول على بيانات المستخدم الحالي
exports.getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};

// تغيير كلمة المرور
exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await User.findByPk(req.user.id);

    const isValid = await user.validatePassword(current_password);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة.' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ success: false, message: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل.' });
    }

    await user.update({ password: new_password });
    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// إنشاء مستخدم جديد (super_admin فقط)
exports.createUser = async (req, res) => {
  try {
    const { username, password, full_name, email, phone, role, department, permissions } = req.body;

    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'اسم المستخدم مستخدم بالفعل.' });
    }

    const employee_code = await generateEmployeeCode(department);

    const user = await User.create({
      username, password, full_name, email, phone,
      role: role || 'engineer',
      department,
      employee_code,
      permissions: permissions || {}
    });

    res.status(201).json({
      success: true,
      message: `تم إنشاء الحساب بنجاح. كود الموظف: ${employee_code}`,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// تعديل مستخدم
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, role, department, is_active, permissions } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود.' });

    await user.update({ full_name, email, phone, role, department, is_active, permissions });
    res.json({ success: true, message: 'تم تحديث بيانات المستخدم.', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};

// قائمة المستخدمين
exports.getUsers = async (req, res) => {
  try {
    const { role, department, is_active } = req.query;
    const where = {};
    if (role) where.role = role;
    if (department) where.department = department;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    // مدير القسم يرى فقط موظفي قسمه
    if (req.user.role === 'dept_head') {
      where.department = req.user.department;
    }

    const users = await User.findAll({ where, order: [['created_at', 'DESC']] });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم.', error: error.message });
  }
};
