import mongoose, { Schema } from "mongoose";
import { DisputeReasonEnum, DisputeStatusEnum, IDispute } from "./dispute.interface";

const DisputeSchema = new Schema<IDispute>(
    {
        disputeId: {
            type: String,
            required: true,
            unique: true,
        },
        booking: {
            type: Schema.Types.ObjectId,
            ref: "Booking",
            required: [true, "Booking reference is required"],
        },
        listing: {
            type: Schema.Types.ObjectId,
            ref: "Listing",
        },
        payment: {
            type: Schema.Types.ObjectId,
            ref: "Payment",
        },
        initiator: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Initiator is required"],
        },
        defendant: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Defendant is required"],
        },
        reason: {
            type: String,
            enum: Object.values(DisputeReasonEnum),
            default: DisputeReasonEnum.OTHER,
            required: [true, "Dispute reason is required"],
        },
        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
        },
        images: {
            type: [String],
            default: [],
        },
        refundRequested: {
            type: Boolean,
            default: false,
        },
        refundAmount: {
            type: Number,
            min: [0, "Refund amount cannot be negative"],
        },
        status: {
            type: String,
            enum: Object.values(DisputeStatusEnum),
            default: DisputeStatusEnum.PENDING,
        },
        resolutionNotes: {
            type: String,
            trim: true,
        },
        resolvedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        resolvedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// Pre-validate hook to generate unique disputeId like DSP-12345
DisputeSchema.pre("validate", async function () {
    if (!this.disputeId) {
        let isUnique = false;
        let candidateId = "";

        while (!isUnique) {
            const randomOffset = Math.floor(Math.random() * 90000) + 10000;
            candidateId = `DSP-${randomOffset}`;

            const existingDoc = await mongoose.model("Dispute").findOne({ disputeId: candidateId });
            if (!existingDoc) {
                isUnique = true;
            }
        }
        this.disputeId = candidateId;
    }
});

DisputeSchema.index({ booking: 1 });
DisputeSchema.index({ initiator: 1, createdAt: -1 });
DisputeSchema.index({ defendant: 1, createdAt: -1 });
DisputeSchema.index({ status: 1, createdAt: -1 });

export const DisputeModel = mongoose.models.Dispute || mongoose.model<IDispute>("Dispute", DisputeSchema);
