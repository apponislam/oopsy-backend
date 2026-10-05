import Stripe from "stripe";
import config from "../../config";
import { Payment } from "../payment/payment.model";
import { UserModel } from "../auth/auth.model";
import { ListingModel } from "../listing/listing.model";
import { SettingModel } from "../setting/setting.model";
import { Types } from "mongoose";

const stripe = new Stripe(config.stripe.stripe_secret_key || "", {
    apiVersion: "2025-02-24.acacia" as any,
});

const handleStripeWebhook = async (signature: string, rawBody: Buffer) => {
    const webhookSecret = config.stripe.stripe_webhook_secret;
    if (!webhookSecret) {
        throw new Error("Stripe webhook secret is not configured.");
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
        throw new Error(`Webhook Signature Verification Failed: ${err.message}`);
    }

    switch (event.type) {
        case "payment_intent.succeeded": {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const { userId, listingId, title } = paymentIntent.metadata || {};

            if (userId) {
                const existingPayment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });

                let receiverId: Types.ObjectId | undefined;
                if (listingId) {
                    const listing = await ListingModel.findById(listingId);
                    if (listing && listing.host) {
                        receiverId = listing.host as unknown as Types.ObjectId;
                    }
                }

                const amountPaid = paymentIntent.amount / 100;

                // Fetch platform defaultCommissionPercentage from settings
                let settings = await SettingModel.findOne();
                if (!settings) {
                    settings = await SettingModel.create({});
                }
                const feePercentage = settings.defaultCommissionPercentage ?? 10;
                const platformFeeAmount = (amountPaid * feePercentage) / 100;
                const netAmountForHost = amountPaid - platformFeeAmount;

                if (!existingPayment) {
                    await Payment.create({
                        payer: new Types.ObjectId(userId),
                        receiver: receiverId,
                        listing: listingId ? new Types.ObjectId(listingId) : undefined,
                        title: title || "Stripe Payment",
                        amount: amountPaid,
                        status: "PAID",
                        stripePaymentIntentId: paymentIntent.id,
                        platformFeePercentage: feePercentage,
                        platformFeeAmount: platformFeeAmount,
                        isFeeSettled: true,
                    });
                } else {
                    existingPayment.status = "PAID";
                    if (receiverId) existingPayment.receiver = receiverId;
                    existingPayment.platformFeePercentage = feePercentage;
                    existingPayment.platformFeeAmount = platformFeeAmount;
                    existingPayment.isFeeSettled = true;
                    await existingPayment.save();
                }

                // Automatically credit receiver's (host's) net balance (amount minus platform fee)
                if (receiverId) {
                    await UserModel.findByIdAndUpdate(receiverId, {
                        $inc: { balance: netAmountForHost },
                    });
                }
            }
            break;
        }

        case "payment_intent.payment_failed": {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const existingPayment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
            if (existingPayment) {
                existingPayment.status = "FAILED";
                await existingPayment.save();
            }
            break;
        }

        case "charge.refunded": {
            const charge = event.data.object as Stripe.Charge;
            if (charge.payment_intent) {
                const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent.id;

                const existingPayment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
                if (existingPayment) {
                    const wasPaid = existingPayment.status === "PAID";
                    existingPayment.status = "REFUNDED";
                    await existingPayment.save();

                    // Deduct from receiver's balance if it was credited previously
                    if (wasPaid && existingPayment.receiver) {
                        await UserModel.findByIdAndUpdate(existingPayment.receiver, {
                            $inc: { balance: -existingPayment.amount },
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
