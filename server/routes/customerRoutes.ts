import { Router } from 'express';

import User from '../models/User';

import {
  protect,
  requireAdmin,
} from '../middleware/auth';

const router = Router();

/*
 * GET /api/customers
 *
 * Admin only
 */
router.get(
  '/',
  protect,
  requireAdmin,
  async (req, res) => {
    try {
      const search =
        typeof req.query.search ===
        'string'
          ? req.query.search.trim()
          : '';

      const filter: Record<
        string,
        any
      > = {
        role: 'customer',
      };

      if (search) {
        const escapedSearch =
          search.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
          );

        const regex =
          new RegExp(
            escapedSearch,
            'i'
          );

        filter.$or = [
          {
            name: regex,
          },
          {
            email: regex,
          },
          {
            phone: regex,
          },
        ];
      }

      const customers =
        await User.find(filter)
          .select(
            '-password'
          )
          .sort({
            createdAt: -1,
          });

      res.status(200).json({
        success: true,
        count: customers.length,
        customers,
      });
    } catch (error) {
      console.error(
        'Get customers error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Failed to load customers',
      });
    }
  }
);

export default router;