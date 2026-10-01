import httpStatus from "http-status";
import mongoose from "mongoose";
import ApiError from "../../../errors/ApiError";
import { ListingModel } from "../listing/listing.model";
import { IReview, IReviewStats } from "./review.interface";
import { ReviewModel } from "./review.model";

const createReview = async (userId: string, payload: { listing: string; rating: number; comment: string }) => {
    const { listing: listingId, rating, comment } = payload;

    // 1. Verify listing exists
    const listingExists = await ListingModel.findOne({ _id: listingId, isDeleted: false });
    if (!listingExists) {
        throw new ApiError(httpStatus.NOT_FOUND, "Listing not found");
    }

    // 2. Prevent host from reviewing their own listing
    if (listingExists.host.toString() === userId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Hosts cannot review their own listing");
    }

    // 3. Check if user already reviewed this listing
    const existingReview = await ReviewModel.findOne({
        user: userId,
        listing: listingId,
        isDeleted: false,
    });

    if (existingReview) {
        throw new ApiError(httpStatus.CONFLICT, "You have already submitted a review for this listing");
    }

    const review = await ReviewModel.create({
        user: userId,
        listing: listingId,
        rating,
        comment,
    });

    const populatedReview = await review.populate("user", "name email profileImage role");
    return populatedReview;
};

const getListingReviews = async (listingId: string, query: any) => {
    const { page = 1, limit = 10 } = query;

    const listingExists = await ListingModel.findOne({ _id: listingId, isDeleted: false });
    if (!listingExists) {
        throw new ApiError(httpStatus.NOT_FOUND, "Listing not found");
    }

    const filter = { listing: listingId, isDeleted: false };
    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total, stats] = await Promise.all([
        ReviewModel.find(filter)
            .populate("user", "name email profileImage")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        ReviewModel.countDocuments(filter),
        getListingReviewStats(listingId),
    ]);

    const totalPages = Math.ceil(total / Number(limit));
    const pageNumber = Number(page);

    return {
        meta: {
            page: pageNumber,
            limit: Number(limit),
            total,
            totalPages,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1,
        },
        stats,
        data: reviews,
    };
};

const getUserReviews = async (userId: string, query: any) => {
    const { page = 1, limit = 10 } = query;

    const filter = { user: userId, isDeleted: false };
    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
        ReviewModel.find(filter)
            .populate({
                path: "listing",
                select: "name description photos location facilityType host",
                populate: { path: "facilityType", select: "name slug image" },
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        ReviewModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / Number(limit));
    const pageNumber = Number(page);

    return {
        meta: {
            page: pageNumber,
            limit: Number(limit),
            total,
            totalPages,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1,
        },
        data: reviews,
    };
};

const getSingleReview = async (id: string) => {
    const review = await ReviewModel.findOne({ _id: id, isDeleted: false })
        .populate("user", "name email profileImage")
        .populate({
            path: "listing",
            select: "name description photos location facilityType host",
        });

    if (!review) {
        throw new ApiError(httpStatus.NOT_FOUND, "Review not found");
    }

    return review;
};

const updateReview = async (id: string, userId: string, payload: Partial<IReview>) => {
    const existingReview = await ReviewModel.findOne({ _id: id, isDeleted: false });

    if (!existingReview) {
        throw new ApiError(httpStatus.NOT_FOUND, "Review not found");
    }

    if (existingReview.user.toString() !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, "You can only update your own review");
    }

    const updatedData: Partial<IReview> = {};
    if (payload.rating !== undefined) updatedData.rating = payload.rating;
    if (payload.comment !== undefined) updatedData.comment = payload.comment;

    const updatedReview = await ReviewModel.findByIdAndUpdate(
        id,
        { $set: updatedData },
        { returnDocument: "after", runValidators: true },
    ).populate("user", "name email profileImage");

    return updatedReview;
};

const deleteReview = async (id: string, userId: string, userRole?: string) => {
    const existingReview = await ReviewModel.findOne({ _id: id, isDeleted: false });

    if (!existingReview) {
        throw new ApiError(httpStatus.NOT_FOUND, "Review not found");
    }

    if (existingReview.user.toString() !== userId && userRole !== "SUPER_ADMIN") {
        throw new ApiError(httpStatus.FORBIDDEN, "You can only delete your own review");
    }

    existingReview.isDeleted = true;
    await existingReview.save();

    return { message: "Review deleted successfully" };
};

const getListingReviewStats = async (listingId: string): Promise<IReviewStats> => {
    const statsResult = await ReviewModel.aggregate([
        {
            $match: {
                listing: new mongoose.Types.ObjectId(listingId),
                isDeleted: false,
            },
        },
        {
            $group: {
                _id: "$listing",
                averageRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 },
                count1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
                count2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
                count3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
                count4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
                count5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
            },
        },
    ]);

    if (statsResult.length === 0) {
        return {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
    }

    const stat = statsResult[0];
    return {
        averageRating: Math.round(stat.averageRating * 10) / 10,
        totalReviews: stat.totalReviews,
        ratingDistribution: {
            1: stat.count1,
            2: stat.count2,
            3: stat.count3,
            4: stat.count4,
            5: stat.count5,
        },
    };
};

export const reviewServices = {
    createReview,
    getListingReviews,
    getUserReviews,
    getSingleReview,
    updateReview,
    deleteReview,
    getListingReviewStats,
};
