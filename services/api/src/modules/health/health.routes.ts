import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '@common/errorHandler';
import { validateBody } from '@common/validation';
import { authenticate, AuthRequest } from '@common/auth';
import { addMeasurement, getMeasurements, getMeasurementStats, deleteMeasurement } from './health.service';

const router = Router();

const measurementSchema = z.object({
  metricType: z.string().min(1, 'Metric type is required'),
  value: z.number(),
  valueSecondary: z.number().optional(),
  unit: z.string().min(1, 'Unit is required'),
  measuredAt: z.string().datetime(),
  notes: z.string().optional(),
  source: z.string().optional(),
});

router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const measurements = await getMeasurements(req.user!.id, {
      metricType: req.query.metricType as string | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    });
    res.json({
      success: true,
      data: measurements,
    });
  })
);

router.get(
  '/stats',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.query.metricType) {
      res.status(400).json({
        success: false,
        error: { message: 'metricType is required' },
      });
      return;
    }
    
    const stats = await getMeasurementStats(
      req.user!.id,
      req.query.metricType as string,
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
  validateBody(measurementSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const measurement = await addMeasurement(req.user!.id, {
      ...req.body,
      measuredAt: new Date(req.body.measuredAt),
    });
    res.status(201).json({
      success: true,
      data: measurement,
    });
  })
);

router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const result = await deleteMeasurement(req.user!.id, req.params.id);
    res.json({
      success: true,
      data: result,
    });
  })
);

export default router;
