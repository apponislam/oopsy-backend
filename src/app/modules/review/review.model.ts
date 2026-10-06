import mongoose, { Schema } from "mongoose";
import { IReview } from "./review.interface";

const RatingCategoriesSchema = new Schema(
    {
        cleanliness: {
            type: Number,
            required: [true, "Cleanliness rating is required"],
            min: [1, "Cleanliness rating must be at least 1"],
            max: [5, "Cleanliness rating cannot exceed 5"],
        },
        safety: {
            type: Number,
            required: [true, "Safety rating is required"],
            min: [1, "Safety rating must be at least 1"],
            max: [5, "Safety rating cannot exceed 5"],
        },
        facilities: {
            type: Number,
            required: [true, "Facilities rating is required"],
            min: [1, "Facilities rating must be at least 1"],
            max: [5, "Facilities rating cannot exceed 5"],
        },
        privacy: {
            type: Number,
            required: [true, "Privacy rating is required"],
            min: [1, "Privacy rating must be at least 1"],
            max: [5, "Privacy rating cannot exceed 5"],
        },
        serviceQuality: {
            type: Number,
            required: [true, "Service Quality rating is required"],
            min: [1, "Service Quality rating must be at least 1"],
            max: [5, "Service Quality rating cannot exceed 5"],
        },
    },
    { _id: false },
);

const ReviewReplySchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Replier user ID is required"],
        },
        comment: {
            type: String,
            required: [true, "Reply comment is required"],
            trim: true,
            maxLength: [1000, "Reply comment cannot exceed 1000 characters"],
        },
    },
    {
        timestamps: true,
        _id: false,
    },
);

const ReviewSchema = new Schema<IReview>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
        },
        booking: {
            type: Schema.Types.ObjectId,
            ref: "Booking",
            required: [true, "Booking is required"],
        },
        listing: {
            type: Schema.Types.ObjectId,
            ref: "Listing",
            required: [true, "Listing is required"],
        },
        rating: {
            type: Number,
            required: [true, "Overall rating is required"],
            min: [1, "Overall rating must be at least 1"],
            max: [5, "Overall rating cannot exceed 5"],
        },
        categories: {
            type: RatingCategoriesSchema,
            required: [true, "Category rating breakdown is required"],
        },
        comment: {
            type: String,
            required: [true, "Comment is required"],
            trim: true,
            maxLength: [1000, "Comment cannot exceed 1000 characters"],
        },
        photos: {
            type: [String],
            default: [],
        },
        reply: {
            type: ReviewReplySchema,
            default: undefined,
        },
        isApproved: {
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

/*
|--------------------------------------------------------------------------
| Deep Indexing Strategy (Production Optimization)
|--------------------------------------------------------------------------
*/
ReviewSchema.index({ listing: 1, isDeleted: 1, createdAt: -1 });
ReviewSchema.index({ listing: 1, isDeleted: 1, rating: -1, createdAt: -1 });
ReviewSchema.index({ user: 1, isDeleted: 1, createdAt: -1 });
ReviewSchema.index({ user: 1, listing: 1, isDeleted: 1 });
ReviewSchema.index({ "reply.user": 1 }, { sparse: true });
ReviewSchema.index({ comment: "text" });

export const ReviewModel = mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);
