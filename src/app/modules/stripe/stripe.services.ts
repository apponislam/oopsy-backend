import Stripe from "stripe";
import config from "../../config";
import { Payment } from "../payment/payment.model";
import { UserModel } from "../auth/auth.model";

const stripe = new Stripe(config.stripe.stripe_secret_key || "", {
    apiVersion: "2025-02-24.acacia" as any,
});

// Create Stripe PaymentIntent
const createPaymentIntent = async (payload: { amount: number; user: string; title?: string; listingId?: string }) => {
    const amountInCents = Math.round(payload.amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        metadata: {
            userId: payload.user,
            listingId: payload.listingId || "",
            title: payload.title || "Payment",
        },
    });

    return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
    };
};

// Process Refund via Stripe
const processRefund = async (payload: { transactionId: string; amount?: number; reason?: string }) => {
    const payment = await Payment.findById(payload.transactionId);
    if (!payment) {
        throw new Error("Payment record not found");
    }

    if (!payment.stripePaymentIntentId) {
        throw new Error("No Stripe PaymentIntent ID associated with this payment");
    }

    if (payment.status === "REFUNDED") {
        throw new Error("Payment has already been refunded");
    }

    const refundAmountInCents = payload.amount ? Math.round(payload.amount * 100) : undefined;

    const refund = await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        amount: refundAmountInCents,
        reason: (payload.reason as any) || "requested_by_customer",
    });

    const refundAmount = refund.amount / 100;
    const previousStatus = payment.status;

    payment.status = "REFUNDED";
    payment.stripeRefundId = refund.id;
    if (payload.reason) {
        payment.remarks = payload.reason;
    }
    await payment.save();

    // Deduct refunded amount from receiver's (host's) balance if previously paid
    if (previousStatus === "PAID" && payment.receiver) {
        await UserModel.findByIdAndUpdate(payment.receiver, {
            $inc: { balance: -refundAmount },
        });
    }

    // Create a corresponding Refund payment record
    const refundPayment = await Payment.create({
        payer: payment.receiver || payment.payer, // Receiver pays back
        receiver: payment.payer, // Customer gets money back
        listing: payment.listing,
        booking: payment.booking,
        bookingPayment: payment._id,
        title: `Refund for ${payment.title}`,
        type: "REFUND",
        amount: refundAmount,
        currency: payment.currency,
        status: "REFUNDED",
        stripePaymentIntentId: payment.stripePaymentIntentId,
        stripeRefundId: refund.id,
        remarks: payload.reason,
    });

    return {
        refund,
        payment: refundPayment,
    };
};

// Create a Stripe Connect Custom/Express Account for user
const createConnectAccount = async (userId: string, email: string) => {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("User not found");

    if (user.stripeAccountId) {
        return { stripeAccountId: user.stripeAccountId };
    }

    const account = await stripe.accounts.create({
        type: "express",
        email,
        capabilities: {
            transfers: { requested: true },
        },
    });

    user.stripeAccountId = account.id;
    await user.save();

    return { stripeAccountId: account.id };
};

// Create Stripe Connect Onboarding Account Link for user onboarding
const createAccountLink = async (userId: string, returnUrl?: string, refreshUrl?: string) => {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("User not found");

    let accountId = user.stripeAccountId;
    if (!accountId) {
        const created = await createConnectAccount(userId, user.email);
        accountId = created.stripeAccountId;
    }

    const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl || `${config.server_url}/api/v1/withdraw/stripe/reauth`,
        return_url: returnUrl || `${config.server_url}/api/v1/withdraw/stripe/return`,
        type: "account_onboarding",
    });

    return { url: accountLink.url };
};

// Transfer Payout Amount via Stripe Connect or Payout
const transferToConnectedAccount = async (payload: { amount: number; stripeAccountId?: string; destinationAccountId?: string; currency?: string }) => {
    const amountInCents = Math.round(payload.amount * 100);
    const destination = payload.stripeAccountId || payload.destinationAccountId;

    if (destination) {
        const transfer = await stripe.transfers.create({
            amount: amountInCents,
            currency: payload.currency || "usd",
            destination,
            description: "Payout withdrawal approved by admin",
        });
        return { transferId: transfer.id, transfer };
    } else {
        const payout = await stripe.payouts.create({
            amount: amountInCents,
            currency: payload.currency || "usd",
            description: "Payout withdrawal approved by admin",
        });
        return { transferId: payout.id, payout };
    }
};

export const StripeService = {
    createPaymentIntent,
    processRefund,
    createConnectAccount,
    createAccountLink,
    transferToConnectedAccount,
};
