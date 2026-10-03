import * as express from 'express';
import { TransactionController } from './transaction.controllers';

const router = express.Router();

router.post('/create-payment-intent', TransactionController.createPaymentIntent);
router.post('/webhook', TransactionController.handleStripeWebhook);
router.post('/create', TransactionController.createTransaction);
router.get('/history', TransactionController.getTransactionHistory);

export const TransactionRoutes = router;
