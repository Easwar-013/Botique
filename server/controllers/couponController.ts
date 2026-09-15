import { Request, Response } from 'express';
import mongoose from 'mongoose';

import Coupon from '../models/Coupon';

/*
 * Normalize coupon code.
 */
const normalizeCode = (
  value: unknown
): string => {
  return String(value || '')
    .trim()
    .toUpperCase();
};

/*
 * Convert expiry date from:
 *
 * YYYY-MM-DD
 *
 * into the end of that day.
 */
const parseExpiryDate = (
  value: unknown
): Date | undefined => {
  if (!value) {
    return undefined;
  }

  const raw = String(value).trim();

  if (!raw) {
    return undefined;
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  /*
   * Coupon remains valid until
   * the end of the selected day.
   */
  date.setHours(
    23,
    59,
    59,
    999
  );

  return date;
};

/*
 * GET /api/coupons
 * Admin
 */
export const getCoupons = async (
  _req: Request,
  res: Response
) => {
  try {
    const coupons =
      await Coupon.find()
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.json({
      success: true,
      coupons,
    });
  } catch (error) {
    console.error(
      'Get coupons error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to load coupons.',
    });
  }
};

/*
 * GET /api/coupons/:id
 * Admin
 */
export const getCouponById =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id = String(
        req.params.id
      );

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid coupon ID.',
        });
      }

      const coupon =
        await Coupon.findById(id);

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message:
            'Coupon not found.',
        });
      }

      return res.json({
        success: true,
        coupon,
      });
    } catch (error) {
      console.error(
        'Get coupon error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Failed to load coupon.',
      });
    }
  };

/*
 * POST /api/coupons
 * Admin
 */
export const createCoupon =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        code,
        discountType,
        discountValue,
        minimumPurchase,
        expiresAt,
        isActive,
      } = req.body;

      const normalizedCode =
        normalizeCode(code);

      if (!normalizedCode) {
        return res.status(400).json({
          success: false,
          message:
            'Coupon code is required.',
        });
      }

      /*
       * Percentage only.
       */
      if (
        discountType &&
        discountType !==
          'percentage'
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Only percentage coupons are supported.',
        });
      }

      const percentage =
        Number(discountValue);

      if (
        !Number.isFinite(
          percentage
        ) ||
        percentage < 1 ||
        percentage > 100
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Discount percentage must be between 1 and 100.',
        });
      }

      let minimum: number | undefined;

      if (
        minimumPurchase !==
          undefined &&
        minimumPurchase !==
          null &&
        String(
          minimumPurchase
        ).trim() !== ''
      ) {
        minimum =
          Number(
            minimumPurchase
          );

        if (
          !Number.isFinite(
            minimum
          ) ||
          minimum < 0
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                'Minimum purchase must be a valid non-negative amount.',
            });
        }
      }

      const expiry =
        parseExpiryDate(
          expiresAt
        );

      if (
        expiresAt &&
        !expiry
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid expiry date.',
        });
      }

      if (
        expiry &&
        expiry.getTime() <=
          Date.now()
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Expiry date must be in the future.',
        });
      }

      const existing =
        await Coupon.findOne({
          code: normalizedCode,
        });

      if (existing) {
        return res.status(409).json({
          success: false,
          message:
            'A coupon with this code already exists.',
        });
      }

      const coupon =
        await Coupon.create({
          code: normalizedCode,
          discountType:
            'percentage',
          discountValue:
            percentage,
          minimumPurchase:
            minimum,
          expiresAt: expiry,
          isActive:
            isActive !== undefined
              ? Boolean(
                  isActive
                )
              : true,
        });

      return res.status(201).json({
        success: true,
        message:
          'Coupon created successfully.',
        coupon,
      });
    } catch (error: any) {
      console.error(
        'Create coupon error:',
        error
      );

      /*
       * Mongo duplicate key safety.
       */
      if (
        error?.code === 11000
      ) {
        return res.status(409).json({
          success: false,
          message:
            'A coupon with this code already exists.',
        });
      }

      return res.status(500).json({
        success: false,
        message:
          'Failed to create coupon.',
      });
    }
  };

/*
 * PUT /api/coupons/:id
 * Admin
 */
