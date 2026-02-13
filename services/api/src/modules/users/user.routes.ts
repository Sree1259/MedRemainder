import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { asyncHandler } from '@common/errorHandler';
import { validateBody } from '@common/validation';
import { authenticate, AuthRequest } from '@common/auth';
import { uploadToMinio } from '@common/storage';
import { getUserProfile, updateUserProfile, getDashboardStats } from './user.service';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  weekendMode: z.boolean().optional(),
});

router.get(
  '/profile',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const profile = await getUserProfile(req.user!.id);
    res.json({
      success: true,
      data: profile,
    });
  })
);

router.patch(
  '/profile',
  authenticate,
  validateBody(updateProfileSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const profile = await updateUserProfile(req.user!.id, req.body);
    res.json({
      success: true,
      data: profile,
    });
  })
);

router.post(
  '/avatar',
  authenticate,
  upload.single('avatar'),
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { message: 'No avatar uploaded' },
      });
      return;
    }

    const avatarUrl = await uploadToMinio(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      `avatars/${req.user!.id}`
    );

    const profile = await updateUserProfile(req.user!.id, { avatarUrl });
    res.json({
      success: true,
      data: profile,
    });
  })
);

router.get(
  '/dashboard',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const stats = await getDashboardStats(req.user!.id);
    res.json({
      success: true,
      data: stats,
    });
  })
);

export default router;
