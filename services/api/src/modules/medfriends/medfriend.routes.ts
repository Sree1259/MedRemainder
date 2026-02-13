import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '@common/errorHandler';
import { validateBody } from '@common/validation';
import { authenticate, AuthRequest } from '@common/auth';
import {
  inviteMedfriend,
  acceptInvitation,
  getMyMedfriends,
  getPatientsICareFor,
  revokeMedfriend,
} from './medfriend.service';

const router = Router();

const inviteSchema = z.object({
  email: z.string().email(),
  permissions: z.object({
    viewMeds: z.boolean(),
    viewHealth: z.boolean(),
  }).optional(),
  notifyOnMiss: z.boolean().optional(),
});

const acceptSchema = z.object({
  token: z.string().min(1),
});

router.get(
  '/my-medfriends',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const medfriends = await getMyMedfriends(req.user!.id);
    res.json({
      success: true,
      data: medfriends,
    });
  })
);

router.get(
  '/my-patients',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const patients = await getPatientsICareFor(req.user!.id);
    res.json({
      success: true,
      data: patients,
    });
  })
);

router.post(
  '/invite',
  authenticate,
  validateBody(inviteSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const link = await inviteMedfriend(req.user!.id, req.body);
    res.status(201).json({
      success: true,
      data: link,
    });
  })
);

router.post(
  '/accept',
  authenticate,
  validateBody(acceptSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const link = await acceptInvitation(req.body.token, req.user!.id);
    res.json({
      success: true,
      data: link,
    });
  })
);

router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const result = await revokeMedfriend(req.user!.id, req.params.id);
    res.json({
      success: true,
      data: result,
    });
  })
);

export default router;
