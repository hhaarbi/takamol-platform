require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');

const app = express();

// ======= Middleware =======
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ======= Routes =======
app.use('/api/v1', routes);

// ======= Health Check =======
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Takamol Platform - Hashem Abdul Hakeem Engineering Consultancy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ======= 404 Handler =======
app.use((req, res) => {
  res.status(404).json({ success: false, message: `المسار ${req.originalUrl} غير موجود.` });
});

// ======= Global Error Handler =======
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'خطأ داخلي في الخادم.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ======= Start Server =======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Takamol Platform يعمل على المنفذ ${PORT}`);
  console.log(`📋 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api/v1\n`);
});

module.exports = app;
