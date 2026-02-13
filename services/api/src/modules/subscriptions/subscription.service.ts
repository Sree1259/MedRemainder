import { prisma } from '@common/prisma';
import { AppError } from '@common/errorHandler';

export const getPlans = async () => {
  return prisma.plan.findMany({
    orderBy: { priceCents: 'asc' },
  });
};

export const getCurrentSubscription = async (userId: string) => {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
    },
    include: {
      plan: true,
    },
  });

  return subscription;
};

export const getUserSubscriptionStatus = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        include: { plan: true },
        orderBy: { currentPeriodEnd: 'desc' },
        take: 1,
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const subscription = user.subscriptions[0];
  const plan = subscription?.plan;
  
  let features: any = {};
  if (plan?.features) {
    try {
      features = typeof plan.features === 'string' 
        ? JSON.parse(plan.features) 
        : plan.features;
    } catch {
      features = {};
    }
  }

  return {
    isPremium: user.isPremium || !!subscription,
    subscription: subscription || null,
    features,
  };
};
