import { Response } from 'express';
import mongoose from 'mongoose';

import Order from '../models/Order';
import Product from '../models/Product';

import type { AuthRequest } from '../middleware/auth';

/*
 * --------------------------------------------------
 * Helpers
 * --------------------------------------------------
 */

const getProductImage = (
  product: any
): string => {
  if (!product?.images) {
    return '';
  }

  return (
    product.images.find(
      (image: any) =>
        image?.isPrimary
    )?.url ||
    product.images[0]?.url ||
    ''
  );
};

/*
 * --------------------------------------------------
 * CREATE ORDER
 * POST /api/orders
 * --------------------------------------------------
 */
export const createOrder = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  /*
   * Keeps track of stock reductions.
   *
   * If Order.create() fails after stock has
   * already been reduced, the stock is restored.
   */
  const stockAdjustments: Array<{
    productId: string;
    quantity: number;
  }> = [];

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
      items,
      shippingAddress,
      subtotal,
      shippingCharge,
      shipping,
      discount = 0,
      totalAmount,
      total,
      couponCode,
      paymentMethod = 'COD',
    } = req.body;

    /*
     * --------------------------------------------------
     * Validate items
     * --------------------------------------------------
     */

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      res.status(400).json({
        success: false,
        message:
          'Order must contain at least one item.',
      });

      return;
    }

    /*
     * --------------------------------------------------
     * Validate shipping address
     * --------------------------------------------------
     */

    if (
      !shippingAddress ||
      typeof shippingAddress !== 'object'
    ) {
      res.status(400).json({
        success: false,
        message:
          'Shipping address is required.',
      });

      return;
    }

    /*
     * --------------------------------------------------
     * Normalize amounts
     * --------------------------------------------------
     */

    const normalizedSubtotal =
      Number(subtotal ?? 0);

    const normalizedShipping =
      Number(
        shippingCharge ??
          shipping ??
          0
      );

    const normalizedDiscount =
      Number(discount ?? 0);

    const normalizedTotal =
      Number(
        totalAmount ??
          total ??
          0
      );

    /*
     * --------------------------------------------------
     * Validate subtotal
     * --------------------------------------------------
     */

    if (
      !Number.isFinite(
        normalizedSubtotal
      ) ||
      normalizedSubtotal < 0
    ) {
      res.status(400).json({
        success: false,
        message:
          'Invalid subtotal.',
      });

      return;
    }

    /*
     * --------------------------------------------------
     * Validate shipping
     * --------------------------------------------------
     */

    if (
      !Number.isFinite(
        normalizedShipping
      ) ||
      normalizedShipping < 0
    ) {
      res.status(400).json({
        success: false,
        message:
          'Invalid shipping charge.',
      });

      return;
    }

    /*
     * --------------------------------------------------
     * Validate discount
     * --------------------------------------------------
     */

    if (
      !Number.isFinite(
        normalizedDiscount
      ) ||
      normalizedDiscount < 0
    ) {
      res.status(400).json({
        success: false,
        message:
          'Invalid discount.',
      });

      return;
    }

    /*
     * --------------------------------------------------
     * Validate total
     * --------------------------------------------------
     */

    if (
      !Number.isFinite(
        normalizedTotal
      ) ||
      normalizedTotal < 0
    ) {
      res.status(400).json({
        success: false,
        message:
          'Invalid total amount.',
      });

      return;
    }

    /*
     * --------------------------------------------------
     * Verify total calculation
     * --------------------------------------------------
     */

    const expectedTotal =
      Number(
        (
          normalizedSubtotal +
          normalizedShipping -
          normalizedDiscount
        ).toFixed(2)
      );

    if (
      Math.abs(
        expectedTotal -
          normalizedTotal
      ) > 0.01
    ) {
      res.status(400).json({
        success: false,
        message:
          'Order total does not match subtotal, shipping and discount.',
      });

      return;
    }

    /*
     * --------------------------------------------------
     * Normalize product IDs
     * --------------------------------------------------
     */

    const productIds =
      items.map(
        (item: any) =>
          String(
            item?.product ?? ''
          )
      );

    /*
     * Every item must contain a valid
     * MongoDB ObjectId.
     */
    const invalidProductId =
      productIds.some(
        (id: string) =>
          !mongoose.Types.ObjectId.isValid(
            id
          )
      );

    if (invalidProductId) {
      res.status(400).json({
        success: false,
        message:
          'One or more products are invalid.',
      });

      return;
    }

    /*
     * --------------------------------------------------
     * CALCULATE TOTAL QUANTITY PER PRODUCT
     * --------------------------------------------------
     *
     * This is important when the same product
     * appears more than once in the cart.
     *
     * Example:
     *
     * Product A -> quantity 2
     * Product A -> quantity 3
     *
     * Required stock = 5
     */

    const requestedQuantities =
      new Map<string, number>();

    for (const item of items) {
      const productId =
        String(item.product);

      const quantity =
        Number(item.quantity);

      if (
        !Number.isFinite(
          quantity
        ) ||
        !Number.isInteger(
          quantity
        ) ||
        quantity < 1
      ) {
        res.status(400).json({
          success: false,
          message:
            `Invalid quantity for product ${productId}.`,
        });

        return;
      }

      requestedQuantities.set(
        productId,
        (
          requestedQuantities.get(
            productId
          ) || 0
        ) + quantity
      );
    }

    /*
     * --------------------------------------------------
     * GET PRODUCTS
     * --------------------------------------------------
     */

    const uniqueProductIds =
      Array.from(
        requestedQuantities.keys()
      );

    const products =
      await Product.find({
        _id: {
          $in:
            uniqueProductIds,
        },
      }).select(
        '_id name images stock price discountPrice'
      );

    const productMap =
      new Map<string, any>(
        products.map(
          (product) => [
            product._id.toString(),
            product,
          ]
        )
      );

    /*
     * --------------------------------------------------
     * VERIFY PRODUCTS EXIST
     * --------------------------------------------------
     */

    for (const productId of uniqueProductIds) {
      const product =
        productMap.get(
          productId
        );

      if (!product) {
        res.status(404).json({
          success: false,
          message:
            `Product not found: ${productId}`,
        });

        return;
      }
    }

    /*
     * --------------------------------------------------
     * INITIAL STOCK CHECK
     * --------------------------------------------------
     *
     * This gives the customer a clear error before
     * we attempt stock reduction.
     * --------------------------------------------------
     */

    for (const [
      productId,
      requestedQuantity,
    ] of requestedQuantities) {
      const product =
        productMap.get(
          productId
        );

      if (
        requestedQuantity >
        product.stock
      ) {
        res.status(400).json({
          success: false,
          message:
            `${product.name} has only ${product.stock} item(s) left in stock. You requested ${requestedQuantity}.`,
        });

        return;
      }
    }

    /*
     * --------------------------------------------------
     * NORMALIZE ORDER ITEMS
     * --------------------------------------------------
     */

    const normalizedItems =
      items.map(
        (item: any) => {
          const productId =
            String(
              item.product
            );

          const product =
            productMap.get(
              productId
            );

          const quantity =
            Number(
              item.quantity
            );

          const price =
            Number(
              item.price
            );

          if (
            !Number.isFinite(
              quantity
            ) ||
            !Number.isInteger(
              quantity
            ) ||
            quantity < 1
          ) {
            throw new Error(
              `Invalid quantity for product ${productId}`
            );
          }

          if (
            !Number.isFinite(
              price
            ) ||
            price < 0
          ) {
            throw new Error(
              `Invalid price for product ${productId}`
            );
          }

          const image =
            item.image ||
            getProductImage(
              product
            );

          return {
            product:
              product._id,

            name:
              String(
                item.name ||
                  product.name
              ).trim(),

            image,

            quantity,

            price,

            size:
              item.size
                ? String(
                    item.size
                  )
                : undefined,

            color:
              item.color
                ? String(
                    item.color
                  )
                : undefined,
          };
        }
      );

    /*
     * --------------------------------------------------
     * Normalize shipping address
     * --------------------------------------------------
     */

    const normalizedShippingAddress =
      {
        name:
          String(
            shippingAddress.name ||
              ''
          ).trim(),

        email:
          shippingAddress.email
            ? String(
                shippingAddress.email
              )
                .trim()
                .toLowerCase()
            : undefined,

        phone:
          String(
            shippingAddress.phone ||
              ''
          ).trim(),

        address:
          String(
            shippingAddress.address ||
              ''
          ).trim(),

        city:
          String(
            shippingAddress.city ||
              ''
          ).trim(),

        state:
          String(
            shippingAddress.state ||
              ''
          ).trim(),

        pincode:
          String(
            shippingAddress.pincode ||
              ''
          ).trim(),
      };

    /*
     * --------------------------------------------------
     * Validate shipping address
     * --------------------------------------------------
     */

    if (
      !normalizedShippingAddress
        .name ||
      !normalizedShippingAddress
        .phone ||
      !normalizedShippingAddress
        .address ||
      !normalizedShippingAddress
        .city ||
      !normalizedShippingAddress
        .state ||
      !normalizedShippingAddress
        .pincode
    ) {
      res.status(400).json({
        success: false,
        message:
          'Complete shipping address is required.',
      });

      return;
    }

    /*
     * --------------------------------------------------
     * Normalize payment method
     * --------------------------------------------------
     */

    const normalizedPaymentMethod =
      String(
        paymentMethod ||
          'COD'
      ).toUpperCase();

    const allowedPaymentMethods = [
      'COD',
      'ONLINE',
    ];

    if (
      !allowedPaymentMethods.includes(
        normalizedPaymentMethod
      )
    ) {
      res.status(400).json({
        success: false,
        message:
          'Invalid payment method.',
      });

      return;
    }

    /*
     * --------------------------------------------------
     * PAYMENT STATUS
     * --------------------------------------------------
     *
     * All orders start as Pending.
     */

    const initialPaymentStatus =
      'Pending';

    /*
     * --------------------------------------------------
     * Generate order number
     * --------------------------------------------------
     */

    const orderNumber =
      `HO-${Date.now()}-${Math.floor(
        1000 +
          Math.random() * 9000
      )}`;

    /*
     * ==================================================
     * REDUCE PRODUCT STOCK
     * ==================================================
     *
     * We use an atomic MongoDB operation:
     *
     *   stock: { $gte: quantity }
     *
     * together with:
     *
     *   $inc: { stock: -quantity }
     *
     * This means stock is reduced only when
     * enough stock is still available.
     *
     * Example:
     *
     * Stock = 5
     * Customer orders = 2
     *
     * New stock = 3
     * ==================================================
     */

    for (const [
      productId,
      quantity,
    ] of requestedQuantities) {
      const updatedProduct =
        await Product.findOneAndUpdate(
          {
            _id: productId,

            /*
             * Make sure there is still enough stock.
             */
            stock: {
              $gte:
                quantity,
            },
          },
          {
            /*
             * Reduce stock by ordered quantity.
             */
            $inc: {
              stock:
                -quantity,
            },
          },
          {
            new: true,
          }
        ).select(
          '_id name stock'
        );

      /*
       * If this is null, another customer may
       * have purchased stock between the initial
       * validation and this update.
       */
      if (!updatedProduct) {
        /*
         * Restore stock that was already reduced
         * for previous products in this order.
         */
        for (
          const adjustment of
            stockAdjustments
        ) {
          try {
            await Product.updateOne(
              {
                _id:
                  adjustment.productId,
              },
              {
                $inc: {
                  stock:
                    adjustment.quantity,
                },
              }
            );
          } catch (
            restoreError
          ) {
            console.error(
              'Stock restore error:',
              restoreError
            );
          }
        }

        stockAdjustments.length = 0;

        const product =
          productMap.get(
            productId
          );

        res.status(400).json({
          success: false,
          message:
            product
              ? `${product.name} is no longer available in the requested quantity. Please refresh your cart and try again.`
              : 'One or more products are no longer available.',
        });

        return;
      }

      /*
       * Remember stock adjustment in case
       * order creation fails.
       */
      stockAdjustments.push({
        productId,
        quantity,
      });
    }

    /*
     * --------------------------------------------------
     * CREATE ORDER
     * --------------------------------------------------
     */

    const order =
      await Order.create({
        orderNumber,

        user:
          req.user.id,

        items:
          normalizedItems,

        shippingAddress:
          normalizedShippingAddress,

        subtotal:
          normalizedSubtotal,

        shippingCharge:
          normalizedShipping,

        discount:
          normalizedDiscount,

        totalAmount:
          normalizedTotal,

        couponCode:
          couponCode
            ? String(
                couponCode
              )
                .trim()
                .toUpperCase()
            : undefined,

        paymentMethod:
          normalizedPaymentMethod,

        paymentStatus:
          initialPaymentStatus,

        orderStatus:
          'Pending',
      });

    /*
     * Order successfully created.
     *
     * Stock must NOT be restored.
     */
    stockAdjustments.length = 0;

    res.status(201).json({
      success: true,

      message:
        'Order created successfully.',

      order,
    });
  } catch (error) {
    console.error(
      'Create order error:',
      error
    );

    /*
     * --------------------------------------------------
     * RESTORE STOCK IF ORDER CREATION FAILED
     * --------------------------------------------------
     *
     * Example:
     *
     * Stock was reduced successfully,
     * but Order.create() failed.
     *
     * Restore the exact quantity.
     */

    if (
      stockAdjustments.length > 0
    ) {
      for (
        const adjustment of
          stockAdjustments
      ) {
        try {
          await Product.updateOne(
            {
              _id:
                adjustment.productId,
            },
            {
              $inc: {
                stock:
                  adjustment.quantity,
              },
            }
          );
        } catch (
          restoreError
        ) {
          console.error(
            'Failed to restore stock:',
            restoreError
          );
        }
      }
    }

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to create order.',
    });
  }
};

