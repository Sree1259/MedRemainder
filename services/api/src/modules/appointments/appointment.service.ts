import { prisma } from '@common/prisma';
import { AppError } from '@common/errorHandler';

export const createAppointment = async (
  userId: string,
  data: {
    title: string;
    doctorName?: string;
    location?: string;
    appointmentAt: Date;
    reminderMinutesBefore?: number;
    notes?: string;
  }
) => {
  const appointment = await prisma.appointment.create({
    data: {
      userId,
      title: data.title,
      doctorName: data.doctorName,
      location: data.location,
      appointmentAt: data.appointmentAt,
      reminderMinutesBefore: data.reminderMinutesBefore || 60,
      notes: data.notes,
    },
  });

  return appointment;
};

export const getAppointments = async (
  userId: string,
  options: {
    startDate?: Date;
    endDate?: Date;
  } = {}
) => {
  const where: any = { userId };

  if (options.startDate || options.endDate) {
    where.appointmentAt = {};
    if (options.startDate) {
      where.appointmentAt.gte = options.startDate;
    }
    if (options.endDate) {
      where.appointmentAt.lte = options.endDate;
    }
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { appointmentAt: 'asc' },
  });

  return appointments;
};

export const updateAppointment = async (
  userId: string,
  appointmentId: string,
  data: Partial<{
    title: string;
    doctorName: string;
    location: string;
    appointmentAt: Date;
    reminderMinutesBefore: number;
    notes: string;
  }>
) => {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId },
  });

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data,
  });

  return updated;
};

export const deleteAppointment = async (userId: string, appointmentId: string) => {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId },
  });

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  await prisma.appointment.delete({
    where: { id: appointmentId },
  });

  return { message: 'Appointment deleted successfully' };
};
