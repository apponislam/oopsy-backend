import mongoose, { Schema } from "mongoose";
import { IReview } from "./review.interface";

const ReviewSchema = new Schema<IReview>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
        },
        listing: {
            type: Schema.Types.ObjectId,
            ref: "Listing",
            required: [true, "Listing is required"],
        },
        rating: {
            type: Number,
            required: [true, "Rating is required"],
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating cannot exceed 5"],
        },
        comment: {
            type: String,
            required: [true, "Comment is required"],
            trim: true,
            maxLength: [1000, "Comment cannot exceed 1000 characters"],
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

/*
|--------------------------------------------------------------------------
| Indexing Strategy
|--------------------------------------------------------------------------
*/
ReviewSchema.index({ listing: 1, isDeleted: 1 });
ReviewSchema.index({ user: 1, listing: 1, isDeleted: 1 });
ReviewSchema.index({ createdAt: -1 });

export const ReviewModel = mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);
