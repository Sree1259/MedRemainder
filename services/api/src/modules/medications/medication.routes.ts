import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { asyncHandler } from '@common/errorHandler';
import { validateBody } from '@common/validation';
import { authenticate, AuthRequest } from '@common/auth';
import { MedicationForm, ScheduleType } from '@common/prisma';
import { uploadToMinio } from '@common/storage';
import {
  createMedication,
  getMedications,
  getMedicationById,
  updateMedication,
  deleteMedication,
  updateMedicationPhoto,
  checkRefillNeeded,
} from './medication.service';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Validation schemas
const scheduleSchema = z.object({
  scheduleType: z.nativeEnum(ScheduleType),
  timesPerDay: z.number().min(1).max(10),
  timeSlots: z.array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  intervalDays: z.number().min(1).optional(),
  cycleDaysOn: z.number().min(1).optional(),
  cycleDaysOff: z.number().min(1).optional(),
});

const createMedicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  genericName: z.string().optional(),
  dosage: z.string().min(1, 'Dosage is required'),
  form: z.nativeEnum(MedicationForm),
  shape: z.string().optional(),
  color: z.string().optional(),
  instructions: z.string().optional(),
  quantityTotal: z.number().min(0),
  quantityRemaining: z.number().min(0),
  refillThreshold: z.number().min(0),
  isAsNeeded: z.boolean().default(false),
  rxNumber: z.string().optional(),
  prescriber: z.string().optional(),
  pharmacyId: z.string().uuid().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  schedules: z.array(scheduleSchema).min(1, 'At least one schedule is required'),
});

const updateMedicationSchema = createMedicationSchema.partial();

// Routes
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const medications = await getMedications(req.user!.id, {
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
    });
    res.json({
      success: true,
      data: medications,
    });
  })
);

router.get(
  '/refill-needed',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const medications = await checkRefillNeeded(req.user!.id);
    res.json({
      success: true,
      data: medications,
    });
  })
);

router.post(
  '/',
  authenticate,
  validateBody(createMedicationSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const medication = await createMedication(req.user!.id, {
      ...req.body,
      startDate: new Date(req.body.startDate),
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
    });
    res.status(201).json({
      success: true,
      data: medication,
    });
  })
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const medication = await getMedicationById(req.user!.id, req.params.id);
    res.json({
      success: true,
      data: medication,
    });
  })
);

router.patch(
  '/:id',
  authenticate,
  validateBody(updateMedicationSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const medication = await updateMedication(req.user!.id, req.params.id, {
      ...req.body,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
    });
    res.json({
      success: true,
      data: medication,
    });
  })
);

router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const result = await deleteMedication(req.user!.id, req.params.id);
    res.json({
      success: true,
      data: result,
    });
  })
);

router.post(
  '/:id/photo',
  authenticate,
  upload.single('photo'),
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { message: 'No photo uploaded' },
      });
      return;
    }

    const photoUrl = await uploadToMinio(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      `medications/${req.user!.id}`
    );

    const medication = await updateMedicationPhoto(req.user!.id, req.params.id, photoUrl);
    res.json({
      success: true,
      data: medication,
    });
  })
);

export default router;
