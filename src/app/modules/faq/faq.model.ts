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
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

export const FaqModel = mongoose.models.Faq || mongoose.model<IFaq>("Faq", FaqSchema);
