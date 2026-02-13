import { prisma, DoseAction } from '@common/prisma';
import { AppError } from '@common/errorHandler';

export const logDose = async (
  userId: string,
  medicationId: string,
  data: {
    scheduledTime: Date;
    action: DoseAction;
    notes?: string;
  }
) => {
  // Verify medication belongs to user
  const medication = await prisma.medication.findFirst({
    where: { id: medicationId, userId },
  });

  if (!medication) {
    throw new AppError('Medication not found', 404);
  }

  // If dose was taken, decrement quantity
  if (data.action === 'TAKEN' && !medication.isAsNeeded) {
    await prisma.medication.update({
      where: { id: medicationId },
      data: {
        quantityRemaining: {
          decrement: 1,
        },
      },
    });
  }

  const doseLog = await prisma.doseLog.create({
    data: {
      medicationId,
      userId,
      scheduledTime: data.scheduledTime,
      action: data.action,
      actionTime: new Date(),
      notes: data.notes,
    },
    include: {
      medication: {
        select: {
          name: true,
          dosage: true,
          quantityRemaining: true,
        },
      },
    },
  });

  return doseLog;
};

export const getDoseLogs = async (
  userId: string,
  options: {
    medicationId?: string;
    startDate?: Date;
    endDate?: Date;
    action?: DoseAction;
  } = {}
) => {
  const where: any = { userId };

  if (options.medicationId) {
    where.medicationId = options.medicationId;
  }

  if (options.startDate || options.endDate) {
    where.scheduledTime = {};
    if (options.startDate) {
      where.scheduledTime.gte = options.startDate;
    }
    if (options.endDate) {
      where.scheduledTime.lte = options.endDate;
    }
  }

  if (options.action) {
    where.action = options.action;
  }

  const logs = await prisma.doseLog.findMany({
    where,
    include: {
      medication: {
        select: {
          name: true,
          dosage: true,
          form: true,
        },
      },
    },
    orderBy: { scheduledTime: 'desc' },
  });

  return logs;
};

export const getAdherenceStats = async (
  userId: string,
  medicationId?: string,
  days: number = 30
) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const where: any = {
    userId,
    scheduledTime: {
      gte: startDate,
    },
  };

  if (medicationId) {
    where.medicationId = medicationId;
  }

  const logs = await prisma.doseLog.groupBy({
    by: ['action'],
    where,
    _count: {
      action: true,
    },
  });

  const stats = {
    taken: 0,
    skipped: 0,
    missed: 0,
    snoozed: 0,
    total: 0,
    adherenceRate: 0,
  };

  logs.forEach((log) => {
    const count = log._count.action;
    stats.total += count;
    
    switch (log.action) {
      case 'TAKEN':
        stats.taken = count;
        break;
      case 'SKIPPED':
        stats.skipped = count;
        break;
      case 'MISSED':
        stats.missed = count;
        break;
      case 'SNOOZED':
        stats.snoozed = count;
        break;
    }
  });

  // Calculate adherence rate
  if (stats.total > 0) {
    stats.adherenceRate = Math.round((stats.taken / stats.total) * 100);
  }

  return stats;
};
