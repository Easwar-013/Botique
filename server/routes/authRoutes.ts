import { Router } from 'express';

import {
  register,
  login,
  adminLogin,
  googleLogin,
} from '../controllers/authController';

const router = Router();

router.post(
  '/register',
  register
);

router.post(
  '/login',
  login
);

router.post(
  '/admin-login',
  adminLogin
);

/*
 * Google Sign-In / Register
 */
router.post(
  '/google',
  googleLogin
);

export default router;