import {
  Router,
} from 'express';

import {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from '../controllers/couponController';

import {
  protect,
  requireAdmin,
} from '../middleware/auth';

const router =
  Router();

/*
 * Customer coupon validation
 *
 * POST /api/coupons/validate
 */
router.post(
  '/validate',
  protect,
  validateCoupon
);

/*
 * Admin routes
 */
router.get(
  '/',
  protect,
  requireAdmin,
  getCoupons
);

router.get(
  '/:id',
  protect,
  requireAdmin,
  getCouponById
);

router.post(
  '/',
  protect,
  requireAdmin,
  createCoupon
);

router.put(
  '/:id',
  protect,
  requireAdmin,
  updateCoupon
);

router.delete(
  '/:id',
  protect,
  requireAdmin,
  deleteCoupon
);

export default router;