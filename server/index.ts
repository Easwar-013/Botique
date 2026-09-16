import express from 'express';
import cors, {
  CorsOptions,
} from 'cors';
import dotenv from 'dotenv';

import { connectDB } from './config/db';

import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import uploadRoutes from './routes/uploadRoutes';
import imageRoutes from './routes/imageRoutes';
import customerRoutes from './routes/customerRoutes';
import reviewRoutes from './routes/reviewRoutes';
import couponRoutes from './routes/couponRoutes';

dotenv.config();

const app = express();

const PORT =
  Number(process.env.PORT) ||
  5000;

// =====================================================
// SERVER STARTUP LOG
// =====================================================

console.log(
  '======================================'
);

console.log(
  '        HANGOVER SERVER STARTED       '
);

console.log(
  '======================================'
);

console.log(
  'PORT:',
  process.env.PORT || '5000'
);

console.log(
  'CLIENT_URL:',
  process.env.CLIENT_URL ||
    'not set'
);

console.log(
  'IMAGE STORAGE: MongoDB GridFS'
);

console.log(
  '======================================'
);

// =====================================================
// CORS
// =====================================================

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://botique-bice.vercel.app',
  'https://boutique-bice.vercel.app',
  process.env.CLIENT_URL,
].filter(
  (
    origin
  ): origin is string =>
    Boolean(origin)
);

console.log(
  '[CORS] Allowed origins:',
  allowedOrigins
);

const corsOptions: CorsOptions = {
  origin: (
    origin,
    callback
  ) => {
    /*
     * Allow requests without
     * an Origin header.
     */
    if (!origin) {
      return callback(
        null,
        true
      );
    }

    /*
     * Allow approved origins.
     */
    if (
      allowedOrigins.includes(
        origin
      )
    ) {
      return callback(
        null,
        true
      );
    }

    console.error(
      `[CORS] Blocked origin: ${origin}`
    );

    return callback(
      new Error(
        `CORS blocked origin: ${origin}`
      )
    );
  },

  credentials: true,

  methods: [
    'GET',
    'HEAD',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
  ],

  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
  ],

  optionsSuccessStatus: 204,
};

// Normal CORS requests
app.use(
  cors(corsOptions)
);

// Browser preflight requests
app.options(
  /.*/,
  cors(corsOptions)
);

// =====================================================
// BODY PARSERS
// =====================================================

app.use(
  express.json()
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

// =====================================================
// ROOT ROUTE
// =====================================================

app.get(
  '/',
  (_req, res) => {
    res.json({
      success: true,
      message:
        'HangOver backend is running',
    });
  }
);

// =====================================================
// GRIDFS IMAGE ROUTES
// =====================================================

app.use(
  '/uploads',
  imageRoutes
);

// =====================================================
// API ROUTES
// =====================================================

app.use(
  '/api/auth',
  authRoutes
);

app.use(
  '/api/products',
  productRoutes
);

app.use(
  '/api/orders',
  orderRoutes
);

app.use(
  '/api/analytics',
  analyticsRoutes
);

app.use(
  '/api/upload',
  uploadRoutes
);

app.use(
  '/api/customers',
  customerRoutes
);

app.use(
  '/api/reviews',
  reviewRoutes
);

app.use(
  '/api/coupons',
  couponRoutes
);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
  '/api/health',
  (_req, res) => {
    res.json({
      success: true,
      message:
        'HangOver API is running',
    });
  }
);

// =====================================================
// 404 HANDLER
// =====================================================

app.use(
  (
    _req,
    res
  ) => {
    res.status(404).json({
      success: false,
      message:
        'API route not found',
    });
  }
);

// =====================================================
// ERROR HANDLER
// =====================================================

app.use(
  (
    error: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(
      '[Server Error]:',
      error
    );

    if (
      error?.message?.startsWith(
        'CORS blocked origin:'
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Internal server error',
    });
  }
);

// =====================================================
// START SERVER
// =====================================================

const startServer =
  async () => {
    try {
      await connectDB();

      app.listen(
        PORT,
        '0.0.0.0',
        () => {
          console.log(
            '======================================'
          );

          console.log(
            `Server running on port ${PORT}`
          );

          console.log(
            'Health: /api/health'
          );

          console.log(
            'Images: /uploads/products/:filename'
          );

          console.log(
            'Storage: MongoDB GridFS'
          );

          console.log(
            '======================================'
          );
        }
      );
    } catch (error) {
      console.error(
        '======================================'
      );

      console.error(
        '[Server] Failed to start'
      );

      console.error(error);

      console.error(
        '======================================'
      );

      process.exit(1);
    }
  };

startServer();