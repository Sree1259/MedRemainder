import { prisma } from '@common/prisma';

export const checkInteractions = async (
  userId: string,
  medicationId?: string
) => {
  // Get user's active medications
  const where: any = {
    userId,
    isActive: true,
  };

  if (medicationId) {
    where.id = medicationId;
  }

  const medications = await prisma.medication.findMany({
    where,
    select: {
      id: true,
      name: true,
      genericName: true,
    },
  });

  if (medications.length < 2) {
    return {
      medications,
      interactions: [],
    };
  }

  // This is a simplified interaction check
  // In production, you would query a real drug interaction database
  // using RxNorm concept IDs (rxcui)
  
  // For demo purposes, check some common interactions
  const interactions: any[] = [];
  
  const medNames = medications.map((m) => ({
    id: m.id,
    name: m.name.toLowerCase(),
    genericName: m.genericName?.toLowerCase() || '',
  }));

  // Check for known interactions
  for (let i = 0; i < medNames.length; i++) {
    for (let j = i + 1; j < medNames.length; j++) {
      const med1 = medNames[i];
      const med2 = medNames[j];

      // Example: Lisinopril + Ibuprofen interaction
      if (
        (med1.name.includes('lisinopril') || med1.genericName.includes('lisinopril')) &&
        (med2.name.includes('ibuprofen') || med2.genericName.includes('ibuprofen'))
      ) {
        interactions.push({
          medications: [medications[i], medications[j]],
          severity: 'MODERATE',
          description: 'Ibuprofen may reduce the antihypertensive effect of Lisinopril.',
          recommendation: 'Monitor blood pressure closely. Consider alternative pain relievers.',
        });
      }

      // Example: Metformin + alcohol warning
      if (
        (med1.name.includes('metformin') || med1.genericName.includes('metformin')) &&
        (med2.name.includes('alcohol') || med2.genericName.includes('alcohol'))
      ) {
        interactions.push({
          medications: [medications[i], medications[j]],
          severity: 'MINOR',
          description: 'Alcohol may increase the risk of lactic acidosis with Metformin.',
          recommendation: 'Limit alcohol consumption while taking Metformin.',
        });
      }
    }
  }

  return {
    medications,
    interactions,
  };
};

export const getAllInteractions = async () => {
  return prisma.drugInteraction.findMany({
    orderBy: { severity: 'desc' },
  });
};
