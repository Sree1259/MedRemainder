import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '@config/index';
import { prisma } from '@common/prisma';
import { logger } from '@common/logger';
import { sendPushNotification } from './firebase';

// Redis connection
const redisConnection = new IORedis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Reminder queue
export const reminderQueue = new Queue('reminders', {
  connection: redisConnection,
});

// Initialize reminder worker
export const initializeReminderWorker = () => {
  const worker = new Worker(
    'reminders',
    async (job: Job) => {
      const { reminderId, userId, medicationName, dosage, scheduleTime } = job.data;

      try {
        // Get user's device tokens
        const deviceTokens = await prisma.deviceToken.findMany({
          where: {
            userId,
            isActive: true,
          },
        });

        if (deviceTokens.length === 0) {
          logger.warn(`No device tokens found for user ${userId}`);
          return;
        }

        // Send push notifications
        const notificationPromises = deviceTokens.map((token) =>
          sendPushNotification(token.token, {
            title: 'Medication Reminder',
            body: `Time to take ${medicationName} (${dosage})`,
            data: {
              reminderId,
              medicationName,
              dosage,
              scheduleTime,
              type: 'medication_reminder',
            },
          })
        );

        await Promise.all(notificationPromises);

        // Update reminder status
        await prisma.reminder.update({
          where: { id: reminderId },
          data: {
            status: 'SENT',
            attempts: { increment: 1 },
          },
        });

        logger.info(`Reminder sent for user ${userId}, medication ${medicationName}`);
      } catch (error) {
        logger.error(`Failed to process reminder ${reminderId}:`, error);
        
        // Update reminder as failed
        await prisma.reminder.update({
          where: { id: reminderId },
          data: {
            status: 'FAILED',
            attempts: { increment: 1 },
          },
        });
        
        throw error;
      }
    },
    { connection: redisConnection }
  );

  worker.on('completed', (job) => {
    logger.info(`Reminder job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    logger.error(`Reminder job ${job?.id} failed:`, error);
  });

  return worker;
};

// Schedule a reminder
export const scheduleReminder = async (
  userId: string,
  scheduleId: string,
  fireAt: Date,
  medicationInfo: {
    name: string;
    dosage: string;
  }
) => {
  // Create reminder record
  const reminder = await prisma.reminder.create({
    data: {
      scheduleId,
      userId,
      fireAt,
      status: 'PENDING',
    },
  });

  // Add to BullMQ queue
  const delay = fireAt.getTime() - Date.now();
  
  if (delay > 0) {
    await reminderQueue.add(
      'send-reminder',
      {
        reminderId: reminder.id,
        userId,
        medicationName: medicationInfo.name,
        dosage: medicationInfo.dosage,
        scheduleTime: fireAt.toISOString(),
      },
      {
        delay,
        jobId: reminder.id,
        removeOnComplete: true,
        removeOnFail: 3,
      }
    );
  }

  return reminder;
};

// Generate reminders for a medication schedule
export const generateRemindersForSchedule = async (
  scheduleId: string,
  daysAhead: number = 7
) => {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      medication: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!schedule || !schedule.medication.isActive) {
    return;
  }

  const { medication } = schedule;
  const { user } = medication;

  // Generate reminders for the next N days
  const reminders = [];
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + daysAhead);

  // Parse time slots
  const timeSlots = schedule.timeSlots as string[];
  
  for (let day = 0; day < daysAhead; day++) {
    const currentDate = new Date(now);
    currentDate.setDate(currentDate.getDate() + day);
    const dayOfWeek = currentDate.getDay();

    // Check if medication should be taken on this day
    let shouldSchedule = false;

    switch (schedule.scheduleType) {
      case 'DAILY':
        shouldSchedule = true;
        break;
      case 'SPECIFIC_DAYS':
        shouldSchedule = schedule.daysOfWeek?.includes(dayOfWeek) || false;
        break;
      case 'INTERVAL':
        // Simplified interval logic - in production, track last dose date
        shouldSchedule = true;
        break;
      case 'CYCLE':
        // Simplified cycle logic
        shouldSchedule = true;
        break;
    }

    if (shouldSchedule) {
      for (const timeSlot of timeSlots) {
        const [hours, minutes] = timeSlot.split(':').map(Number);
        const reminderTime = new Date(currentDate);
        reminderTime.setHours(hours, minutes, 0, 0);

        // Only schedule future reminders
        if (reminderTime > now) {
          // Check if reminder already exists
          const existingReminder = await prisma.reminder.findFirst({
            where: {
              scheduleId,
              fireAt: reminderTime,
            },
          });

          if (!existingReminder) {
            const reminder = await scheduleReminder(
              medication.userId,
              scheduleId,
              reminderTime,
              {
                name: medication.name,
                dosage: medication.dosage,
              }
            );
            reminders.push(reminder);
          }
        }
      }
    }
  }

  return reminders;
};

// Cancel future reminders for a schedule
export const cancelFutureReminders = async (scheduleId: string) => {
  const reminders = await prisma.reminder.findMany({
    where: {
      scheduleId,
      status: 'PENDING',
      fireAt: {
        gt: new Date(),
      },
    },
  });

  for (const reminder of reminders) {
    // Remove from queue
    const job = await reminderQueue.getJob(reminder.id);
    if (job) {
      await job.remove();
    }

    // Update status
    await prisma.reminder.update({
      where: { id: reminder.id },
      data: { status: 'FAILED' },
    });
  }

  return reminders.length;
};
