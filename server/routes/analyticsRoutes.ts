import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

import Order from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';

const router = Router();

/**
 * GET /api/analytics
 *
 * Returns basic admin dashboard statistics.
 */
router.get(
  '/',
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const [
        totalOrders,
        totalProducts,
        totalCustomers,
        revenueAggregation,
      ] = await Promise.all([
        Order.countDocuments(),

        Product.countDocuments({
          isActive: true,
        }),

        User.countDocuments({
          role: 'customer',
        }),

        Order.aggregate([
          {
            $match: {
              orderStatus: {
                $nin: ['Cancelled', 'Returned'],
              },
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: {
                $sum: '$totalAmount',
              },
            },
          },
        ]),
      ]);

      const revenue =
        revenueAggregation.length > 0
          ? revenueAggregation[0].totalRevenue
          : 0;

      res.status(200).json({
        success: true,

        stats: {
          revenue,
          orders: totalOrders,
          customers: totalCustomers,
          products: totalProducts,
        },
      });
    } catch (error) {
      console.error(
        'Analytics error:',
        error
      );

      res.status(500).json({
        success: false,
        message: 'Failed to load analytics',
      });
    }
  }
);

/**
 * GET /api/analytics/sales
 *
 * Returns sales grouped by date.
 */
router.get(
  '/sales',
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const sales = await Order.aggregate([
        {
          $match: {
            orderStatus: {
              $nin: ['Cancelled', 'Returned'],
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
              },
            },

            revenue: {
              $sum: '$totalAmount',
            },

            orders: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]);

      res.status(200).json({
        success: true,
        sales,
      });
    } catch (error) {
      console.error(
        'Sales analytics error:',
        error
      );

      res.status(500).json({
        success: false,
        message: 'Failed to load sales analytics',
      });
    }
  }
);

/**
 * GET /api/analytics/top-products
 *
 * Returns top-selling products.
 */
router.get(
  '/top-products',
  async (
    _req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const topProducts =
        await Order.aggregate([
          {
            $match: {
              orderStatus: {
                $nin: [
                  'Cancelled',
                  'Returned',
                ],
              },
            },
          },

          {
            $unwind: '$items',
          },

          {
            $group: {
              _id: '$items.product',

              name: {
                $first: '$items.name',
              },

              quantity: {
                $sum: '$items.quantity',
              },

              revenue: {
                $sum: {
                  $multiply: [
                    '$items.price',
                    '$items.quantity',
                  ],
                },
              },
            },
          },

          {
            $sort: {
              quantity: -1,
            },
          },

          {
            $limit: 10,
          },
        ]);

      res.status(200).json({
        success: true,
        products: topProducts,
      });
    } catch (error) {
      console.error(
        'Top products error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Failed to load top products',
      });
    }
  }
);

export default router;