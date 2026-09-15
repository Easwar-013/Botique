import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

import User from '../models/User';

type UserRole =
  | 'customer'
  | 'admin'
  | 'staff'
  | 'superadmin';

const googleClient =
  new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
  );

const createToken = (
  userId: string,
  role: UserRole
): string => {
  const secret =
    process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      'JWT_SECRET is not configured'
    );
  }

  return jwt.sign(
    {
      id: userId,
      role,
    },
    secret,
    {
      expiresIn: '7d',
    }
  );
};

/*
 * Create the common user response.
 *
 * We return both `id` and `_id`
 * for compatibility with your current
 * frontend/backend code.
 */
const getUserResponse = (
  user: any
) => {
  return {
    id: user._id.toString(),
    _id: user._id.toString(),

    name: user.name,

    email: user.email,

    phone: user.phone || '',

    role: user.role,

    avatar: user.avatar || null,

    addresses: [],
  };
};

/**
 * Customer Registration
 */
export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      phone,
    } = req.body;

    if (
      !name ||
      !email ||
      !password
    ) {
      res.status(400).json({
        success: false,
        message:
          'Name, email and password are required',
      });

      return;
    }

    const normalizedEmail =
      String(email)
        .trim()
        .toLowerCase();

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message:
          'Email is already registered',
      });

      return;
    }

    const hashedPassword =
      await bcrypt.hash(
        String(password),
        12
      );

    const user =
      await User.create({
        name: String(name).trim(),

        email: normalizedEmail,

        password:
          hashedPassword,

        phone: phone
          ? String(phone).trim()
          : undefined,

        role: 'customer',

        isActive: true,

        avatar: null,

        googleId: undefined,
      });

    const token =
      createToken(
        user._id.toString(),
        user.role as UserRole
      );

    res.status(201).json({
      success: true,

      message:
        'Registration successful',

      token,

      user:
        getUserResponse(user),
    });
  } catch (error) {
    console.error(
      'Register error:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Registration failed',
    });
  }
};

/**
 * Customer / Database User Login
 */
export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (
      !email ||
      !password
    ) {
      res.status(400).json({
        success: false,
        message:
          'Email and password are required',
      });

      return;
    }

    const normalizedEmail =
      String(email)
        .trim()
        .toLowerCase();

    const user =
      await User.findOne({
        email: normalizedEmail,
      });

    if (!user) {
      res.status(401).json({
        success: false,
        message:
          'Invalid email or password',
      });

      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message:
          'Your account has been disabled',
      });

      return;
    }

    /*
     * Google-only account
     * does not have a password.
     */
    if (!user.password) {
      res.status(400).json({
        success: false,
        message:
          'This account uses Google Sign-In. Please continue with Google.',
      });

      return;
    }

    const passwordMatches =
      await bcrypt.compare(
        String(password),
        user.password
      );

    if (!passwordMatches) {
      res.status(401).json({
        success: false,
        message:
          'Invalid email or password',
      });

      return;
    }

    const token =
      createToken(
        user._id.toString(),
        user.role as UserRole
      );

    res.status(200).json({
      success: true,

      message:
        'Login successful',

      token,

      user:
        getUserResponse(user),
    });
  } catch (error) {
    console.error(
      'Login error:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Login failed',
    });
  }
};

/**
 * Google Login / Registration
 *
 * POST /api/auth/google
 *
 * The frontend sends Google's ID token
 * in:
 *
 * {
 *   credential: '...'
 * }
 */
