import { prisma, ScheduleType } from '@common/prisma';
import { AppError } from '@common/errorHandler';

export const createSchedule = async (
  userId: string,
  medicationId: string,
  data: {
    scheduleType: ScheduleType;
    timesPerDay: number;
    timeSlots: string[];
    daysOfWeek?: number[];
    intervalDays?: number;
    cycleDaysOn?: number;
    cycleDaysOff?: number;
  }
) => {
  // Verify medication belongs to user
  const medication = await prisma.medication.findFirst({
    where: { id: medicationId, userId },
  });

  if (!medication) {
    throw new AppError('Medication not found', 404);
  }

  const schedule = await prisma.schedule.create({
    data: {
      medicationId,
      scheduleType: data.scheduleType,
      timesPerDay: data.timesPerDay,
      timeSlots: data.timeSlots,
      daysOfWeek: data.daysOfWeek || [],
      intervalDays: data.intervalDays,
      cycleDaysOn: data.cycleDaysOn,
      cycleDaysOff: data.cycleDaysOff,
    },
  });

  return schedule;
};

export const getSchedules = async (userId: string, medicationId: string) => {
  const medication = await prisma.medication.findFirst({
    where: { id: medicationId, userId },
  });

  if (!medication) {
    throw new AppError('Medication not found', 404);
  }

  const schedules = await prisma.schedule.findMany({
    where: { medicationId },
    orderBy: { createdAt: 'desc' },
  });

  return schedules;
};

export const updateSchedule = async (
  userId: string,
  scheduleId: string,
  data: Partial<{
    scheduleType: ScheduleType;
    timesPerDay: number;
    timeSlots: string[];
    daysOfWeek: number[];
    intervalDays: number;
    cycleDaysOn: number;
    cycleDaysOff: number;
  }>
) => {
  const schedule = await prisma.schedule.findFirst({
    where: {
      id: scheduleId,
      medication: { userId },
    },
  });

  if (!schedule) {
    throw new AppError('Schedule not found', 404);
  }

  const updated = await prisma.schedule.update({
    where: { id: scheduleId },
    data,
  });

  return updated;
};

export const deleteSchedule = async (userId: string, scheduleId: string) => {
  const schedule = await prisma.schedule.findFirst({
    where: {
      id: scheduleId,
      medication: { userId },
    },
  });

  if (!schedule) {
    throw new AppError('Schedule not found', 404);
  }

  await prisma.schedule.delete({
    where: { id: scheduleId },
  });

  return { message: 'Schedule deleted successfully' };
};
