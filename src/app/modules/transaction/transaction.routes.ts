import * as express from 'express';
import { TransactionController } from './transaction.controllers';
import auth from '../../middlewares/auth';
import authorize from '../../middlewares/authorized';

const router = express.Router();

// Stripe Webhook Endpoint (Unauthenticated - Verified by Stripe Signature)
router.post('/webhook', TransactionController.handleStripeWebhook);

// Authenticated User Routes
router.post('/create-payment-intent', auth, TransactionController.createPaymentIntent);
router.post('/create', auth, TransactionController.createTransaction);
router.get('/history', auth, TransactionController.getTransactionHistory);

// Admin / Authorized Routes
router.post('/refund', auth, authorize(['SUPER_ADMIN']), TransactionController.processRefund);

export const TransactionRoutes = router;
