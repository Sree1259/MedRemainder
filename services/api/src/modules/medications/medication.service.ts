import { prisma, MedicationForm, ScheduleType } from '@common/prisma';
import { AppError } from '@common/errorHandler';

export interface CreateMedicationInput {
  name: string;
  genericName?: string;
  dosage: string;
  form: MedicationForm;
  shape?: string;
  color?: string;
  instructions?: string;
  quantityTotal: number;
  quantityRemaining: number;
  refillThreshold: number;
  isAsNeeded: boolean;
  rxNumber?: string;
  prescriber?: string;
  pharmacyId?: string;
  startDate: Date;
  endDate?: Date;
  schedules: {
    scheduleType: ScheduleType;
    timesPerDay: number;
    timeSlots: string[];
    daysOfWeek?: number[];
    intervalDays?: number;
    cycleDaysOn?: number;
    cycleDaysOff?: number;
  }[];
}

export const createMedication = async (
  userId: string,
  data: CreateMedicationInput
) => {
  // Check medication limit for free users
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        include: { plan: true },
      },
      _count: {
        select: { medications: true },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isPremium = user.isPremium || user.subscriptions.length > 0;
  const medicationCount = user._count.medications;

  if (!isPremium && medicationCount >= 10) {
    throw new AppError(
      'Free users can only add up to 10 medications. Upgrade to premium for unlimited medications.',
      403
    );
  }

  const medication = await prisma.medication.create({
    data: {
      userId,
      name: data.name,
      genericName: data.genericName,
      dosage: data.dosage,
      form: data.form,
      shape: data.shape,
      color: data.color,
      instructions: data.instructions,
      quantityTotal: data.quantityTotal,
      quantityRemaining: data.quantityRemaining,
      refillThreshold: data.refillThreshold,
      isAsNeeded: data.isAsNeeded,
      rxNumber: data.rxNumber,
      prescriber: data.prescriber,
      pharmacyId: data.pharmacyId,
      startDate: data.startDate,
      endDate: data.endDate,
      schedules: {
        create: data.schedules,
      },
    },
    include: {
      schedules: true,
      pharmacy: true,
    },
  });

  return medication;
};

export const getMedications = async (
  userId: string,
  options: {
    isActive?: boolean;
    includeFamily?: boolean;
  } = {}
) => {
  const where: any = { userId };

  if (options.isActive !== undefined) {
    where.isActive = options.isActive;
  }

  const medications = await prisma.medication.findMany({
    where,
    include: {
      schedules: true,
      pharmacy: true,
      familyProfile: true,
      _count: {
        select: { doseLogs: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return medications;
};

export const getMedicationById = async (userId: string, medicationId: string) => {
  const medication = await prisma.medication.findFirst({
    where: {
      id: medicationId,
      userId,
    },
    include: {
      schedules: true,
      pharmacy: true,
      familyProfile: true,
      doseLogs: {
        orderBy: { scheduledTime: 'desc' },
        take: 30,
      },
    },
  });

  if (!medication) {
    throw new AppError('Medication not found', 404);
  }

  return medication;
};

export const updateMedication = async (
  userId: string,
  medicationId: string,
  data: Partial<CreateMedicationInput>
) => {
  const existing = await prisma.medication.findFirst({
    where: { id: medicationId, userId },
  });

  if (!existing) {
    throw new AppError('Medication not found', 404);
  }

  const medication = await prisma.medication.update({
    where: { id: medicationId },
    data: {
      name: data.name,
      genericName: data.genericName,
      dosage: data.dosage,
      form: data.form,
      shape: data.shape,
      color: data.color,
      instructions: data.instructions,
      quantityTotal: data.quantityTotal,
      quantityRemaining: data.quantityRemaining,
      refillThreshold: data.refillThreshold,
      isAsNeeded: data.isAsNeeded,
      rxNumber: data.rxNumber,
      prescriber: data.prescriber,
      pharmacyId: data.pharmacyId,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.endDate && new Date(data.endDate) < new Date() ? false : existing.isActive,
    },
    include: {
      schedules: true,
      pharmacy: true,
    },
  });

  return medication;
};

export const deleteMedication = async (userId: string, medicationId: string) => {
  const existing = await prisma.medication.findFirst({
    where: { id: medicationId, userId },
  });

  if (!existing) {
    throw new AppError('Medication not found', 404);
  }

  await prisma.medication.delete({
    where: { id: medicationId },
  });

  return { message: 'Medication deleted successfully' };
};

export const updateMedicationPhoto = async (
  userId: string,
  medicationId: string,
  photoUrl: string
) => {
  const existing = await prisma.medication.findFirst({
    where: { id: medicationId, userId },
  });

  if (!existing) {
    throw new AppError('Medication not found', 404);
  }

  const medication = await prisma.medication.update({
    where: { id: medicationId },
    data: { photoUrl },
  });

  return medication;
};

export const checkRefillNeeded = async (userId: string) => {
  const medications = await prisma.medication.findMany({
    where: {
      userId,
      isActive: true,
      quantityRemaining: {
        lte: prisma.medication.fields.refillThreshold,
      },
    },
    include: {
      pharmacy: true,
    },
  });

  return medications;
};