/*
 * --------------------------------------------------
 * GET ALL ORDERS - ADMIN
 * GET /api/orders
 * --------------------------------------------------
 */
export const getAllOrders = async (
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

    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'staff'
    ) {
      res.status(403).json({
        success: false,
        message:
          'Admin access required.',
      });

      return;
    }

    const orders =
      await Order.find({})
        .populate(
          'user',
          'name email phone'
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    /*
     * Recover product images
     * for older orders.
     */
    const productIds =
      orders.flatMap(
        (order: any) =>
          order.items
            ?.map(
              (item: any) =>
                item.product
            )
            .filter(Boolean) || []
      );

    const uniqueProductIds =
      [
        ...new Set(
          productIds.map(
            (id: any) =>
              String(id)
          )
        ),
      ].filter(
        (id) =>
          mongoose.Types.ObjectId.isValid(
            id
          )
      );

    const products =
      await Product.find({
        _id: {
          $in:
            uniqueProductIds,
        },
      }).select(
        '_id images'
      );

    const productMap =
      new Map<string, any>(
        products.map(
          (product) => [
            product._id.toString(),
            product,
          ]
        )
      );

    const ordersWithImages =
      orders.map(
        (order: any) => ({
          ...order,

          items:
            order.items?.map(
              (item: any) => {
                if (
                  item.image
                ) {
                  return item;
                }

                const product =
                  productMap.get(
                    String(
                      item.product
                    )
                  );

                return {
                  ...item,
                  image:
                    getProductImage(
                      product
                    ),
                };
              }
            ) || [],
        })
      );

    res.status(200).json({
      success: true,

      count:
        ordersWithImages.length,

      orders:
        ordersWithImages,
    });
  } catch (error) {
    console.error(
      'Get all orders error:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Failed to fetch orders.',
    });
  }
};

