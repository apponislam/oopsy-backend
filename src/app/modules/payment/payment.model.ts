import mongoose, { Schema } from 'mongoose';
import { IPayment } from './payment.interface';

const paymentSchema = new Schema<IPayment>(
    {
        paymentId: {
            type: String,
            required: true,
            unique: true,
        },
        payer: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        receiver: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        listing: {
            type: Schema.Types.ObjectId,
            ref: 'Listing',
        },
        booking: {
            type: Schema.Types.ObjectId,
            ref: 'Booking',
        },
        bookingPayment: {
            type: Schema.Types.ObjectId,
            ref: 'Payment',
        },
        title: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['BOOKING', 'REFUND', 'PLATFORM_FEE'],
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
            enum: ['PAID', 'PENDING', 'REFUNDED', 'FAILED'],
            default: 'PENDING',
        },
        stripePaymentIntentId: {
            type: String,
        },
        stripeRefundId: {
            type: String,
        },
        platformFeePercentage: {
            type: Number,
            default: 0,
        },
        platformFeeAmount: {
            type: Number,
            default: 0,
        },
        isFeeSettled: {
            type: Boolean,
            default: false,
        },
        remarks: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

paymentSchema.pre('validate', async function () {
    if (!this.paymentId) {
        let isUnique = false;
        let candidateId = '';

        while (!isUnique) {
            const count = await mongoose.model('Payment').countDocuments();
            const nextNum = (count + 1).toString().padStart(8, '0');
            candidateId = `P-${nextNum}`;

            const existingDoc = await mongoose.model('Payment').findOne({ paymentId: candidateId });
            if (!existingDoc) {
                isUnique = true;
            } else {
                const randomOffset = Math.floor(Math.random() * 1000) + 1;
                candidateId = `P-${(count + 1 + randomOffset).toString().padStart(8, '0')}`;
                const recheckDoc = await mongoose.model('Payment').findOne({ paymentId: candidateId });
                if (!recheckDoc) {
                    isUnique = true;
                }
            }
        }
        this.paymentId = candidateId;
    }
});

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
