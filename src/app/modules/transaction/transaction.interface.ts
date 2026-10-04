import { Types } from "mongoose";

export type TransactionType = "BOOKING" | "PAYOUT" | "REFUND" | "PLATFORM_FEE";
export type TransactionStatus = "PAID" | "PENDING" | "REFUNDED" | "FAILED" | "REJECTED";

export interface ITransaction {
    _id?: Types.ObjectId;
    transactionId: string;
    payer?: Types.ObjectId;
    receiver?: Types.ObjectId;
    listing?: Types.ObjectId;
    booking?: Types.ObjectId;             // Ref to Booking
    bookingTransaction?: Types.ObjectId;  // Ref to the original BOOKING Transaction (for PAYOUT or REFUND)
    title: string;
    type: TransactionType;
    amount: number;
    currency: string;
    status: TransactionStatus;
    stripePaymentIntentId?: string;
    stripeRefundId?: string;
    stripeTransferId?: string;
    platformFeePercentage?: number;  // Platform fee percentage (e.g. 10 for 10%)
    platformFeeAmount?: number;      // Calculated platform fee amount in money
    isFeeSettled?: boolean;          // Whether the platform fee has been paid/settled
    remarks?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ITransactionFilterOptions {
    searchTerm?: string;
    type?: "ALL" | "BOOKINGS" | "PAYOUTS" | "REFUNDS";
    page?: number;
    limit?: number;
}
