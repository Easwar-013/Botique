import mongoose, {
  Document,
  Model,
  Schema,
} from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  discountType: 'percentage';
  discountValue: number;
  minimumPurchase?: number;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema =
  new Schema<ICoupon>(
    {
      code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
      },

      discountType: {
        type: String,
        enum: ['percentage'],
        default: 'percentage',
        required: true,
      },

      discountValue: {
        type: Number,
        required: true,
        min: 1,
        max: 100,
      },

      minimumPurchase: {
        type: Number,
        min: 0,
        default: undefined,
      },

      expiresAt: {
        type: Date,
        default: undefined,
      },

      isActive: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

const Coupon: Model<ICoupon> =
  mongoose.models.Coupon ||
  mongoose.model<ICoupon>(
    'Coupon',
    couponSchema
  );

export default Coupon;