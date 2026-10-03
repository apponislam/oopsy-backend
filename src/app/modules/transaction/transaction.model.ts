import mongoose, { Schema } from 'mongoose';
import { ITransaction } from './transaction.interface';

const transactionSchema = new Schema<ITransaction>(
    {
        transactionId: {
            type: String,
            required: true,
            unique: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        listing: {
            type: Schema.Types.ObjectId,
            ref: 'Listing',
        },
        title: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['Booking', 'Payout', 'Refund', 'Platform Fee'],
            required: true,
        },
        category: {
            type: String,
            enum: ['Credit', 'Debit'],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: 'GBP',
        },
        status: {
            type: String,
            enum: ['Paid', 'Pending', 'Auto', 'Refunded', 'Transferred', 'Failed'],
            default: 'Pending',
        },
        paymentMethod: {
            type: String,
            enum: ['Stripe'],
            default: 'Stripe',
        },
        stripePaymentIntentId: {
            type: String,
        },
        remarks: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
