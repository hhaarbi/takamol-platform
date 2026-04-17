const express = require('express');
const router = express.Router();
const c = require('../controllers/quotationController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/follow-ups', c.getFollowUps);
router.get('/', c.getAll);
router.post('/', c.create);
router.put('/:id/submit', c.submitForApproval);
router.put('/:id/approve', authorize('super_admin', 'admin', 'dept_head'), c.approve);
router.put('/:id/reject', authorize('super_admin', 'admin', 'dept_head'), c.reject);
router.put('/:id/client-accept', c.clientAccept);

module.exports = router;