/*
 * --------------------------------------------------
 * GET MY ORDERS - CUSTOMER
 * GET /api/orders/my-orders
 * --------------------------------------------------
 */
export const getMyOrders = async (
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

    const orders =
      await Order.find({
        user: req.user.id,
      })
        .sort({
          createdAt: -1,
        })
        .lean();

    /*
     * Recover old product images.
     */
    const productIds =
      orders.flatMap(
        (order: any) =>
          order.items
            ?.map(
              (item: any) =>
                item.product
            )
            .filter(Boolean) || []
      );

    const uniqueProductIds =
      [
        ...new Set(
          productIds.map(
            (id: any) =>
              String(id)
          )
        ),
      ].filter(
        (id) =>
          mongoose.Types.ObjectId.isValid(
            id
          )
      );

    const products =
      await Product.find({
        _id: {
          $in:
            uniqueProductIds,
        },
      }).select(
        '_id images'
      );

    const productMap =
      new Map<string, any>(
        products.map(
          (product) => [
            product._id.toString(),
            product,
          ]
        )
      );

    const ordersWithImages =
      orders.map(
        (order: any) => ({
          ...order,

          items:
            order.items?.map(
              (item: any) => {
                if (
                  item.image
                ) {
                  return item;
                }

                const product =
                  productMap.get(
                    String(
                      item.product
                    )
                  );

                return {
                  ...item,
                  image:
                    getProductImage(
                      product
                    ),
                };
              }
            ) || [],
        })
      );

    res.status(200).json({
      success: true,

      orders:
        ordersWithImages,
    });
  } catch (error) {
    console.error(
      'Get orders error:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Failed to fetch orders.',
    });
  }
};

