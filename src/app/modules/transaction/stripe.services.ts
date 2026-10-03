import Stripe from 'stripe';
import config from '../../config';
import { Transaction } from './transaction.model';
import { UserModel } from '../auth/auth.model';
import { Types } from 'mongoose';

const stripe = new Stripe(config.stripe.stripe_secret_key || '', {
    apiVersion: '2025-02-24.acacia' as any,
});

// Create Stripe PaymentIntent
const createPaymentIntent = async (payload: { amount: number; user: string; title?: string; listingId?: string }) => {
    const amountInCents = Math.round(payload.amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        metadata: {
            userId: payload.user,
            listingId: payload.listingId || '',
            title: payload.title || 'Payment',
        },
    });

    return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
    };
};

// Process Refund via Stripe
const processRefund = async (payload: { transactionId: string; amount?: number; reason?: string }) => {
    const transaction = await Transaction.findById(payload.transactionId);
    if (!transaction) {
        throw new Error('Transaction not found');
    }

    if (!transaction.stripePaymentIntentId) {
        throw new Error('No Stripe PaymentIntent ID associated with this transaction');
    }

    if (transaction.status === 'REFUNDED') {
        throw new Error('Transaction has already been refunded');
    }

    const refundAmountInCents = payload.amount ? Math.round(payload.amount * 100) : undefined;

    const refund = await stripe.refunds.create({
        payment_intent: transaction.stripePaymentIntentId,
        amount: refundAmountInCents,
        reason: (payload.reason as any) || 'requested_by_customer',
    });

    const refundAmount = refund.amount / 100;
    const previousStatus = transaction.status;

    transaction.status = 'REFUNDED';
    transaction.stripeRefundId = refund.id;
    if (payload.reason) {
        transaction.remarks = payload.reason;
    }
    await transaction.save();

    // Deduct refunded amount from receiver's (host's) balance if previously paid
    if (previousStatus === 'PAID' && transaction.receiver) {
        await UserModel.findByIdAndUpdate(transaction.receiver, {
            $inc: { balance: -refundAmount },
        });
    }

    // Create a corresponding Refund transaction record
    const refundTransaction = await Transaction.create({
        payer: transaction.receiver || transaction.payer, // Receiver pays back
        receiver: transaction.payer,                      // Customer gets money back
        user: transaction.payer,
        listing: transaction.listing,
        title: `Refund for ${transaction.title}`,
        type: 'REFUND',
        amount: refundAmount,
        currency: transaction.currency,
        status: 'REFUNDED',
        stripePaymentIntentId: transaction.stripePaymentIntentId,
        stripeRefundId: refund.id,
        remarks: payload.reason,
    });

    return {
        refund,
        transaction: refundTransaction,
    };
};

export const StripeService = {
    createPaymentIntent,
    processRefund,
};
