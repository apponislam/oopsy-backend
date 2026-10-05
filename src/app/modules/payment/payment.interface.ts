import { Types } from "mongoose";

export type PaymentType = "BOOKING" | "REFUND" | "PLATFORM_FEE";
export type PaymentStatus = "PAID" | "PENDING" | "REFUNDED" | "FAILED";

export interface IPayment {
    _id?: Types.ObjectId;
    paymentId: string;
    payer?: Types.ObjectId;
    receiver?: Types.ObjectId;
    listing?: Types.ObjectId;
    booking?: Types.ObjectId;             // Ref to Booking
    bookingPayment?: Types.ObjectId;      // Ref to the original BOOKING Payment (for REFUND)
    title: string;
    type: PaymentType;
    amount: number;
    currency: string;
    status: PaymentStatus;
    stripePaymentIntentId?: string;
    stripeRefundId?: string;
    platformFeePercentage?: number;  // Platform fee percentage (e.g. 10 for 10%)
    platformFeeAmount?: number;      // Calculated platform fee amount in money
    isFeeSettled?: boolean;          // Whether the platform fee has been paid/settled
    remarks?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IPaymentFilterOptions {
    searchTerm?: string;
    type?: "ALL" | "BOOKINGS" | "REFUNDS";
    page?: number;
    limit?: number;
}
