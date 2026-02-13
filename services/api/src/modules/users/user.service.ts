import { prisma } from '@common/prisma';
import { AppError } from '@common/errorHandler';

export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      timezone: true,
      locale: true,
      role: true,
      isPremium: true,
      weekendMode: true,
      createdAt: true,
      subscriptions: {
        where: { status: 'ACTIVE' },
        include: { plan: true },
      },
      _count: {
        select: {
          medications: true,
          healthMeasurements: true,
          familyProfiles: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

export const updateUserProfile = async (
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    timezone?: string;
    locale?: string;
    weekendMode?: boolean;
  }
) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      timezone: true,
      locale: true,
      role: true,
      isPremium: true,
      weekendMode: true,
    },
  });

  return user;
};

export const getDashboardStats = async (userId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get medication count
  const medicationCount = await prisma.medication.count({
    where: { userId, isActive: true },
  });

  // Get today's doses
  const todayDoses = await prisma.doseLog.count({
    where: {
      userId,
      scheduledTime: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  // Get adherence rate for last 7 days
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const weekLogs = await prisma.doseLog.groupBy({
    by: ['action'],
    where: {
      userId,
      scheduledTime: {
        gte: sevenDaysAgo,
        lt: today,
      },
    },
    _count: {
      action: true,
    },
  });

  let takenCount = 0;
  let totalCount = 0;

  weekLogs.forEach((log) => {
    totalCount += log._count.action;
    if (log.action === 'TAKEN') {
      takenCount = log._count.action;
    }
  });

  const adherenceRate = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100;

  // Get medications needing refill
  const medicationsNeedingRefill = await prisma.medication.count({
    where: {
      userId,
      isActive: true,
      quantityRemaining: {
        lte: prisma.medication.fields.refillThreshold,
      },
    },
  });

  return {
    medicationCount,
    todayDoses,
    adherenceRate,
    medicationsNeedingRefill,
  };
};
