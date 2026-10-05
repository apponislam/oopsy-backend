import mongoose, { Schema } from 'mongoose';
import { IWithdraw } from './withdraw.interface';

const withdrawSchema = new Schema<IWithdraw>(
    {
        withdrawId: {
            type: String,
            required: true,
            unique: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: 'usd',
        },
        status: {
            type: String,
            enum: ['PENDING', 'PAID', 'REJECTED'],
            default: 'PENDING',
        },
        stripeAccountId: {
            type: String,
        },
        stripeTransferId: {
            type: String,
        },
        remarks: {
            type: String,
        },
        rejectionReason: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

withdrawSchema.pre('validate', async function () {
    if (!this.withdrawId) {
        let isUnique = false;
        let candidateId = '';

        while (!isUnique) {
            const count = await mongoose.model('Withdraw').countDocuments();
            const nextNum = (count + 1).toString().padStart(8, '0');
            candidateId = `W-${nextNum}`;

            const existingDoc = await mongoose.model('Withdraw').findOne({ withdrawId: candidateId });
            if (!existingDoc) {
                isUnique = true;
            } else {
                const randomOffset = Math.floor(Math.random() * 1000) + 1;
                candidateId = `W-${(count + 1 + randomOffset).toString().padStart(8, '0')}`;
                const recheckDoc = await mongoose.model('Withdraw').findOne({ withdrawId: candidateId });
                if (!recheckDoc) {
                    isUnique = true;
                }
            }
        }
        this.withdrawId = candidateId;
    }
});

export const Withdraw = mongoose.model<IWithdraw>('Withdraw', withdrawSchema);
