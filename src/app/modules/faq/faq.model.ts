import mongoose, { Schema } from "mongoose";
import { IFaq } from "./faq.interface";

const FaqSchema = new Schema<IFaq>(
    {
        question: {
            type: String,
            required: [true, "Question is required"],
            trim: true,
        },
        answer: {
            type: String,
            required: [true, "Answer is required"],
            trim: true,
        },
        category: {
            type: String,
            default: "General",
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

FaqSchema.index({ isActive: 1, isDeleted: 1 });

export const FaqModel = mongoose.models.Faq || mongoose.model<IFaq>("Faq", FaqSchema);
