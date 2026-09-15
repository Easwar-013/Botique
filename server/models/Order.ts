import mongoose, {
  Document,
  Schema,
} from 'mongoose';

export type PaymentStatus =
  | 'Pending'
  | 'Paid'
  | 'Failed'
  | 'Refunded';

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  image?: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
}

export interface IShippingAddress {
  name: string;
  email?: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface IOrder extends Document {
  orderNumber: string;

  user: mongoose.Types.ObjectId;

  items: IOrderItem[];

  shippingAddress: IShippingAddress;

  subtotal: number;

  shippingCharge: number;

  discount: number;

  totalAmount: number;

  couponCode?: string;

  paymentMethod: string;

  paymentStatus: PaymentStatus;

  orderStatus: OrderStatus;

  createdAt: Date;

  updatedAt: Date;
}

/*
 * ---------------------------------------------
 * Order Item Schema
 * ---------------------------------------------
 */

const orderItemSchema =
  new Schema<IOrderItem>(
    {
      product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },

      name: {
        type: String,
        required: true,
        trim: true,
      },

      image: {
        type: String,
        default: '',
      },

      quantity: {
        type: Number,
        required: true,
        min: 1,
      },

      price: {
        type: Number,
        required: true,
        min: 0,
      },

      size: {
        type: String,
        trim: true,
      },

      color: {
        type: String,
        trim: true,
      },
    },
    {
      _id: false,
    }
  );

/*
 * ---------------------------------------------
 * Shipping Address Schema
 * ---------------------------------------------
 */

const shippingAddressSchema =
  new Schema<IShippingAddress>(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      email: {
        type: String,
        trim: true,
        lowercase: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      address: {
        type: String,
        required: true,
        trim: true,
      },

      city: {
        type: String,
        required: true,
        trim: true,
      },

      state: {
        type: String,
        required: true,
        trim: true,
      },

      pincode: {
        type: String,
        required: true,
        trim: true,
      },
    },
    {
      _id: false,
    }
  );

/*
 * ---------------------------------------------
 * Order Schema
 * ---------------------------------------------
 */

const orderSchema =
  new Schema<IOrder>(
    {
      /*
       * Human-readable order number
       *
       * Example:
       * HO-1757770000000-4821
       */
      orderNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true,
      },

      /*
       * Customer
       */
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },

      /*
       * Products
       */
      items: {
        type: [
          orderItemSchema,
        ],

        required: true,

        validate: {
          validator: (
            items: IOrderItem[]
          ) =>
            Array.isArray(
              items
            ) &&
            items.length > 0,

          message:
            'Order must contain at least one item.',
        },
      },

      /*
       * Delivery address
       */
      shippingAddress: {
        type:
          shippingAddressSchema,
        required: true,
      },

      /*
       * Money
       */
      subtotal: {
        type: Number,
        required: true,
        min: 0,
      },

      shippingCharge: {
        type: Number,
        default: 0,
        min: 0,
      },

      discount: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalAmount: {
        type: Number,
        required: true,
        min: 0,
      },

      /*
       * Coupon
       */
      couponCode: {
        type: String,
        trim: true,
        uppercase: true,
      },

      /*
       * Payment
       */
      paymentMethod: {
        type: String,
        required: true,
        default: 'COD',
        trim: true,
        uppercase: true,
      },

      paymentStatus: {
        type: String,
        enum: [
          'Pending',
          'Paid',
          'Failed',
          'Refunded',
        ],
        default: 'Pending',
      },

      /*
       * Delivery / order status
       */
      orderStatus: {
        type: String,

        enum: [
          'Pending',
          'Confirmed',
          'Processing',
          'Shipped',
          'Out for Delivery',
          'Delivered',
          'Cancelled',
          'Returned',
        ],

        default: 'Pending',

        index: true,
      },
    },
    {
      timestamps: true,
    }
  );

/*
 * Useful indexes
 */
orderSchema.index({
  user: 1,
  createdAt: -1,
});

orderSchema.index({
  orderStatus: 1,
  createdAt: -1,
});

export const Order =
  mongoose.model<IOrder>(
    'Order',
    orderSchema
  );

export default Order;