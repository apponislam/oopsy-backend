import express from 'express';
import { WithdrawController } from './withdraw.controllers';
import auth from '../../middlewares/auth';

const router = express.Router();

router.post('/connect-account', auth, WithdrawController.createConnectAccount);
router.post('/connect-onboarding', auth, WithdrawController.createAccountLink);

// Stripe Redirect Routes (Onboarding Callbacks)
router.get('/stripe/return', WithdrawController.handleStripeReturn);
router.get('/stripe/reauth', WithdrawController.handleStripeReauth);

export const withdrawRoutes = router;
