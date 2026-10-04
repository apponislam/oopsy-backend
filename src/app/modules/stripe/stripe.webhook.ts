import Stripe from "stripe";
import config from "../../config";
import { Transaction } from "../transaction/transaction.model";
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
                const existingTx = await Transaction.findOne({ stripePaymentIntentId: paymentIntent.id });

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

                if (!existingTx) {
                    await Transaction.create({
                        payer: new Types.ObjectId(userId),
                        receiver: receiverId,
                        listing: listingId ? new Types.ObjectId(listingId) : undefined,
                        title: title || "Stripe Payment",
                        type: "BOOKING",
                        amount: amountPaid,
                        status: "PAID",
                        stripePaymentIntentId: paymentIntent.id,
                        platformFeePercentage: feePercentage,
                        platformFeeAmount: platformFeeAmount,
                        isFeeSettled: true,
                    });
                } else {
                    existingTx.status = "PAID";
                    if (receiverId) existingTx.receiver = receiverId;
                    existingTx.platformFeePercentage = feePercentage;
                    existingTx.platformFeeAmount = platformFeeAmount;
                    existingTx.isFeeSettled = true;
                    await existingTx.save();
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
            const existingTx = await Transaction.findOne({ stripePaymentIntentId: paymentIntent.id });
            if (existingTx) {
                existingTx.status = "FAILED";
                await existingTx.save();
            }
            break;
        }

        case "charge.refunded": {
            const charge = event.data.object as Stripe.Charge;
            if (charge.payment_intent) {
                const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent.id;

                const existingTx = await Transaction.findOne({ stripePaymentIntentId: paymentIntentId });
                if (existingTx) {
                    const wasPaid = existingTx.status === "PAID";
                    existingTx.status = "REFUNDED";
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

        case "transfer.created": {
            const transfer = event.data.object as Stripe.Transfer;
            console.log(`Stripe Transfer created: ${transfer.id} of amount ${transfer.amount / 100}`);
            break;
        }

        case "transfer.reversed": {
            const transfer = event.data.object as Stripe.Transfer;
            const existingTx = await Transaction.findOne({ stripeTransferId: transfer.id });
            if (existingTx) {
                existingTx.status = "FAILED";
                existingTx.remarks = "Stripe transfer reversed";
                await existingTx.save();

                // Re-credit the user balance if transfer was reversed/failed
                if (existingTx.payer) {
                    await UserModel.findByIdAndUpdate(existingTx.payer, {
                        $inc: { balance: existingTx.amount },
                    });
                }
            }
            break;
        }

        case "payout.paid": {
            const payout = event.data.object as Stripe.Payout;
            console.log(`Stripe Payout succeeded: ${payout.id} of amount ${payout.amount / 100}`);
            break;
        }

        case "payout.failed": {
            const payout = event.data.object as Stripe.Payout;
            const existingTx = await Transaction.findOne({ stripeTransferId: payout.id });
            if (existingTx) {
                existingTx.status = "FAILED";
                existingTx.remarks = payout.failure_message || "Stripe payout failed";
                await existingTx.save();

                if (existingTx.payer) {
                    await UserModel.findByIdAndUpdate(existingTx.payer, {
                        $inc: { balance: existingTx.amount },
                    });
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
