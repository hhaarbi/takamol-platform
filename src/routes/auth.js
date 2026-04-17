const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/me', authenticate, authController.getMe);
router.put('/change-password', authenticate, authController.changePassword);

// إدارة المستخدمين - super_admin فقط
router.post('/users', authenticate, authorize('super_admin', 'admin'), authController.createUser);
router.put('/users/:id', authenticate, authorize('super_admin', 'admin'), authController.updateUser);
router.get('/users', authenticate, authorize('super_admin', 'admin', 'dept_head'), authController.getUsers);

module.exports = router;