export const updateCoupon =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id = String(
        req.params.id
      );

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid coupon ID.',
        });
      }

      const {
        code,
        discountType,
        discountValue,
        minimumPurchase,
        expiresAt,
        isActive,
      } = req.body;

      const coupon =
        await Coupon.findById(id);

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message:
            'Coupon not found.',
        });
      }

      const normalizedCode =
        normalizeCode(
          code ?? coupon.code
        );

      if (!normalizedCode) {
        return res.status(400).json({
          success: false,
          message:
            'Coupon code is required.',
        });
      }

      if (
        discountType &&
        discountType !==
          'percentage'
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Only percentage coupons are supported.',
        });
      }

      const percentage =
        Number(
          discountValue ??
            coupon.discountValue
        );

      if (
        !Number.isFinite(
          percentage
        ) ||
        percentage < 1 ||
        percentage > 100
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Discount percentage must be between 1 and 100.',
        });
      }

      let minimum: number | undefined;

      if (
        minimumPurchase !==
          undefined &&
        minimumPurchase !==
          null &&
        String(
          minimumPurchase
        ).trim() !== ''
      ) {
        minimum =
          Number(
            minimumPurchase
          );

        if (
          !Number.isFinite(
            minimum
          ) ||
          minimum < 0
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                'Minimum purchase must be a valid non-negative amount.',
            });
        }
      } else {
        minimum =
          undefined;
      }

      const expiry =
        parseExpiryDate(
          expiresAt
        );

      if (
        expiresAt &&
        !expiry
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid expiry date.',
        });
      }

      if (
        expiry &&
        expiry.getTime() <=
          Date.now()
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Expiry date must be in the future.',
        });
      }

      const duplicate =
        await Coupon.findOne({
          code: normalizedCode,
          _id: {
            $ne: id,
          },
        });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message:
            'A coupon with this code already exists.',
        });
      }

      coupon.code =
        normalizedCode;

      coupon.discountType =
        'percentage';

      coupon.discountValue =
        percentage;

      coupon.minimumPurchase =
        minimum;

      coupon.expiresAt =
        expiry;

      if (
        isActive !== undefined
      ) {
        coupon.isActive =
          Boolean(isActive);
      }

      await coupon.save();

      return res.json({
        success: true,
        message:
          'Coupon updated successfully.',
        coupon,
      });
    } catch (error: any) {
      console.error(
        'Update coupon error:',
        error
      );

      if (
        error?.code === 11000
      ) {
        return res.status(409).json({
          success: false,
          message:
            'A coupon with this code already exists.',
        });
      }

      return res.status(500).json({
        success: false,
        message:
          'Failed to update coupon.',
      });
    }
  };

/*
 * DELETE /api/coupons/:id
 * Admin
 */
export const deleteCoupon =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id = String(
        req.params.id
      );

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid coupon ID.',
        });
      }

      const coupon =
        await Coupon.findByIdAndDelete(
          id
        );

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message:
            'Coupon not found.',
        });
      }

      return res.json({
        success: true,
        message:
          'Coupon deleted successfully.',
      });
    } catch (error) {
      console.error(
        'Delete coupon error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Failed to delete coupon.',
      });
    }
  };

/*
 * POST /api/coupons/validate
 * Customer
 *
 * Useful later during checkout.
 */
export const validateCoupon =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        code,
        subtotal,
      } = req.body;

      const normalizedCode =
        normalizeCode(code);

      if (!normalizedCode) {
        return res.status(400).json({
          success: false,
          message:
            'Coupon code is required.',
        });
      }

      const coupon =
        await Coupon.findOne({
          code: normalizedCode,
          isActive: true,
        });

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message:
            'Invalid or inactive coupon.',
        });
      }

      if (
        coupon.expiresAt &&
        coupon.expiresAt.getTime() <
          Date.now()
      ) {
        return res.status(400).json({
          success: false,
          message:
            'This coupon has expired.',
        });
      }

      const orderSubtotal =
        Number(subtotal);

      if (
        !Number.isFinite(
          orderSubtotal
        ) ||
        orderSubtotal < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid order subtotal.',
        });
      }

      if (
        coupon.minimumPurchase !==
          undefined &&
        orderSubtotal <
          coupon.minimumPurchase
      ) {
        return res.status(400).json({
          success: false,
          message: `Minimum purchase of ₹${coupon.minimumPurchase.toLocaleString(
            'en-IN'
          )} is required.`,
        });
      }

      const discountAmount =
        Math.round(
          ((orderSubtotal *
            coupon.discountValue) /
            100 +
            Number.EPSILON) *
            100
        ) / 100;

      const finalAmount =
        Math.max(
          0,
          orderSubtotal -
            discountAmount
        );

      return res.json({
        success: true,
        message:
          'Coupon applied successfully.',
        coupon: {
          code: coupon.code,
          discountType:
            'percentage',
          discountValue:
            coupon.discountValue,
        },
        discountAmount,
        finalAmount,
      });
    } catch (error) {
      console.error(
        'Validate coupon error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Failed to validate coupon.',
      });
    }
  };