/*
 * --------------------------------------------------
 * GET ONE ORDER
 * GET /api/orders/:id
 * --------------------------------------------------
 */
export const getOrderById =
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

      const id = String(
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
            'Invalid order ID.',
        });

        return;
      }

      const order =
        await Order.findOne({
          _id: id,
          user: req.user.id,
        }).lean();

      if (!order) {
        res.status(404).json({
          success: false,
          message:
            'Order not found.',
        });

        return;
      }

      const productIds =
        order.items
          ?.map(
            (item: any) =>
              item.product
          )
          .filter(Boolean) || [];

      const products =
        await Product.find({
          _id: {
            $in: productIds,
          },
        }).select(
          '_id images'
        );

      const productMap =
        new Map<string, any>(
          products.map(
            (product) => [
              product._id.toString(),
              product,
            ]
          )
        );

      const orderWithImages =
        {
          ...order,

          items:
            order.items?.map(
              (item: any) => ({
                ...item,

                image:
                  item.image ||
                  getProductImage(
                    productMap.get(
                      String(
                        item.product
                      )
                    )
                  ),
              })
            ) || [],
        };

      res.status(200).json({
        success: true,

        order:
          orderWithImages,
      });
    } catch (error) {
      console.error(
        'Get order error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Failed to fetch order.',
      });
    }
  };

