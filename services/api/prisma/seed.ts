import { PrismaClient, PlanInterval, MedicationForm, ScheduleType, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create subscription plans
  console.log('Creating subscription plans...');
  const freePlan = await prisma.plan.upsert({
    where: { name: 'free' },
    update: {},
    create: {
      name: 'free',
      priceCents: 0,
      interval: PlanInterval.MONTH,
      features: JSON.stringify({
        maxMedications: 10,
        maxFamilyProfiles: 1,
        maxHealthMetrics: 3,
        maxMedfriends: 1,
        drugInteractions: true,
        refillReminders: true,
        basicReports: true,
        exportReports: false,
        aiFeatures: false,
        pharmacyDelivery: false,
        ads: true,
      }),
    },
  });

  const premiumMonthly = await prisma.plan.upsert({
    where: { name: 'premium_monthly' },
    update: {},
    create: {
      name: 'premium_monthly',
      priceCents: 999, // $9.99
      interval: PlanInterval.MONTH,
      features: JSON.stringify({
        maxMedications: -1, // unlimited
        maxFamilyProfiles: -1,
        maxHealthMetrics: -1,
        maxMedfriends: -1,
        drugInteractions: true,
        refillReminders: true,
        basicReports: true,
        exportReports: true,
        aiFeatures: true,
        pharmacyDelivery: true,
        ads: false,
      }),
    },
  });

  const premiumYearly = await prisma.plan.upsert({
    where: { name: 'premium_yearly' },
    update: {},
    create: {
      name: 'premium_yearly',
      priceCents: 7999, // $79.99
      interval: PlanInterval.YEAR,
      features: JSON.stringify({
        maxMedications: -1,
        maxFamilyProfiles: -1,
        maxHealthMetrics: -1,
        maxMedfriends: -1,
        drugInteractions: true,
        refillReminders: true,
        basicReports: true,
        exportReports: true,
        aiFeatures: true,
        pharmacyDelivery: true,
        ads: false,
      }),
    },
  });

  console.log('✅ Plans created');

  // Create sample pharmacies
  console.log('Creating sample pharmacies...');
  const pharmacy1 = await prisma.pharmacy.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'CVS Pharmacy',
      address: '123 Main St, Boston, MA 02101',
      phone: '(617) 555-0101',
      supportsDelivery: true,
    },
  });

  const pharmacy2 = await prisma.pharmacy.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Walgreens',
      address: '456 Oak Ave, Boston, MA 02102',
      phone: '(617) 555-0102',
      supportsDelivery: true,
    },
  });

  console.log('✅ Pharmacies created');

  // Create demo user
  console.log('Creating demo user...');
  const hashedPassword = await bcrypt.hash('demo123', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@medreminder.com' },
    update: {},
    create: {
      email: 'demo@medreminder.com',
      passwordHash: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      timezone: 'America/New_York',
      isPremium: false,
      role: UserRole.PATIENT,
    },
  });

  // Create sample medications for demo user
  console.log('Creating sample medications...');
  const med1 = await prisma.medication.create({
    data: {
      userId: demoUser.id,
      name: 'Lisinopril',
      genericName: 'Lisinopril',
      dosage: '10mg',
      form: MedicationForm.PILL,
      shape: 'round',
      color: 'pink',
      instructions: 'Take with food',
      quantityTotal: 30,
      quantityRemaining: 15,
      refillThreshold: 5,
      isAsNeeded: false,
      pharmacyId: pharmacy1.id,
      isActive: true,
      startDate: new Date('2024-01-01'),
      schedules: {
        create: {
          scheduleType: ScheduleType.DAILY,
          timesPerDay: 1,
          timeSlots: ['08:00'],
          daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Every day
        },
      },
    },
  });

  const med2 = await prisma.medication.create({
    data: {
      userId: demoUser.id,
      name: 'Metformin',
      genericName: 'Metformin HCl',
      dosage: '500mg',
      form: MedicationForm.PILL,
      shape: 'oval',
      color: 'white',
      instructions: 'Take with meals',
      quantityTotal: 60,
      quantityRemaining: 42,
      refillThreshold: 10,
      isAsNeeded: false,
      pharmacyId: pharmacy2.id,
      isActive: true,
      startDate: new Date('2024-01-01'),
      schedules: {
        create: {
          scheduleType: ScheduleType.DAILY,
          timesPerDay: 2,
          timeSlots: ['08:00', '20:00'],
          daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
        },
      },
    },
  });

  const med3 = await prisma.medication.create({
    data: {
      userId: demoUser.id,
      name: 'Ibuprofen',
      genericName: 'Ibuprofen',
      dosage: '200mg',
      form: MedicationForm.PILL,
      shape: 'round',
      color: 'brown',
      instructions: 'Take as needed for pain',
      quantityTotal: 100,
      quantityRemaining: 87,
      refillThreshold: 20,
      isAsNeeded: true,
      isActive: true,
      startDate: new Date('2024-01-01'),
    },
  });

  console.log('✅ Sample medications created');

  // Create sample drug interactions
  console.log('Creating sample drug interactions...');
  await prisma.drugInteraction.createMany({
    skipDuplicates: true,
    data: [
      {
        drugARxcui: '6918', // Lisinopril
        drugBRxcui: '5640', // Ibuprofen
        severity: 'MODERATE',
        description: 'Ibuprofen may reduce the antihypertensive effect of Lisinopril.',
        recommendation: 'Monitor blood pressure closely. Consider alternative pain relievers.',
        source: 'DrugBank',
      },
      {
        drugARxcui: '6918', // Lisinopril
        drugBRxcui: '6809', // Metformin
        severity: 'MINOR',
        description: 'No significant interaction expected.',
        recommendation: 'Monitor as usual.',
        source: 'FDA',
      },
      {
        drugARxcui: '6809', // Metformin
        drugBRxcui: '5640', // Ibuprofen
        severity: 'MINOR',
        description: 'No significant interaction expected.',
        recommendation: 'Monitor as usual.',
        source: 'DrugBank',
      },
    ],
  });

  console.log('✅ Sample drug interactions created');

  // Create sample health measurements
  console.log('Creating sample health measurements...');
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    await prisma.healthMeasurement.create({
      data: {
        userId: demoUser.id,
        metricType: 'blood_pressure',
        value: 120 + Math.floor(Math.random() * 10 - 5),
        valueSecondary: 80 + Math.floor(Math.random() * 10 - 5),
        unit: 'mmHg',
        measuredAt: date,
        source: 'manual',
      },
    });

    await prisma.healthMeasurement.create({
      data: {
        userId: demoUser.id,
        metricType: 'weight',
        value: 175 + Math.floor(Math.random() * 4 - 2),
        unit: 'lbs',
        measuredAt: date,
        source: 'manual',
      },
    });
  }

  console.log('✅ Sample health measurements created');

  console.log('\n🎉 Database seed completed successfully!');
  console.log('\nDemo credentials:');
  console.log('Email: demo@medreminder.com');
  console.log('Password: demo123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
