import { Types } from 'mongoose';

export type TransactionType = 'BOOKING' | 'PAYOUT' | 'REFUND' | 'PLATFORM_FEE';
export type TransactionStatus = 'PAID' | 'PENDING' | 'REFUNDED' | 'FAILED' | 'REJECTED';

export interface ITransaction {
    _id?: Types.ObjectId;
    transactionId: string;
    payer: Types.ObjectId;      // User who paid / initiated payment (Customer / Client)
    receiver?: Types.ObjectId;   // User who received the payment (Host / Provider)
    user?: Types.ObjectId;       // Legacy reference alias
    listing?: Types.ObjectId;
    title: string;
    type: TransactionType;
    amount: number;
    currency: string;
    status: TransactionStatus;
    stripePaymentIntentId?: string;
    stripeRefundId?: string;
    stripeTransferId?: string;
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
