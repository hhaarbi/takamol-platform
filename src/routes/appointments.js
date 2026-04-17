const express = require('express');
const router = express.Router();
const c = require('../controllers/appointmentController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/available-slots', c.getAvailableSlots);
router.get('/', c.getAll);
router.post('/', c.create);
router.get('/:id', c.getById);
router.put('/:id/status', c.updateStatus);
router.put('/:id/reschedule', c.reschedule);

module.exports = router;
