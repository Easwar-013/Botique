import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import { connectDB } from './config/db';

import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import uploadRoutes from './routes/uploadRoutes';
import customerRoutes from './routes/customerRoutes';
import reviewRoutes from './routes/reviewRoutes';
import couponRoutes from './routes/couponRoutes';

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 5000;

// =====================================================
// SERVER STARTUP LOG
// =====================================================

console.log('======================================');
console.log('        HANGOVER SERVER STARTED       ');
console.log('======================================');
console.log('PORT:', process.env.PORT || '5000');
console.log('CLIENT_URL:', process.env.CLIENT_URL || 'not set');
console.log('======================================');

// =====================================================
// CORS
// =====================================================

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// =====================================================
// BODY PARSERS
// =====================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================================
// STATIC UPLOADED FILES
// =====================================================

app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'uploads'))
);

// =====================================================
// ROOT ROUTE
// =====================================================

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'HangOver backend is running',
  });
});

// =====================================================
// API ROUTES
// =====================================================

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'HangOver API is running',
  });
});

// =====================================================
// 404 HANDLER
// =====================================================

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found',
  });
});

// =====================================================
// START SERVER
// =====================================================

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, '0.0.0.0', () => {
      console.log('======================================');
      console.log(`Server running on port ${PORT}`);
      console.log(`Health: /api/health`);
      console.log('======================================');
    });
  } catch (error) {
    console.error('======================================');
    console.error('[Server] Failed to start');
    console.error(error);
    console.error('======================================');

    process.exit(1);
  }
};

startServer();