import { Types } from 'mongoose';

export type TransactionType = 'BOOKING' | 'PAYOUT' | 'REFUND' | 'PLATFORM_FEE';
export type TransactionStatus = 'PAID' | 'PENDING' | 'REFUNDED' | 'FAILED';

export interface ITransaction {
    _id?: Types.ObjectId;
    transactionId: string;
    user: Types.ObjectId;
    listing?: Types.ObjectId;
    title: string;
    type: TransactionType;
    amount: number;
    currency: string;
    status: TransactionStatus;
    stripePaymentIntentId?: string;
    stripeRefundId?: string;
    remarks?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ITransactionFilterOptions {
    searchTerm?: string;
    type?: 'ALL' | 'BOOKINGS' | 'PAYOUTS' | 'REFUNDS';
    page?: number;
    limit?: number;
}
