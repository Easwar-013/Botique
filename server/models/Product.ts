import mongoose, { Document, Schema } from 'mongoose';

export interface IProductImage {
  url: string;
  publicId: string;
  isPrimary: boolean;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description?: string;
  brand?: string;

  sku: string;

  category: string;
  subcategory?: string;

  price: number;
  discountPrice?: number;

  stock: number;

  sizes: string[];
  colors: string[];

  images: IProductImage[];

  tags: string[];

  ratingsAverage: number;
  ratingsQuantity: number;

  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const productImageSchema =
  new Schema<IProductImage>(
    {
      url: {
        type: String,
        required: true,
        trim: true,
      },

      publicId: {
        type: String,
        required: true,
        trim: true,
      },

      isPrimary: {
        type: Boolean,
        default: false,
      },
    },
    {
      _id: false,
    }
  );

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    /*
     * Generated automatically by the backend.
     */
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    description: {
      type: String,
      default: '',
      trim: true,
    },

    brand: {
      type: String,
      trim: true,
      default: 'Atelier',
    },

    /*
     * Generated automatically by the backend.
     */
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    subcategory: {
      type: String,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPrice: {
      type: Number,
      min: 0,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    sizes: {
      type: [String],
      default: [],
    },

    /*
     * Example:
     * ["Black", "White", "Red"]
     */
    colors: {
      type: [String],
      default: [],
    },

    images: {
      type: [productImageSchema],
      default: [],
    },

    tags: {
      type: [String],
      default: [],
    },

    ratingsAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isNewArrival: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({
  name: 'text',
  description: 'text',
  brand: 'text',
  sku: 'text',
});

productSchema.index({
  category: 1,
});

productSchema.index({
  price: 1,
});

productSchema.index({
  createdAt: -1,
});

const Product = mongoose.model<IProduct>(
  'Product',
  productSchema
);

export default Product;