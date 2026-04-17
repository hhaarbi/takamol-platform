const express = require('express');
const router = express.Router();
const c = require('../controllers/serviceController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', c.getAll);
router.post('/', authorize('super_admin', 'admin'), c.create);
router.put('/:id', authorize('super_admin', 'admin'), c.update);
router.put('/:id/toggle', authorize('super_admin', 'admin'), c.toggleActive);

module.exports = router;
