import { Router } from 'express';
import { asyncHandler } from '@common/errorHandler';
import { authenticate, AuthRequest } from '@common/auth';
import { getPlans, getCurrentSubscription, getUserSubscriptionStatus } from './subscription.service';

const router = Router();

router.get(
  '/plans',
  authenticate,
  asyncHandler(async (req, res) => {
    const plans = await getPlans();
    res.json({
      success: true,
      data: plans,
    });
  })
);

router.get(
  '/current',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const subscription = await getCurrentSubscription(req.user!.id);
    res.json({
      success: true,
      data: subscription,
    });
  })
);

router.get(
  '/status',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const status = await getUserSubscriptionStatus(req.user!.id);
    res.json({
      success: true,
      data: status,
    });
  })
);

export default router;
