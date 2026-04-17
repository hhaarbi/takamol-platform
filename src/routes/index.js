const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const clientRoutes = require('./clients');
const appointmentRoutes = require('./appointments');
const ticketRoutes = require('./tickets');
const quotationRoutes = require('./quotations');
const transactionRoutes = require('./transactions');
const serviceRoutes = require('./services');

router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/tickets', ticketRoutes);
router.use('/quotations', quotationRoutes);
router.use('/transactions', transactionRoutes);
router.use('/services', serviceRoutes);

module.exports = router;
