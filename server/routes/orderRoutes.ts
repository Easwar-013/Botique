import { Router } from 'express';

import {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
} from '../controllers/orderController';

import {
  protect,
} from '../middleware/auth';

const router = Router();

/*
 * ---------------------------------------------
 * CUSTOMER
 * ---------------------------------------------
 */

/*
 * Create order
 * POST /api/orders
 */
router.post(
  '/',
  protect,
  createOrder
);

/*
 * Get logged-in customer's orders
 * GET /api/orders/my-orders
 *
 * IMPORTANT:
 * This must be BEFORE /:id
 */
router.get(
  '/my-orders',
  protect,
  getMyOrders
);

/*
 * Get one customer's order
 * GET /api/orders/:id
 */
router.get(
  '/:id',
  protect,
  getOrderById
);

/*
 * Cancel customer's order
 * PUT /api/orders/:id/cancel
 */
router.put(
  '/:id/cancel',
  protect,
  cancelOrder
);

/*
 * ---------------------------------------------
 * ADMIN / STAFF
 * ---------------------------------------------
 */

/*
 * Get ALL orders
 * GET /api/orders
 */
router.get(
  '/',
  protect,
  getAllOrders
);

/*
 * Update order status
 * PUT /api/orders/:id/status
 */
router.put(
  '/:id/status',
  protect,
  updateOrderStatus
);

router.put(
  '/:id/payment-status',
  protect,
  updatePaymentStatus
);

export default router;