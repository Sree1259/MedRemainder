import { prisma } from '@common/prisma';
import { AppError } from '@common/errorHandler';

export const addMeasurement = async (
  userId: string,
  data: {
    metricType: string;
    value: number;
    valueSecondary?: number;
    unit: string;
    measuredAt: Date;
    notes?: string;
    source?: string;
  }
) => {
  // Check metric limit for free users
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isPremium = user.isPremium || user.subscriptions.length > 0;

  if (!isPremium) {
    const uniqueMetricTypes = await prisma.healthMeasurement.groupBy({
      by: ['metricType'],
      where: { userId },
    });

    const currentMetricExists = uniqueMetricTypes.some(
      (m) => m.metricType === data.metricType
    );

    if (!currentMetricExists && uniqueMetricTypes.length >= 3) {
      throw new AppError(
        'Free users can track up to 3 health metrics. Upgrade to premium for unlimited tracking.',
        403
      );
    }
  }

  const measurement = await prisma.healthMeasurement.create({
    data: {
      userId,
      metricType: data.metricType,
      value: data.value,
      valueSecondary: data.valueSecondary,
      unit: data.unit,
      measuredAt: data.measuredAt,
      notes: data.notes,
      source: data.source || 'manual',
    },
  });

  return measurement;
};

export const getMeasurements = async (
  userId: string,
  options: {
    metricType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}
) => {
  const where: any = { userId };

  if (options.metricType) {
    where.metricType = options.metricType;
  }

  if (options.startDate || options.endDate) {
    where.measuredAt = {};
    if (options.startDate) {
      where.measuredAt.gte = options.startDate;
    }
    if (options.endDate) {
      where.measuredAt.lte = options.endDate;
    }
  }

  const measurements = await prisma.healthMeasurement.findMany({
    where,
    orderBy: { measuredAt: 'desc' },
    take: options.limit || 100,
  });

  return measurements;
};

export const getMeasurementStats = async (
  userId: string,
  metricType: string,
  days: number = 30
) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const measurements = await prisma.healthMeasurement.findMany({
    where: {
      userId,
      metricType,
      measuredAt: {
        gte: startDate,
      },
    },
    orderBy: { measuredAt: 'asc' },
  });

  if (measurements.length === 0) {
    return {
      count: 0,
      avg: null,
      min: null,
      max: null,
      latest: null,
    };
  }

  const values = measurements.map((m) => Number(m.value));
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  return {
    count: measurements.length,
    avg: Math.round(avg * 100) / 100,
    min: Math.min(...values),
    max: Math.max(...values),
    latest: measurements[measurements.length - 1],
  };
};

export const deleteMeasurement = async (userId: string, measurementId: string) => {
  const measurement = await prisma.healthMeasurement.findFirst({
    where: { id: measurementId, userId },
  });

  if (!measurement) {
    throw new AppError('Measurement not found', 404);
  }

  await prisma.healthMeasurement.delete({
    where: { id: measurementId },
  });

  return { message: 'Measurement deleted successfully' };
};
