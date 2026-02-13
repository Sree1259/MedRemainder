import { prisma } from '@common/prisma';
import { AppError } from '@common/errorHandler';

export const getPharmacies = async () => {
  return prisma.pharmacy.findMany({
    orderBy: { name: 'asc' },
  });
};

export const getPharmacyById = async (id: string) => {
  const pharmacy = await prisma.pharmacy.findUnique({
    where: { id },
  });

  if (!pharmacy) {
    throw new AppError('Pharmacy not found', 404);
  }

  return pharmacy;
};
