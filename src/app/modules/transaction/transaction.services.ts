import { Transaction } from './transaction.model';
import { ITransaction, ITransactionFilterOptions } from './transaction.interface';
import { Types } from 'mongoose';
import Stripe from 'stripe';
import config from '../../config';

const stripe = new Stripe(config.stripe.stripe_secret_key || '', {
    apiVersion: '2025-02-24.acacia' as any,
});

// Create a Stripe PaymentIntent for frontend payment flow
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

// Create a new Stripe transaction manually
const createTransaction = async (payload: Partial<ITransaction>): Promise<ITransaction> => {
    const newTransaction = await Transaction.create({
        ...payload,
        paymentMethod: 'Stripe',
    });

    return newTransaction;
};

// Handle Stripe Webhook Events securely
const handleStripeWebhook = async (signature: string, rawBody: Buffer) => {
    const webhookSecret = config.stripe.stripe_webhook_secret;
    if (!webhookSecret) {
        throw new Error('Stripe webhook secret is not configured.');
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
        throw new Error(`Webhook Signature Verification Failed: ${err.message}`);
    }

    switch (event.type) {
        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const { userId, listingId, title } = paymentIntent.metadata || {};

            if (userId) {
                const existingTx = await Transaction.findOne({ stripePaymentIntentId: paymentIntent.id });

                if (!existingTx) {
                    await Transaction.create({
                        user: new Types.ObjectId(userId),
                        listing: listingId ? new Types.ObjectId(listingId) : undefined,
                        title: title || 'Stripe Payment',
                        category: 'Credit',
                        type: 'Booking',
                        amount: paymentIntent.amount / 100,
                        status: 'Paid',
                        paymentMethod: 'Stripe',
                        stripePaymentIntentId: paymentIntent.id,
                    });
                } else {
                    existingTx.status = 'Paid';
                    await existingTx.save();
                }
            }
            break;
        }

        case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const existingTx = await Transaction.findOne({ stripePaymentIntentId: paymentIntent.id });
            if (existingTx) {
                existingTx.status = 'Failed';
                await existingTx.save();
            }
            break;
        }

        default:
            console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return { received: true };
};

// Get transaction history with filters (All, Bookings, Payouts, Refunds), search & pagination
const getTransactionHistory = async (userId: string, filters: ITransactionFilterOptions) => {
    const { searchTerm, type, page = 1, limit = 10 } = filters;
    const query: any = { user: new Types.ObjectId(userId) };

    if (type && type !== 'All') {
        if (type === 'Bookings') query.type = 'Booking';
        else if (type === 'Payouts') query.type = 'Payout';
        else if (type === 'Refunds') query.type = 'Refund';
    }

    if (searchTerm) {
        query.$or = [
            { title: { $regex: searchTerm, $options: 'i' } },
            { transactionId: { $regex: searchTerm, $options: 'i' } },
        ];
    }

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('listing', 'title price images');

    const total = await Transaction.countDocuments(query);

    // Calculate aggregated transaction metrics (Credits, Debits, Net) directly from transactions
    const metricsAggregate = await Transaction.aggregate([
        { $match: { user: new Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                totalCredits: {
                    $sum: {
                        $cond: [{ $eq: ['$category', 'Credit'] }, '$amount', 0],
                    },
                },
                totalDebits: {
                    $sum: {
                        $cond: [{ $eq: ['$category', 'Debit'] }, '$amount', 0],
                    },
                },
            },
        },
    ]);

    const credits = metricsAggregate[0]?.totalCredits || 0;
    const debits = metricsAggregate[0]?.totalDebits || 0;

    return {
        summary: {
            credits,
            debits,
            net: credits - debits,
        },
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        data: transactions,
    };
};

export const TransactionService = {
    createPaymentIntent,
    createTransaction,
    handleStripeWebhook,
    getTransactionHistory,
};
