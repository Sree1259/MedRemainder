import { Router } from 'express';
import { asyncHandler } from '@common/errorHandler';
import { authenticate, AuthRequest } from '@common/auth';
import { checkInteractions, getAllInteractions } from './interaction.service';

const router = Router();

router.get(
  '/check',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const result = await checkInteractions(
      req.user!.id,
      req.query.medicationId as string | undefined
    );
    res.json({
      success: true,
      data: result,
    });
  })
);

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const interactions = await getAllInteractions();
    res.json({
      success: true,
      data: interactions,
    });
  })
);

export default router;
