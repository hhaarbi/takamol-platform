const express = require('express');
const router = express.Router();
const c = require('../controllers/ticketController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', c.getAll);
router.post('/', c.create);
router.get('/:id', c.getById);
router.post('/:id/messages', c.addMessage);
router.put('/:id/assign', c.assign);
router.put('/:id/resolve', c.resolve);

module.exports = router;
