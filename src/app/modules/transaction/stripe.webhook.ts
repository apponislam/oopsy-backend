import Stripe from 'stripe';
import config from '../../config';
import { Transaction } from './transaction.model';
import { UserModel } from '../auth/auth.model';
import { ListingModel } from '../listing/listing.model';
import { Types } from 'mongoose';

const stripe = new Stripe(config.stripe.stripe_secret_key || '', {
    apiVersion: '2025-02-24.acacia' as any,
});

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

                let receiverId: Types.ObjectId | undefined;
                if (listingId) {
                    const listing = await ListingModel.findById(listingId);
                    if (listing && listing.host) {
                        receiverId = listing.host as unknown as Types.ObjectId;
                    }
                }

                const amountPaid = paymentIntent.amount / 100;

                if (!existingTx) {
                    await Transaction.create({
                        payer: new Types.ObjectId(userId),
                        receiver: receiverId,
                        user: new Types.ObjectId(userId),
                        listing: listingId ? new Types.ObjectId(listingId) : undefined,
                        title: title || 'Stripe Payment',
                        type: 'BOOKING',
                        amount: amountPaid,
                        status: 'PAID',
                        stripePaymentIntentId: paymentIntent.id,
                    });
                } else {
                    existingTx.status = 'PAID';
                    if (receiverId) existingTx.receiver = receiverId;
                    await existingTx.save();
                }

                // Automatically credit receiver's (host's) balance if receiver exists
                if (receiverId) {
                    await UserModel.findByIdAndUpdate(receiverId, {
                        $inc: { balance: amountPaid },
                    });
                }
            }
            break;
        }

        case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const existingTx = await Transaction.findOne({ stripePaymentIntentId: paymentIntent.id });
            if (existingTx) {
                existingTx.status = 'FAILED';
                await existingTx.save();
            }
            break;
        }

        case 'charge.refunded': {
            const charge = event.data.object as Stripe.Charge;
            if (charge.payment_intent) {
                const paymentIntentId = typeof charge.payment_intent === 'string' 
                    ? charge.payment_intent 
                    : charge.payment_intent.id;
                
                const existingTx = await Transaction.findOne({ stripePaymentIntentId: paymentIntentId });
                if (existingTx) {
                    const wasPaid = existingTx.status === 'PAID';
                    existingTx.status = 'REFUNDED';
                    await existingTx.save();

                    // Deduct from receiver's balance if it was credited previously
                    if (wasPaid && existingTx.receiver) {
                        await UserModel.findByIdAndUpdate(existingTx.receiver, {
                            $inc: { balance: -existingTx.amount },
                        });
                    }
                }
            }
            break;
        }

        default:
            console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return { received: true };
};

export const StripeWebhookService = {
    handleStripeWebhook,
};
