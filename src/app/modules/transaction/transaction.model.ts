import mongoose, { Schema } from "mongoose";
import { ITransaction } from "./transaction.interface";

const transactionSchema = new Schema<ITransaction>(
    {
        transactionId: {
            type: String,
            required: true,
            unique: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        listing: {
            type: Schema.Types.ObjectId,
            ref: "Listing",
        },
        title: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ["Booking", "Payout", "Refund", "Platform Fee"],
            required: true,
        },
        category: {
            type: String,
            enum: ["Credit", "Debit"],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "GBP",
        },
        status: {
            type: String,
            enum: ["Paid", "Pending", "Auto", "Refunded", "Transferred", "Failed"],
            default: "Pending",
        },
        paymentMethod: {
            type: String,
            enum: ["Stripe"],
            default: "Stripe",
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
    },
);

transactionSchema.pre("validate", async function () {
    if (!this.transactionId) {
        let isUnique = false;
        let candidateId = "";

        while (!isUnique) {
            const count = await mongoose.model("Transaction").countDocuments();
            const nextNum = (count + 1).toString().padStart(8, "0");
            candidateId = `T-${nextNum}`;

            const existingDoc = await mongoose.model("Transaction").findOne({ transactionId: candidateId });
            if (!existingDoc) {
                isUnique = true;
            } else {
                // If collision occurs due to concurrent insertions, increment count offset
                const randomOffset = Math.floor(Math.random() * 1000) + 1;
                candidateId = `T-${(count + 1 + randomOffset).toString().padStart(8, "0")}`;
                const recheckDoc = await mongoose.model("Transaction").findOne({ transactionId: candidateId });
                if (!recheckDoc) {
                    isUnique = true;
                }
            }
        }
        this.transactionId = candidateId;
    }
});

export const Transaction = mongoose.model<ITransaction>("Transaction", transactionSchema);
