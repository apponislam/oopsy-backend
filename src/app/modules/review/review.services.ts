import httpStatus from "http-status";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import ApiError from "../../../errors/ApiError";
import { ListingModel } from "../listing/listing.model";
import { UserModel } from "../auth/auth.model";
import { SettingModel } from "../setting/setting.model";
import { BookingModel } from "../booking/booking.model";
import { IRatingCategories, IReview, IReviewStats } from "./review.interface";
import { ReviewModel } from "./review.model";

const createReview = async (
    userId: string,
    payload: {
        booking: string;
        listing: string;
        rating?: number;
        categories: IRatingCategories;
        comment: string;
        photos?: string[];
    },
    files?: Express.Multer.File[],
) => {
    const { booking: bookingId, listing: listingId, categories, comment } = payload;

    // 1. Verify listing exists
    const listingExists = await ListingModel.findOne({ _id: listingId, isDeleted: false });
    if (!listingExists) {
        throw new ApiError(httpStatus.NOT_FOUND, "Listing not found");
    }

    // 2. Verify booking exists
    const bookingExists = await BookingModel.findById(bookingId);
    if (!bookingExists) {
        throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
    }

    // 3. Prevent host from reviewing their own listing
    if (listingExists.host.toString() === userId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Hosts cannot review their own listing");
    }

    // 4. Check if user already reviewed this booking
    const existingReview = await ReviewModel.findOne({
        booking: bookingId,
        isDeleted: false,
    });

    if (existingReview) {
        throw new ApiError(httpStatus.CONFLICT, "You have already submitted a review for this listing");
    }

    // 4. Compute overall rating if not explicitly supplied
    let overallRating = payload.rating;
    if (!overallRating && categories) {
        const sum = Number(categories.cleanliness || 0) + Number(categories.safety || 0) + Number(categories.facilities || 0) + Number(categories.privacy || 0) + Number(categories.serviceQuality || 0);
        overallRating = Math.round((sum / 5) * 10) / 10;
    }

    // 5. Process photo uploads if any
    let photoUrls: string[] = payload.photos || [];
    if (files && Array.isArray(files) && files.length > 0) {
        const uploadedUrls = files.map((file) => file.filename);
        photoUrls = [...photoUrls, ...uploadedUrls];
    }

    // 6. Check global settings for autoApproveReviews
    const settings = await SettingModel.findOne();
    const isApproved = settings ? settings.autoApproveReviews : false;

    const review = await ReviewModel.create({
        user: userId,
        booking: bookingId,
        listing: listingId,
        rating: overallRating,
        categories,
        comment,
        photos: photoUrls,
        isApproved,
    });

    // 7. Update isReviewed on the associated booking if provided
    if (bookingId) {
        await BookingModel.findByIdAndUpdate(bookingId, { isReviewed: true });
    }

    // Update aggregated rating and total count on listing if approved
    if (isApproved) {
        await updateListingReviewMetrics(listingId);
    }

    const populatedReview = await review.populate([{ path: "user", select: "name email profileImage role" }]);
    return populatedReview;
};

