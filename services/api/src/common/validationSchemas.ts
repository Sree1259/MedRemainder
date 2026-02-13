import { z } from 'zod';
import { MedicationForm, ScheduleType, DoseAction } from '@common/prisma';

// Common validation patterns
export const uuidSchema = z.string().uuid();

export const paginationSchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
});

// Schedule validation - reused across medications and schedules
export const scheduleValidationSchema = z.object({
  scheduleType: z.nativeEnum(ScheduleType),
  timesPerDay: z.number().min(1).max(10),
  timeSlots: z.array(
    z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format')
  ),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  intervalDays: z.number().min(1).optional(),
  cycleDaysOn: z.number().min(1).optional(),
  cycleDaysOff: z.number().min(1).optional(),
});

// Medication schemas
export const createMedicationSchema = z.object({
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
  pharmacyId: uuidSchema.optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  schedules: z.array(scheduleValidationSchema).min(1, 'At least one schedule is required'),
});

export const updateMedicationSchema = createMedicationSchema.partial();

// Dose log schemas
export const logDoseSchema = z.object({
  medicationId: uuidSchema,
  scheduledTime: z.string().datetime(),
  action: z.nativeEnum(DoseAction),
  notes: z.string().optional(),
});

// Health measurement schemas
export const healthMeasurementSchema = z.object({
  metricType: z.string().min(1, 'Metric type is required'),
  value: z.number(),
  valueSecondary: z.number().optional(),
  unit: z.string().min(1, 'Unit is required'),
  measuredAt: z.string().datetime(),
  notes: z.string().optional(),
  source: z.string().optional(),
});

// Appointment schemas
export const appointmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  doctorName: z.string().optional(),
  location: z.string().optional(),
  appointmentAt: z.string().datetime(),
  reminderMinutesBefore: z.number().min(0).optional(),
  notes: z.string().optional(),
});

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  timezone: z.string().optional(),
  locale: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// MedFriend schemas
export const inviteMedfriendSchema = z.object({
  email: z.string().email(),
  permissions: z
    .object({
      viewMeds: z.boolean(),
      viewHealth: z.boolean(),
    })
    .optional(),
  notifyOnMiss: z.boolean().optional(),
});

// Type inference helpers
export type CreateMedicationInput = z.infer<typeof createMedicationSchema>;
export type UpdateMedicationInput = z.infer<typeof updateMedicationSchema>;
export type LogDoseInput = z.infer<typeof logDoseSchema>;
export type HealthMeasurementInput = z.infer<typeof healthMeasurementSchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type InviteMedfriendInput = z.infer<typeof inviteMedfriendSchema>;
