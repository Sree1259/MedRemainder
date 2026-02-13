import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '@common/errorHandler';
import { validateBody } from '@common/validation';
import { authenticate, AuthRequest } from '@common/auth';
import { createAppointment, getAppointments, updateAppointment, deleteAppointment } from './appointment.service';

const router = Router();

const appointmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  doctorName: z.string().optional(),
  location: z.string().optional(),
  appointmentAt: z.string().datetime(),
  reminderMinutesBefore: z.number().min(0).optional(),
  notes: z.string().optional(),
});

router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const appointments = await getAppointments(req.user!.id, {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    });
    res.json({
      success: true,
      data: appointments,
    });
  })
);

router.post(
  '/',
  authenticate,
  validateBody(appointmentSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const appointment = await createAppointment(req.user!.id, {
      ...req.body,
      appointmentAt: new Date(req.body.appointmentAt),
    });
    res.status(201).json({
      success: true,
      data: appointment,
    });
  })
);

router.patch(
  '/:id',
  authenticate,
  validateBody(appointmentSchema.partial()),
  asyncHandler(async (req: AuthRequest, res) => {
    const appointment = await updateAppointment(req.user!.id, req.params.id, {
      ...req.body,
      appointmentAt: req.body.appointmentAt ? new Date(req.body.appointmentAt) : undefined,
    });
    res.json({
      success: true,
      data: appointment,
    });
  })
);

router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const result = await deleteAppointment(req.user!.id, req.params.id);
    res.json({
      success: true,
      data: result,
    });
  })
);

export default router;
