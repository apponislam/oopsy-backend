import { Types } from "mongoose";

export type PaymentStatus = "PAID" | "PENDING" | "REFUNDED" | "FAILED" | "DISPUTED";

export interface IPayment {
    _id?: Types.ObjectId;
    paymentId: string;
    payer?: Types.ObjectId;
    receiver?: Types.ObjectId;
    listing?: Types.ObjectId;
    booking?: Types.ObjectId;             // Ref to Booking
    title: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    stripePaymentIntentId?: string;
    stripeRefundId?: string;
    platformFeePercentage?: number;  // Platform fee percentage (e.g. 10 for 10%)
    platformFeeAmount?: number;      // Calculated platform fee amount in money
    isFeeSettled?: boolean;          // Whether the platform fee has been paid/settled
    isDisputed?: boolean;
    disputeReason?: string;
    disputedAt?: Date;
    disputeResolvedAt?: Date;
    disputeResolutionNotes?: string;
    remarks?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IPaymentFilterOptions {
    searchTerm?: string;
    status?: "ALL" | PaymentStatus;
    page?: number;
    limit?: number;
}
