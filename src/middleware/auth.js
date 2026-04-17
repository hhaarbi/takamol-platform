const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'غير مصرح. يرجى تسجيل الدخول.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'الحساب غير نشط أو غير موجود.' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'رمز المصادقة غير صالح أو منتهي الصلاحية.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'ليس لديك صلاحية للوصول لهذا المورد.' });
    }
    next();
  };
};

const authorizePermission = (permission) => {
  return (req, res, next) => {
    const { role, permissions } = req.user;
    if (role === 'super_admin' || role === 'admin') return next();
    if (permissions && permissions[permission]) return next();
    return res.status(403).json({ success: false, message: `تحتاج صلاحية: ${permission}` });
  };
};

module.exports = { authenticate, authorize, authorizePermission };
