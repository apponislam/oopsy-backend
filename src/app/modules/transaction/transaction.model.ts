import mongoose, { Schema } from 'mongoose';
import { ITransaction } from './transaction.interface';

const transactionSchema = new Schema<ITransaction>(
    {
        transactionId: {
            type: String,
            required: true,
            unique: true,
        },
        payer: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiver: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
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
            enum: ['BOOKING', 'PAYOUT', 'REFUND', 'PLATFORM_FEE'],
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
            enum: ['PAID', 'PENDING', 'REFUNDED', 'FAILED', 'REJECTED'],
            default: 'PENDING',
        },
        stripePaymentIntentId: {
            type: String,
        },
        stripeRefundId: {
            type: String,
        },
        stripeTransferId: {
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

transactionSchema.pre('validate', async function () {
    if (!this.transactionId) {
        let isUnique = false;
        let candidateId = '';

        while (!isUnique) {
            const count = await mongoose.model('Transaction').countDocuments();
            const nextNum = (count + 1).toString().padStart(8, '0');
            candidateId = `T-${nextNum}`;

            const existingDoc = await mongoose.model('Transaction').findOne({ transactionId: candidateId });
            if (!existingDoc) {
                isUnique = true;
            } else {
                const randomOffset = Math.floor(Math.random() * 1000) + 1;
                candidateId = `T-${(count + 1 + randomOffset).toString().padStart(8, '0')}`;
                const recheckDoc = await mongoose.model('Transaction').findOne({ transactionId: candidateId });
                if (!recheckDoc) {
                    isUnique = true;
                }
            }
        }
        this.transactionId = candidateId;
    }

    if (this.payer && !this.user) {
        this.user = this.payer;
    }
});

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
