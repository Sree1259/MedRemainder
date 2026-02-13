import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '@common/errorHandler';
import { validateBody } from '@common/validation';
import { authenticate, AuthRequest } from '@common/auth';
import { DoseAction } from '@common/prisma';
import { logDose, getDoseLogs, getAdherenceStats } from './dose-log.service';

const router = Router();

const logDoseSchema = z.object({
  medicationId: z.string().uuid(),
  scheduledTime: z.string().datetime(),
  action: z.nativeEnum(DoseAction),
  notes: z.string().optional(),
});

router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const logs = await getDoseLogs(req.user!.id, {
      medicationId: req.query.medicationId as string | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      action: req.query.action as DoseAction | undefined,
    });
    res.json({
      success: true,
      data: logs,
    });
  })
);

router.get(
  '/stats',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const stats = await getAdherenceStats(
      req.user!.id,
      req.query.medicationId as string | undefined,
      req.query.days ? parseInt(req.query.days as string, 10) : 30
    );
    res.json({
      success: true,
      data: stats,
    });
  })
);

router.post(
  '/',
  authenticate,
  validateBody(logDoseSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const doseLog = await logDose(req.user!.id, req.body.medicationId, {
      scheduledTime: new Date(req.body.scheduledTime),
      action: req.body.action,
      notes: req.body.notes,
    });
    res.status(201).json({
      success: true,
      data: doseLog,
    });
  })
);

export default router;
