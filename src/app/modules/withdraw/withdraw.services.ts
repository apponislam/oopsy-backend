import { StripeService } from "../stripe/stripe.services";
import { UserModel } from "../auth/auth.model";
import { Withdraw } from "./withdraw.model";
import { IWithdrawFilterOptions } from "./withdraw.interface";

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

    // Create a PENDING Withdraw record in the independent Withdraw collection
    const withdrawDoc = await Withdraw.create({
        user: user._id,
        amount,
        currency: "usd",
        status: "PENDING",
        stripeAccountId: user.stripeAccountId,
        remarks: remarks || "User requested payout",
    });

    return {
        remainingBalance: user.balance,
        withdraw: withdrawDoc,
    };
};

const acceptPayout = async (withdrawId: string) => {
    const withdrawDoc = await Withdraw.findById(withdrawId);
    if (!withdrawDoc) {
        throw new Error("Withdraw request not found");
    }

    if (withdrawDoc.status !== "PENDING") {
        throw new Error(`Withdraw request is already ${withdrawDoc.status}`);
    }

    const user = await UserModel.findById(withdrawDoc.user);
    if (!user) {
        throw new Error("User not found");
    }

    const stripeAccountId = withdrawDoc.stripeAccountId || user.stripeAccountId;
    if (!stripeAccountId) {
        throw new Error("User does not have a connected Stripe account");
    }

    const stripeResult = await StripeService.transferToConnectedAccount({
        amount: withdrawDoc.amount,
        stripeAccountId,
        currency: withdrawDoc.currency || "usd",
    });

    withdrawDoc.status = "PAID";
    withdrawDoc.stripeTransferId = stripeResult.transferId;
    await withdrawDoc.save();

    return withdrawDoc;
};

const rejectPayout = async (withdrawId: string, reason?: string) => {
    const withdrawDoc = await Withdraw.findById(withdrawId);
    if (!withdrawDoc) {
        throw new Error("Withdraw request not found");
    }

    if (withdrawDoc.status !== "PENDING") {
        throw new Error(`Withdraw request is already ${withdrawDoc.status}`);
    }

    withdrawDoc.status = "REJECTED";
    if (reason) {
        withdrawDoc.rejectionReason = reason;
        withdrawDoc.remarks = reason;
    }
    await withdrawDoc.save();

    if (withdrawDoc.user) {
        await UserModel.findByIdAndUpdate(withdrawDoc.user, {
            $inc: { balance: withdrawDoc.amount },
        });
    }

    return withdrawDoc;
};

const getUserWithdrawals = async (userId: string, filters: IWithdrawFilterOptions) => {
    const { searchTerm, status, page = 1, limit = 10 } = filters;
    const query: any = { user: userId };

    if (status && status !== "ALL") {
        query.status = status;
    }

    if (searchTerm) {
        query.$or = [
            { withdrawId: { $regex: searchTerm, $options: "i" } },
            { remarks: { $regex: searchTerm, $options: "i" } },
        ];
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const withdrawals = await Withdraw.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .populate("user", "name email phone profileImage");

    const total = await Withdraw.countDocuments(query);
    const totalPages = Math.ceil(total / limitNumber);

    return {
        meta: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1,
        },
        data: withdrawals,
    };
};

const getAllWithdrawalsForAdmin = async (filters: IWithdrawFilterOptions) => {
    const { searchTerm, status, page = 1, limit = 10 } = filters;
    const query: any = {};

    if (status && status !== "ALL") {
        query.status = status;
    }

    if (searchTerm) {
        query.$or = [
            { withdrawId: { $regex: searchTerm, $options: "i" } },
            { remarks: { $regex: searchTerm, $options: "i" } },
        ];
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const withdrawals = await Withdraw.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .populate("user", "name email phone profileImage role");

    const total = await Withdraw.countDocuments(query);
    const totalPages = Math.ceil(total / limitNumber);

    return {
        meta: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1,
        },
        data: withdrawals,
    };
};

export const WithdrawService = {
    createConnectAccount,
    createAccountLink,
    requestPayout,
    acceptPayout,
    rejectPayout,
    getUserWithdrawals,
    getAllWithdrawalsForAdmin,
};
