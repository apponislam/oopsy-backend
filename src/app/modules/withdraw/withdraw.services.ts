import { StripeService } from "../stripe/stripe.services";
import { UserModel } from "../auth/auth.model";
import { Transaction } from "../transaction/transaction.model";
import { Types } from "mongoose";

const createConnectAccount = async (userId: string, email: string) => {
    return await StripeService.createConnectAccount(userId, email);
};

const createAccountLink = async (userId: string, returnUrl?: string, refreshUrl?: string) => {
    return await StripeService.createAccountLink(userId, returnUrl, refreshUrl);
};

const requestPayout = async (userId: string, amount: number, remarks?: string) => {
    if (amount <= 0) {
        throw new Error("Payout amount must be greater than zero");
    }

    const user = await UserModel.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }

    const currentBalance = user.balance || 0;
    if (currentBalance < amount) {
        throw new Error(`Insufficient balance. Current balance is $${currentBalance}`);
    }

    // Deduct user balance upfront to hold funds
    user.balance = currentBalance - amount;
    await user.save();

    // Create a PENDING PAYOUT transaction record
    const payoutTx = await Transaction.create({
        receiver: new Types.ObjectId(userId),
        title: `Withdrawal / Payout Request of $${amount}`,
        type: "PAYOUT",
        amount,
        currency: "usd",
        status: "PENDING",
        remarks: remarks || "User requested payout",
    });

    return {
        remainingBalance: user.balance,
        transaction: payoutTx,
    };
};

const acceptPayout = async (transactionId: string) => {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
        throw new Error("Transaction not found");
    }

    if (transaction.type !== "PAYOUT") {
        throw new Error("Transaction is not a payout request");
    }

    if (transaction.status !== "PENDING") {
        throw new Error(`Payout request is already ${transaction.status}`);
    }

    const user = await UserModel.findById(transaction.receiver);

    const stripeResult = await StripeService.transferToConnectedAccount({
        amount: transaction.amount,
        stripeAccountId: user?.stripeAccountId,
        currency: transaction.currency || "usd",
    });

    transaction.status = "PAID";
    transaction.stripeTransferId = stripeResult.transferId;
    await transaction.save();

    return transaction;
};

const rejectPayout = async (transactionId: string, reason?: string) => {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
        throw new Error("Transaction not found");
    }

    if (transaction.type !== "PAYOUT") {
        throw new Error("Transaction is not a payout request");
    }

    if (transaction.status !== "PENDING") {
        throw new Error(`Payout request is already ${transaction.status}`);
    }

    transaction.status = "REJECTED";
    if (reason) {
        transaction.remarks = reason;
    }
    await transaction.save();

    if (transaction.receiver) {
        await UserModel.findByIdAndUpdate(transaction.receiver, {
            $inc: { balance: transaction.amount },
        });
    }

    return transaction;
};

export const WithdrawService = {
    createConnectAccount,
    createAccountLink,
    requestPayout,
    acceptPayout,
    rejectPayout,
};