const getListingReviews = async (listingId: string, query: any) => {
    const { page = 1, limit = 10 } = query;

    const listingExists = await ListingModel.findOne({ _id: listingId, isDeleted: false });
    if (!listingExists) {
        throw new ApiError(httpStatus.NOT_FOUND, "Listing not found");
    }

    const filter = { listing: listingId, isApproved: true, isDeleted: false };
    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total, stats] = await Promise.all([
        ReviewModel.find(filter).populate("user", "name email profileImage").populate("reply.user", "name email profileImage role").sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
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
            .populate("reply.user", "name email profileImage role")
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
    const review = await ReviewModel.findOne({ _id: id, isDeleted: false }).populate("user", "name email profileImage").populate("reply.user", "name email profileImage role").populate({
        path: "listing",
        select: "name description photos location facilityType host",
    });

    if (!review) {
        throw new ApiError(httpStatus.NOT_FOUND, "Review not found");
    }

    return review;
};

const updateReview = async (id: string, userId: string, payload: Partial<IReview>, files?: Express.Multer.File[]) => {
    const existingReview = await ReviewModel.findOne({ _id: id, isDeleted: false });

    if (!existingReview) {
        throw new ApiError(httpStatus.NOT_FOUND, "Review not found");
    }

    if (existingReview.user.toString() !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, "You can only update your own review");
    }

    const updatedData: any = {};
    if (payload.categories) {
        updatedData.categories = {
            ...existingReview.categories,
            ...payload.categories,
        };
        const cat = updatedData.categories;
        updatedData.rating = Math.round(((Number(cat.cleanliness) + Number(cat.safety) + Number(cat.facilities) + Number(cat.privacy) + Number(cat.serviceQuality)) / 5) * 10) / 10;
    } else if (payload.rating !== undefined) {
        updatedData.rating = payload.rating;
    }

    if (payload.comment !== undefined) updatedData.comment = payload.comment;

    // Photos update handling
    let currentPhotos = existingReview.photos || [];

    const removeTargets: string[] = [...(Array.isArray((payload as any).removeImages) ? (payload as any).removeImages : []), ...(Array.isArray((payload as any).removePhotos) ? (payload as any).removePhotos : [])];

    if (removeTargets.length > 0) {
        currentPhotos = currentPhotos.filter((photo: string) => !removeTargets.includes(photo));

        // Delete photo files from disk
        for (const photoPath of removeTargets) {
            try {
                const fullPath = path.join(process.cwd(), photoPath.startsWith("/") ? photoPath.slice(1) : photoPath);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            } catch (err) {
                // Ignore file unlink error if missing
            }
        }
    }

    if (payload.photos && Array.isArray(payload.photos)) {
        currentPhotos = payload.photos;
    }
    if (files && Array.isArray(files) && files.length > 0) {
        const uploadedUrls = files.map((file) => file.filename);
        currentPhotos = [...currentPhotos, ...uploadedUrls].slice(0, 5);
    }
    updatedData.photos = currentPhotos;

    const updatedReview = await ReviewModel.findByIdAndUpdate(id, { $set: updatedData }, { returnDocument: "after", runValidators: true }).populate("user", "name email profileImage").populate("reply.user", "name email profileImage role");

    // Recalculate and update listing metrics if rating changed
    if (existingReview.listing) {
        await updateListingReviewMetrics(existingReview.listing.toString());
    }

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

    // Delete review photo files if any
    if (existingReview.photos && existingReview.photos.length > 0) {
        for (const photoPath of existingReview.photos) {
            try {
                const fullPath = path.join(process.cwd(), photoPath.startsWith("/") ? photoPath.slice(1) : photoPath);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            } catch (err) {
                // Ignore photo delete error if missing
            }
        }
    }

    existingReview.isDeleted = true;
    await existingReview.save();

    if (existingReview.booking) {
        await BookingModel.findByIdAndUpdate(existingReview.booking, { isReviewed: false });
    }

    // Recalculate and update listing metrics on deletion
    if (existingReview.listing) {
        await updateListingReviewMetrics(existingReview.listing.toString());
    }

    return { message: "Review deleted successfully" };
};

