import {
  Router,
} from 'express';

import {
  getReviews,
  createReview,
  deleteReview,
} from '../controllers/reviewController';

import {
  protect,
  requireAdmin,
} from '../middleware/auth';

const router =
  Router();

/*
 * Public:
 *
 * GET /api/reviews
 * GET /api/reviews?product=PRODUCT_ID
 */
router.get(
  '/',
  getReviews
);

/*
 * Logged-in customer:
 *
 * POST /api/reviews
 */
router.post(
  '/',
  protect,
  createReview
);

/*
 * Admin / staff:
 *
 * DELETE /api/reviews/:id
 */
router.delete(
  '/:id',
  protect,
  requireAdmin,
  deleteReview
);

export default router;