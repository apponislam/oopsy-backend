import * as express from 'express';
import { TransactionController } from './transaction.controllers';
import auth from '../../middlewares/auth';
import authorize from '../../middlewares/authorized';

const router = express.Router();

// Stripe Webhook Endpoint (Unauthenticated - Verified by Stripe Signature)
router.post('/webhook', TransactionController.handleStripeWebhook);

// Admin / Authorized Routes (SUPER_ADMIN)
router.get('/admin', auth, authorize(['SUPER_ADMIN']), TransactionController.getAllTransactionsForAdmin);
router.get('/admin/:id', auth, authorize(['SUPER_ADMIN']), TransactionController.getSingleTransactionForAdmin);
router.post('/refund', auth, authorize(['SUPER_ADMIN']), TransactionController.processRefund);
router.patch('/payout/:id/accept', auth, authorize(['SUPER_ADMIN']), TransactionController.acceptPayout);
router.patch('/payout/:id/reject', auth, authorize(['SUPER_ADMIN']), TransactionController.rejectPayout);

// Authenticated User Routes
router.post('/create-payment-intent', auth, TransactionController.createPaymentIntent);
router.post('/connect-account', auth, TransactionController.createConnectAccount);
router.post('/connect-onboarding', auth, TransactionController.createAccountLink);
router.post('/create', auth, TransactionController.createTransaction);
router.post('/payout-request', auth, TransactionController.requestPayout);
router.get('/history', auth, TransactionController.getTransactionHistory);
// Stripe Redirect Routes (Onboarding Callbacks)
router.get('/stripe/return', TransactionController.handleStripeReturn);
router.get('/stripe/reauth', TransactionController.handleStripeReauth);
router.get('/:id', auth, TransactionController.getSingleTransaction);

export const TransactionRoutes = router;