const addReply = async (reviewId: string, userId: string, comment: string, userRole?: string) => {
    const review = await ReviewModel.findOne({ _id: reviewId, isDeleted: false });
    if (!review) {
        throw new ApiError(httpStatus.NOT_FOUND, "Review not found");
    }

    const listing = await ListingModel.findOne({ _id: review.listing, isDeleted: false });
    if (!listing) {
        throw new ApiError(httpStatus.NOT_FOUND, "Associated listing not found");
    }

    if (listing.host.toString() !== userId && userRole !== "SUPER_ADMIN") {
        throw new ApiError(httpStatus.FORBIDDEN, "Only the host of this listing can reply to this review");
    }

    if (review.reply) {
        throw new ApiError(httpStatus.CONFLICT, "A reply has already been posted for this review");
    }

    review.reply = {
        user: new mongoose.Types.ObjectId(userId),
        comment,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    await review.save();

    const updatedReview = await ReviewModel.findById(reviewId).populate("user", "name email profileImage").populate("reply.user", "name email profileImage role");

    return updatedReview;
};

const updateReply = async (reviewId: string, userId: string, comment: string, userRole?: string) => {
    const review = await ReviewModel.findOne({ _id: reviewId, isDeleted: false });
    if (!review) {
        throw new ApiError(httpStatus.NOT_FOUND, "Review not found");
    }

    if (!review.reply) {
        throw new ApiError(httpStatus.NOT_FOUND, "No reply exists for this review");
    }

    if (review.reply.user.toString() !== userId && userRole !== "SUPER_ADMIN") {
        throw new ApiError(httpStatus.FORBIDDEN, "You can only edit your own reply");
    }

    review.reply.comment = comment;
    review.reply.updatedAt = new Date();

    await review.save();

    const updatedReview = await ReviewModel.findById(reviewId).populate("user", "name email profileImage").populate("reply.user", "name email profileImage role");

    return updatedReview;
};

const deleteReply = async (reviewId: string, userId: string, userRole?: string) => {
    const review = await ReviewModel.findOne({ _id: reviewId, isDeleted: false });
    if (!review) {
        throw new ApiError(httpStatus.NOT_FOUND, "Review not found");
    }

    if (!review.reply) {
        throw new ApiError(httpStatus.NOT_FOUND, "No reply exists for this review");
    }

    if (review.reply.user.toString() !== userId && userRole !== "SUPER_ADMIN") {
        throw new ApiError(httpStatus.FORBIDDEN, "You can only delete your own reply");
    }

    review.reply = undefined;
    await review.save();

    return { message: "Reply deleted successfully" };
};

const updateListingReviewMetrics = async (listingId: string) => {
    const stats = await ReviewModel.aggregate([
        {
            $match: {
                listing: new mongoose.Types.ObjectId(listingId),
                isApproved: true,
                isDeleted: false,
            },
        },
        {
            $group: {
                _id: "$listing",
                averageRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 },
            },
        },
    ]);

    const averageRating = stats.length > 0 ? Math.round((stats[0].averageRating || 0) * 10) / 10 : 0;
    const totalReviews = stats.length > 0 ? stats[0].totalReviews || 0 : 0;

    const listing = await ListingModel.findByIdAndUpdate(listingId, {
        $set: { averageRating, totalReviews },
    });

    // Also update host's aggregated overall rating across all their listings
    if (listing && listing.host) {
        const hostListings = await ListingModel.find({ host: listing.host, isDeleted: false });
        const hostListingIds = hostListings.map((l) => l._id);

        const hostStats = await ReviewModel.aggregate([
            {
                $match: {
                    listing: { $in: hostListingIds },
                    isApproved: true,
                    isDeleted: false,
                },
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                    totalReviews: { $sum: 1 },
                },
            },
        ]);

        const hostAvgRating = hostStats.length > 0 ? Math.round((hostStats[0].averageRating || 0) * 10) / 10 : 0;
        const hostTotalReviews = hostStats.length > 0 ? hostStats[0].totalReviews || 0 : 0;

        await UserModel.findByIdAndUpdate(listing.host, {
            $set: { averageRating: hostAvgRating, totalReviews: hostTotalReviews },
        });
    }
};

const getListingReviewStats = async (listingId: string): Promise<IReviewStats> => {
    const statsResult = await ReviewModel.aggregate([
        {
            $match: {
                listing: new mongoose.Types.ObjectId(listingId),
                isApproved: true,
                isDeleted: false,
            },
        },
        {
            $group: {
                _id: "$listing",
                averageRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 },
                avgCleanliness: { $avg: "$categories.cleanliness" },
                avgSafety: { $avg: "$categories.safety" },
                avgFacilities: { $avg: "$categories.facilities" },
                avgPrivacy: { $avg: "$categories.privacy" },
                avgServiceQuality: { $avg: "$categories.serviceQuality" },
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
            categoryAverages: {
                cleanliness: 0,
                safety: 0,
                facilities: 0,
                privacy: 0,
                serviceQuality: 0,
            },
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
    }

    const stat = statsResult[0];
    const roundOneDecimal = (num: number) => Math.round((num || 0) * 10) / 10;

    return {
        averageRating: roundOneDecimal(stat.averageRating),
        totalReviews: stat.totalReviews,
        categoryAverages: {
            cleanliness: roundOneDecimal(stat.avgCleanliness),
            safety: roundOneDecimal(stat.avgSafety),
            facilities: roundOneDecimal(stat.avgFacilities),
            privacy: roundOneDecimal(stat.avgPrivacy),
            serviceQuality: roundOneDecimal(stat.avgServiceQuality),
        },
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
    addReply,
    updateReply,
    deleteReply,
    getListingReviewStats,
};