/*
 * --------------------------------------------------
 * CANCEL ORDER
 * PUT /api/orders/:id/cancel
 * --------------------------------------------------
 */
export const cancelOrder = async (
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

    const id = String(
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
          'Invalid order ID.',
      });

      return;
    }

    const order =
      await Order.findOne({
        _id: id,
        user: req.user.id,
      });

    if (!order) {
      res.status(404).json({
        success: false,
        message:
          'Order not found.',
      });

      return;
    }

    if (
      order.orderStatus ===
        'Delivered' ||
      order.orderStatus ===
        'Cancelled'
    ) {
      res.status(400).json({
        success: false,
        message:
          `Order cannot be cancelled because it is already ${order.orderStatus.toLowerCase()}.`,
      });

      return;
    }

    order.orderStatus =
      'Cancelled';

    await order.save();

    res.status(200).json({
      success: true,

      message:
        'Order cancelled successfully.',

      order,
    });
  } catch (error) {
    console.error(
      'Cancel order error:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Failed to cancel order.',
    });
  }
};

/*
 * --------------------------------------------------
 * ADMIN UPDATE ORDER STATUS
 * PUT /api/orders/:id/status
 * --------------------------------------------------
 */
export const updateOrderStatus =
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

      const id = String(
        req.params.id
      );

      const {
        status,
      } = req.body;

      const validStatuses = [
        'Pending',
        'Confirmed',
        'Processing',
        'Shipped',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
        'Returned',
      ];

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        res.status(400).json({
          success: false,
          message:
            'Invalid order ID.',
        });

        return;
      }

      if (
        !validStatuses.includes(
          status
        )
      ) {
        res.status(400).json({
          success: false,
          message:
            'Invalid order status.',
        });

        return;
      }

      const order =
        await Order.findByIdAndUpdate(
          id,
          {
            orderStatus:
              status,
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!order) {
        res.status(404).json({
          success: false,
          message:
            'Order not found.',
        });

        return;
      }

      res.status(200).json({
        success: true,

        message:
          'Order status updated successfully.',

        order,
      });
    } catch (error) {
      console.error(
        'Update order status error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Failed to update order status.',
      });
    }
  };

/*
 * --------------------------------------------------
 * ADMIN UPDATE PAYMENT STATUS
 * PUT /api/orders/:id/payment-status
 * --------------------------------------------------
 */
export const updatePaymentStatus =
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

      const id = String(
        req.params.id
      );

      const {
        paymentStatus,
      } = req.body;

      /*
       * Only two states are allowed
       * in the Admin Orders panel.
       */
      const validPaymentStatuses = [
        'Pending',
        'Paid',
      ];

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        res.status(400).json({
          success: false,
          message:
            'Invalid order ID.',
        });

        return;
      }

      if (
        !validPaymentStatuses.includes(
          paymentStatus
        )
      ) {
        res.status(400).json({
          success: false,
          message:
            'Payment status must be Pending or Paid.',
        });

        return;
      }

      const order =
        await Order.findByIdAndUpdate(
          id,
          {
            paymentStatus:
              paymentStatus,
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!order) {
        res.status(404).json({
          success: false,
          message:
            'Order not found.',
        });

        return;
      }

      res.status(200).json({
        success: true,

        message:
          'Payment status updated successfully.',

        order,
      });
    } catch (error) {
      console.error(
        'Update payment status error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Failed to update payment status.',
      });
    }
  };