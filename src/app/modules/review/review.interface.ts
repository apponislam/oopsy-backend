import { Types } from "mongoose";

export interface IReview {
    _id?: Types.ObjectId;
    user: Types.ObjectId;
    listing: Types.ObjectId;
    rating: number;
    comment: string;
    isDeleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IReviewStats {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}
