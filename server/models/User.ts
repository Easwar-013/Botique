import mongoose, {
  Document,
  Schema,
} from 'mongoose';

export type UserRole =
  | 'customer'
  | 'admin'
  | 'staff'
  | 'superadmin';

export interface IUser
  extends Document {
  name: string;
  email: string;

  /*
   * Manual-login users have a password.
   * Google-only users may not.
   */
  password?: string;

  phone?: string;

  role: UserRole;

  /*
   * Google account ID.
   */
  googleId?: string;

  /*
   * Google profile photo URL.
   */
  avatar?: string | null;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const userSchema =
  new Schema<IUser>(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },

      password: {
        type: String,
        required: false,
        minlength: 6,
      },

      phone: {
        type: String,
        trim: true,
      },

      role: {
        type: String,
        enum: [
          'customer',
          'admin',
          'staff',
          'superadmin',
        ],
        default: 'customer',
      },

      /*
       * Google account ID.
       *
       * sparse allows multiple users
       * without googleId.
       */
      googleId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
      },

      /*
       * Google profile image.
       */
      avatar: {
        type: String,
        default: null,
        trim: true,
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

export default mongoose.model<IUser>(
  'User',
  userSchema
);