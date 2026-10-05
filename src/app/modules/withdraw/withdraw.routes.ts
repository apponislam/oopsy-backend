import express from 'express';
import { WithdrawController } from './withdraw.controllers';
import auth from '../../middlewares/auth';
import authorize from '../../middlewares/authorized';

const router = express.Router();

// User Payout / Connect Routes
router.post('/connect-account', auth, WithdrawController.createConnectAccount);
router.post('/connect-onboarding', auth, WithdrawController.createAccountLink);
router.post('/payout-request', auth, WithdrawController.requestPayout);

// Admin Payout Approval / Rejection Routes
router.patch('/payout/:id/accept', auth, authorize(['SUPER_ADMIN']), WithdrawController.acceptPayout);
router.patch('/payout/:id/reject', auth, authorize(['SUPER_ADMIN']), WithdrawController.rejectPayout);

// Stripe Redirect Routes (Onboarding Callbacks)
router.get('/stripe/return', WithdrawController.handleStripeReturn);
router.get('/stripe/reauth', WithdrawController.handleStripeReauth);

export const withdrawRoutes = router;
