import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '@common/errorHandler';
import { validateBody } from '@common/validation';
import { authenticate, AuthRequest } from '@common/auth';
import { ScheduleType } from '@common/prisma';
import { createSchedule, getSchedules, updateSchedule, deleteSchedule } from './schedule.service';

const router = Router({ mergeParams: true });

const scheduleSchema = z.object({
  medicationId: z.string().uuid(),
  scheduleType: z.nativeEnum(ScheduleType),
  timesPerDay: z.number().min(1).max(10),
  timeSlots: z.array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  intervalDays: z.number().min(1).optional(),
  cycleDaysOn: z.number().min(1).optional(),
  cycleDaysOff: z.number().min(1).optional(),
});

router.get(
  '/medication/:medicationId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const schedules = await getSchedules(req.user!.id, req.params.medicationId);
    res.json({
      success: true,
      data: schedules,
    });
  })
);

router.post(
  '/',
  authenticate,
  validateBody(scheduleSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const schedule = await createSchedule(req.user!.id, req.body.medicationId, req.body);
    res.status(201).json({
      success: true,
      data: schedule,
    });
  })
);

router.patch(
  '/:id',
  authenticate,
  validateBody(scheduleSchema.partial().omit({ medicationId: true })),
  asyncHandler(async (req: AuthRequest, res) => {
    const schedule = await updateSchedule(req.user!.id, req.params.id, req.body);
    res.json({
      success: true,
      data: schedule,
    });
  })
);

router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const result = await deleteSchedule(req.user!.id, req.params.id);
    res.json({
      success: true,
      data: result,
    });
  })
);

export default router;
