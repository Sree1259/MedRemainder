import { v4 as uuidv4 } from 'uuid';

export const generateUUID = (): string => uuidv4();

export const generateInviteToken = (): string => {
  return uuidv4().replace(/-/g, '').substring(0, 32);
};

export const formatDate = (date: Date): string => {
  return date.toISOString();
};

export const parseTime = (timeStr: string): { hours: number; minutes: number } => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
};

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

export const calculateNextDose = (
  schedule: {
    scheduleType: string;
    timeSlots: string[];
    daysOfWeek?: number[];
    intervalDays?: number;
    cycleDaysOn?: number;
    cycleDaysOff?: number;
  },
  lastDoseDate?: Date
): Date | null => {
  const now = new Date();
  
  switch (schedule.scheduleType) {
    case 'DAILY':
      return calculateDailyNextDose(schedule.timeSlots, now);
    case 'SPECIFIC_DAYS':
      return calculateSpecificDaysNextDose(schedule.timeSlots, schedule.daysOfWeek || [], now);
    case 'INTERVAL':
      return calculateIntervalNextDose(schedule.timeSlots, schedule.intervalDays || 1, lastDoseDate, now);
    case 'CYCLE':
      return calculateCycleNextDose(schedule.timeSlots, schedule.cycleDaysOn || 1, schedule.cycleDaysOff || 1, lastDoseDate, now);
    default:
      return null;
  }
};

const calculateDailyNextDose = (timeSlots: string[], now: Date): Date => {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  for (const slot of timeSlots) {
    const { hours, minutes } = parseTime(slot);
    const doseTime = new Date(today);
    doseTime.setHours(hours, minutes, 0, 0);
    
    if (doseTime > now) {
      return doseTime;
    }
  }
  
  // All doses for today passed, return first dose tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const { hours, minutes } = parseTime(timeSlots[0]);
  tomorrow.setHours(hours, minutes, 0, 0);
  return tomorrow;
};

const calculateSpecificDaysNextDose = (
  timeSlots: string[],
  daysOfWeek: number[],
  now: Date
): Date | null => {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  // Sort days of week
  const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
  
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() + i);
    const dayOfWeek = checkDate.getDay();
    
    if (sortedDays.includes(dayOfWeek)) {
      for (const slot of timeSlots) {
        const { hours, minutes } = parseTime(slot);
        const doseTime = new Date(checkDate);
        doseTime.setHours(hours, minutes, 0, 0);
        
        if (doseTime > now) {
          return doseTime;
        }
      }
    }
  }
  
  return null;
};

const calculateIntervalNextDose = (
  timeSlots: string[],
  intervalDays: number,
  lastDoseDate: Date | undefined,
  now: Date
): Date | null => {
  if (!lastDoseDate) {
    return calculateDailyNextDose(timeSlots, now);
  }
  
  const nextDose = new Date(lastDoseDate);
  nextDose.setDate(nextDose.getDate() + intervalDays);
  
  const { hours, minutes } = parseTime(timeSlots[0]);
  nextDose.setHours(hours, minutes, 0, 0);
  
  return nextDose;
};

const calculateCycleNextDose = (
  timeSlots: string[],
  daysOn: number,
  daysOff: number,
  lastDoseDate: Date | undefined,
  now: Date
): Date | null => {
  // Simplified cycle calculation - in production, track cycle position
  return calculateDailyNextDose(timeSlots, now);
};
