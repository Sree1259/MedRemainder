import { Router } from 'express';
import { asyncHandler } from '@common/errorHandler';
import { authenticate } from '@common/auth';
import { getPharmacies, getPharmacyById } from './pharmacy.service';

const router = Router();

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const pharmacies = await getPharmacies();
    res.json({
      success: true,
      data: pharmacies,
    });
  })
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const pharmacy = await getPharmacyById(req.params.id);
    res.json({
      success: true,
      data: pharmacy,
    });
  })
);

export default router;
