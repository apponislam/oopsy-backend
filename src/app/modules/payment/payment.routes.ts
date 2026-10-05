import * as express from 'express';
import { PaymentController } from './payment.controllers';
import auth from '../../middlewares/auth';
import authorize from '../../middlewares/authorized';

const router = express.Router();

// Stripe Webhook Endpoint (Unauthenticated - Verified by Stripe Signature)
router.post('/webhook', PaymentController.handleStripeWebhook);

// Admin / Authorized Routes (SUPER_ADMIN)
router.get('/admin', auth, authorize(['SUPER_ADMIN']), PaymentController.getAllPaymentsForAdmin);
router.get('/admin/:id', auth, authorize(['SUPER_ADMIN']), PaymentController.getSinglePaymentForAdmin);
router.post('/refund', auth, authorize(['SUPER_ADMIN']), PaymentController.processRefund);

// Authenticated User Routes
router.post('/create-payment-intent', auth, PaymentController.createPaymentIntent);
router.post('/create', auth, PaymentController.createPayment);
router.get('/history', auth, PaymentController.getPaymentHistory);
router.get('/:id', auth, PaymentController.getSinglePayment);

export const paymentRoutes = router;
