import mongoose, {
  Document,
  Schema,
} from 'mongoose';

export interface IReview
  extends Document {
  product: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema =
  new Schema<IReview>(
    {
      product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true,
      },

      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },

      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },

      comment: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 1000,
      },
    },
    {
      timestamps: true,
    }
  );

/*
 * One customer can review a product
 * only once.
 */
reviewSchema.index(
  {
    product: 1,
    user: 1,
  },
  {
    unique: true,
  }
);

const Review =
  mongoose.model<IReview>(
    'Review',
    reviewSchema
  );

export default Review;