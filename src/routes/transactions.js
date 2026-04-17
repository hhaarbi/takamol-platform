const express = require('express');
const router = express.Router();
const c = require('../controllers/transactionController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/dashboard', authorize('super_admin', 'admin'), c.getDashboard);
router.get('/', c.getAll);
router.post('/convert', c.convertFromQuotation);
router.get('/:id', c.getById);
router.put('/:id/assign-task', authorize('super_admin', 'admin', 'dept_head'), c.assignTask);
router.put('/:id/complete-stage', c.completeStage);

module.exports = router;