export const googleLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      credential,
    } = req.body;

    if (!credential) {
      res.status(400).json({
        success: false,
        message:
          'Google credential is required',
      });

      return;
    }

    const googleClientId =
      process.env
        .GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      console.error(
        'GOOGLE_CLIENT_ID is missing from server .env'
      );

      res.status(500).json({
        success: false,
        message:
          'Google authentication is not configured on the server',
      });

      return;
    }

    /*
     * Verify the Google ID token.
     */
    const ticket =
      await googleClient.verifyIdToken(
        {
          idToken:
            String(credential),

          audience:
            googleClientId,
        }
      );

    const payload =
      ticket.getPayload();

    if (!payload) {
      res.status(401).json({
        success: false,
        message:
          'Invalid Google credential',
      });

      return;
    }

    const googleId =
      payload.sub;

    const email =
      payload.email
        ?.trim()
        .toLowerCase();

    const name =
      payload.name ||
      payload.given_name ||
      'Google User';

    const picture =
      payload.picture ||
      null;

    /*
     * Google email must be verified.
     */
    const emailVerified =
      payload.email_verified;

    if (
      !googleId ||
      !email
    ) {
      res.status(401).json({
        success: false,
        message:
          'Google account information is incomplete',
      });

      return;
    }

    if (!emailVerified) {
      res.status(401).json({
        success: false,
        message:
          'Your Google email is not verified',
      });

      return;
    }

    /*
     * First find by Google ID.
     */
    let user =
      await User.findOne({
        googleId,
      });

    /*
     * If the user previously created
     * a manual BOUTIQUE account using
     * this same email, link Google to it.
     */
    if (!user) {
      user =
        await User.findOne({
          email,
        });
    }

    /*
     * Existing BOUTIQUE account.
     */
    if (user) {
      /*
       * Don't allow inactive accounts.
       */
      if (!user.isActive) {
        res.status(403).json({
          success: false,
          message:
            'Your account has been disabled',
        });

        return;
      }

      /*
       * Google sign-in is intended for
       * customer accounts.
       *
       * This prevents an admin/staff
       * account from automatically using
       * Google authentication.
       */
      if (
        user.role !==
          'customer'
      ) {
        res.status(403).json({
          success: false,
          message:
            'Google Sign-In is available only for customer accounts',
        });

        return;
      }

      /*
       * Link Google account.
       */
      user.googleId =
        googleId;

      /*
       * Save Google's latest profile
       * picture when available.
       */
      if (picture) {
        user.avatar =
          picture;
      }

      /*
       * Keep the customer's existing
       * BOUTIQUE name if already set.
       */
      if (!user.name) {
        user.name =
          name;
      }

      await user.save();
    } else {
      /*
       * New Google customer.
       */
      user =
        await User.create({
          name,

          email,

          role: 'customer',

          /*
           * Google-only account.
           * No normal password.
           */
          password:
            undefined,

          phone: undefined,

          googleId,

          avatar:
            picture,

          isActive: true,
        });
    }

    /*
     * Create the same BOUTIQUE JWT
     * used by normal login.
     */
    const token =
      createToken(
        user._id.toString(),
        user.role as UserRole
      );

    res.status(200).json({
      success: true,

      message:
        'Google login successful',

      token,

      user:
        getUserResponse(user),
    });
  } catch (error: any) {
    console.error(
      'Google authentication error:',
      error
    );

    /*
     * Development logging.
     */
    if (error?.message) {
      console.error(
        'Google error message:',
        error.message
      );
    }

    res.status(401).json({
      success: false,
      message:
        'Google authentication failed',
    });
  }
};

/**
 * Admin Login
 *
 * Credentials come ONLY from server/.env
 *
 * ADMIN_USERNAME=admin
 * ADMIN_PASSWORD=Admin@12345
 */
export const adminLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      username,
      password,
    } = req.body;

    if (
      !username ||
      !password
    ) {
      res.status(400).json({
        success: false,
        message:
          'Admin username and password are required',
      });

      return;
    }

    const configuredUsername =
      process.env
        .ADMIN_USERNAME;

    const configuredPassword =
      process.env
        .ADMIN_PASSWORD;

    if (
      !configuredUsername ||
      !configuredPassword
    ) {
      console.error(
        'ADMIN_USERNAME or ADMIN_PASSWORD is missing from .env'
      );

      res.status(500).json({
        success: false,
        message:
          'Admin credentials are not configured on the server',
      });

      return;
    }

    const usernameMatches =
      String(username).trim() ===
      configuredUsername.trim();

    const passwordMatches =
      String(password) ===
      configuredPassword;

    if (
      !usernameMatches ||
      !passwordMatches
    ) {
      res.status(401).json({
        success: false,
        message:
          'Invalid admin credentials',
      });

      return;
    }

    const token =
      createToken(
        'env-admin',
        'admin'
      );

    res.status(200).json({
      success: true,

      message:
        'Admin login successful',

      token,

      user: {
        id: 'env-admin',

        _id: 'env-admin',

        name: 'Administrator',

        email:
          configuredUsername,

        role: 'admin',

        phone: '',

        avatar: null,

        addresses: [],
      },
    });
  } catch (error) {
    console.error(
      'Admin login error:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Admin login failed',
    });
  }
};