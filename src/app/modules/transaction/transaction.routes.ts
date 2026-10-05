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

// Authenticated User Routes
router.post('/create-payment-intent', auth, TransactionController.createPaymentIntent);
router.post('/create', auth, TransactionController.createTransaction);
router.get('/history', auth, TransactionController.getTransactionHistory);
router.get('/:id', auth, TransactionController.getSingleTransaction);

export const TransactionRoutes = router;
