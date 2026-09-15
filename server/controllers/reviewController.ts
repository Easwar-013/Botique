import { Request, Response } from 'express';
import mongoose from 'mongoose';

import Review from '../models/Review';
import Product from '../models/Product';

import type {
  AuthRequest,
} from '../middleware/auth';

/*
 * --------------------------------------------------
 * Helper
 * --------------------------------------------------
 */

const updateProductRatings =
  async (
    productId: string
  ): Promise<void> => {
    const objectId =
      new mongoose.Types.ObjectId(
        productId
      );

    const result =
      await Review.aggregate([
        {
          $match: {
            product: objectId,
          },
        },
        {
          $group: {
            _id: '$product',

            averageRating: {
              $avg: '$rating',
            },

            totalReviews: {
              $sum: 1,
            },
          },
        },
      ]);

    const averageRating =
      result.length > 0
        ? Number(
            result[0]
              .averageRating.toFixed(
                1
              )
          )
        : 0;

    const totalReviews =
      result.length > 0
        ? Number(
            result[0]
              .totalReviews
          )
        : 0;

    await Product.findByIdAndUpdate(
      productId,
      {
        ratingsAverage:
          averageRating,

        ratingsQuantity:
          totalReviews,
      }
    );
  };

/*
 * --------------------------------------------------
 * GET PRODUCT REVIEWS
 *
 * GET /api/reviews?product=<productId>
 *
 * Public
 * --------------------------------------------------
 */

export const getReviews =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const productId =
        String(
          req.query.product ||
            req.query.productId ||
            ''
        );

      /*
       * If a product was supplied,
       * validate it.
       */
      if (productId) {
        if (
          !mongoose.Types.ObjectId.isValid(
            productId
          )
        ) {
          res.status(400).json({
            success: false,
            message:
              'Invalid product ID.',
          });

          return;
        }
      }

      const filter =
        productId
          ? {
              product:
                productId,
            }
          : {};

      const reviews =
        await Review.find(
          filter
        )
          .populate(
            'user',
            'name email avatar'
          )
          .sort({
            createdAt: -1,
          })
          .lean();

      res.status(200).json({
        success: true,
        count:
          reviews.length,
        reviews,
      });
    } catch (error) {
      console.error(
        'Get reviews error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Failed to fetch reviews.',
      });
    }
  };

/*
 * --------------------------------------------------
 * CREATE REVIEW
 *
 * POST /api/reviews
 *
 * Logged-in customer
 * --------------------------------------------------
 */

export const createReview =
  async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message:
            'Authentication required.',
        });

        return;
      }

      const {
        product,
        productId,
        rating,
        comment,
      } = req.body;

      /*
       * Support both product and
       * productId so the frontend
       * can use either.
       */
      const finalProductId =
        String(
          product ||
            productId ||
            ''
        );

      if (
        !finalProductId
      ) {
        res.status(400).json({
          success: false,
          message:
            'Product ID is required.',
        });

        return;
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          finalProductId
        )
      ) {
        res.status(400).json({
          success: false,
          message:
            'Invalid product ID.',
        });

        return;
      }

      /*
       * Validate rating.
       */
      const normalizedRating =
        Number(rating);

      if (
        !Number.isInteger(
          normalizedRating
        ) ||
        normalizedRating < 1 ||
        normalizedRating > 5
      ) {
        res.status(400).json({
          success: false,
          message:
            'Rating must be between 1 and 5.',
        });

        return;
      }

      /*
       * Validate comment.
       */
      const normalizedComment =
        String(
          comment || ''
        ).trim();

      if (
        normalizedComment.length <
        5
      ) {
        res.status(400).json({
          success: false,
          message:
            'Review must contain at least 5 characters.',
        });

        return;
      }

      if (
        normalizedComment.length >
        1000
      ) {
        res.status(400).json({
          success: false,
          message:
            'Review cannot exceed 1000 characters.',
        });

        return;
      }

      /*
       * Make sure product exists.
       */
      const productRecord =
        await Product.findById(
          finalProductId
        );

      if (!productRecord) {
        res.status(404).json({
          success: false,
          message:
            'Product not found.',
        });

        return;
      }

      /*
       * Check whether this customer
       * already reviewed this product.
       */
      const existingReview =
        await Review.findOne({
          product:
            finalProductId,

          user:
            req.user.id,
        });

      if (existingReview) {
        res.status(409).json({
          success: false,
          message:
            'You have already reviewed this product.',
        });

        return;
      }

      /*
       * Create review.
       */
      let review;

      try {
        review =
          await Review.create({
            product:
              finalProductId,

            user:
              req.user.id,

            rating:
              normalizedRating,

            comment:
              normalizedComment,
          });
      } catch (createError: any) {
        /*
         * Handle MongoDB duplicate
         * compound-index error safely.
         */
        if (
          createError?.code ===
          11000
        ) {
          res.status(409).json({
            success: false,
            message:
              'You have already reviewed this product.',
          });

          return;
        }

        throw createError;
      }

      /*
       * Update product rating summary.
       */
      await updateProductRatings(
        finalProductId
      );

      /*
       * Return populated review.
       */
      const populatedReview =
        await Review.findById(
          review._id
        ).populate(
          'user',
          'name email avatar'
        );

      res.status(201).json({
        success: true,

        message:
          'Review submitted successfully.',

        review:
          populatedReview,
      });
    } catch (error) {
      console.error(
        'Create review error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Failed to submit review.',
      });
    }
  };

/*
 * --------------------------------------------------
 * DELETE REVIEW
 *
 * DELETE /api/reviews/:id
 *
 * Admin / staff
 * --------------------------------------------------
 */

export const deleteReview =
  async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message:
            'Authentication required.',
        });

        return;
      }

      /*
       * Admin/staff only.
       */
      if (
        req.user.role !==
          'admin' &&
        req.user.role !==
          'staff'
      ) {
        res.status(403).json({
          success: false,
          message:
            'Admin access required.',
        });

        return;
      }

      const id =
        String(
          req.params.id
        );

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        res.status(400).json({
          success: false,
          message:
            'Invalid review ID.',
        });

        return;
      }

      const review =
        await Review.findById(
          id
        );

      if (!review) {
        res.status(404).json({
          success: false,
          message:
            'Review not found.',
        });

        return;
      }

      const productId =
        review.product.toString();

      await Review.findByIdAndDelete(
        id
      );

      /*
       * Recalculate product ratings
       * after deleting the review.
       */
      await updateProductRatings(
        productId
      );

      res.status(200).json({
        success: true,
        message:
          'Review deleted successfully.',
      });
    } catch (error) {
      console.error(
        'Delete review error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Failed to delete review.',
      });
    }
  };