const express = require('express');
const router = express.Router();
const c = require('../controllers/clientController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', c.getAll);
router.post('/', c.create);
router.get('/:id', c.getById);
router.put('/:id', c.update);

module.exports = router;
