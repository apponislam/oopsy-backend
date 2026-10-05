import express from 'express';
import { WithdrawController } from './withdraw.controllers';
import auth from '../../middlewares/auth';
import authorize from '../../middlewares/authorized';

const router = express.Router();

// Admin Routes (SUPER_ADMIN)
router.get('/admin', auth, authorize(['SUPER_ADMIN']), WithdrawController.getAllWithdrawalsForAdmin);
router.patch('/:id/accept', auth, authorize(['SUPER_ADMIN']), WithdrawController.acceptPayout);
router.patch('/:id/reject', auth, authorize(['SUPER_ADMIN']), WithdrawController.rejectPayout);

// User Payout / Connect Routes
router.post('/connect-account', auth, WithdrawController.createConnectAccount);
router.post('/connect-onboarding', auth, WithdrawController.createAccountLink);
router.post('/request', auth, WithdrawController.requestPayout);
router.get('/history', auth, WithdrawController.getUserWithdrawals);
router.get('/:id', auth, WithdrawController.getSingleWithdrawal);

// Stripe Redirect Routes (Onboarding Callbacks)
router.get('/stripe/return', WithdrawController.handleStripeReturn);
router.get('/stripe/reauth', WithdrawController.handleStripeReauth);

export const withdrawRoutes = router;
