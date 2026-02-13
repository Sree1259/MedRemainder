import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '@common/errorHandler';
import { validateBody } from '@common/validation';
import { authenticate, AuthRequest } from '@common/auth';
import { authRateLimiter } from '@common/rateLimiter';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  changePassword,
} from './auth.service';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  timezone: z.string().optional(),
  locale: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// Routes
router.post(
  '/register',
  authRateLimiter,
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const result = await registerUser(req.body);
    res.status(201).json({
      success: true,
      data: result,
    });
  })
);

router.post(
  '/login',
  authRateLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await loginUser(req.body.email, req.body.password);
    res.json({
      success: true,
      data: result,
    });
  })
);

router.post(
  '/refresh',
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    const tokens = await refreshAccessToken(req.body.refreshToken);
    res.json({
      success: true,
      data: tokens,
    });
  })
);

router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const result = await changePassword(
      req.user!.id,
      req.body.currentPassword,
      req.body.newPassword
    );
    res.json({
      success: true,
      data: result,
    });
  })
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    res.json({
      success: true,
      data: { user: req.user },
    });
  })
);

export default router;
