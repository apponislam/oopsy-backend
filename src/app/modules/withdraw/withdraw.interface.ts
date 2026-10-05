import { Types } from "mongoose";

export type WithdrawStatus = "PENDING" | "PAID" | "REJECTED";

export interface IWithdraw {
    _id?: Types.ObjectId;
    withdrawId: string;
    user: Types.ObjectId;
    amount: number;
    currency: string;
    status: WithdrawStatus;
    stripeAccountId?: string;
    stripeTransferId?: string;
    remarks?: string;
    rejectionReason?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IWithdrawFilterOptions {
    searchTerm?: string;
    status?: WithdrawStatus | "ALL";
    page?: number;
    limit?: number;
}
