import { Types } from "mongoose";

export interface IRatingCategories {
    cleanliness: number;
    safety: number;
    facilities: number;
    privacy: number;
    serviceQuality: number;
}

export interface IReviewReply {
    user: Types.ObjectId;
    comment: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IReview {
    _id?: Types.ObjectId;
    user: Types.ObjectId;
    listing: Types.ObjectId;
    rating: number;
    categories: IRatingCategories;
    comment: string;
    photos?: string[];
    reply?: IReviewReply;
    isDeleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ICategoryAverages {
    cleanliness: number;
    safety: number;
    facilities: number;
    privacy: number;
    serviceQuality: number;
}

export interface IReviewStats {
    averageRating: number;
    totalReviews: number;
    categoryAverages: ICategoryAverages;
    ratingDistribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}
