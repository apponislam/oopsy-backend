import { Types } from 'mongoose';

export type TransactionType = 'Booking' | 'Payout' | 'Refund' | 'Platform Fee';
export type TransactionCategory = 'Credit' | 'Debit';
export type TransactionStatus = 'Paid' | 'Pending' | 'Auto' | 'Refunded' | 'Transferred' | 'Failed';

export interface ITransaction {
    _id?: Types.ObjectId;
    transactionId: string;
    user: Types.ObjectId;
    listing?: Types.ObjectId;
    title: string;
    type: TransactionType;
    category: TransactionCategory;
    amount: number;
    currency: string;
    status: TransactionStatus;
    paymentMethod: 'Stripe';
    stripePaymentIntentId?: string;
    remarks?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ITransactionFilterOptions {
    searchTerm?: string;
    type?: 'All' | 'Bookings' | 'Payouts' | 'Refunds';
    page?: number;
    limit?: number;
}
