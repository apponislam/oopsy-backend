import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { ListingModel } from "../listing/listing.model";
import { IFavoriteFilterOptions } from "./favorite.interface";
import { FavoriteModel } from "./favorite.model";

const toggleFavorite = async (userId: string, listingId: string) => {
    // 1. Verify listing exists and is active/not deleted
    const listing = await ListingModel.findOne({
        _id: listingId,
        isActive: true,
        isDeleted: false,
    });

    if (!listing) {
        throw new ApiError(httpStatus.NOT_FOUND, "Listing not found or unavailable");
    }

    const userObjId = new Types.ObjectId(userId);
    const listingObjId = new Types.ObjectId(listingId);

    // 2. Check if already favorited
    const existingFavorite = await FavoriteModel.findOne({
        user: userObjId,
        listing: listingObjId,
    });

    if (existingFavorite) {
        await FavoriteModel.findByIdAndDelete(existingFavorite._id);
        return {
            isFavorited: false,
            message: "Removed from favorites",
        };
    } else {
        const newFavorite = await FavoriteModel.create({
            user: userObjId,
            listing: listingObjId,
        });

        return {
            isFavorited: true,
            message: "Added to favorites",
            favorite: newFavorite,
        };
    }
};

const getMyFavorites = async (userId: string, filters: IFavoriteFilterOptions) => {
    const { searchTerm, page = 1, limit = 10 } = filters;
    const userObjId = new Types.ObjectId(userId);

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const pipeline: any[] = [
        { $match: { user: userObjId } },
        {
            $lookup: {
                from: "listings",
                localField: "listing",
                foreignField: "_id",
                as: "listing",
            },
        },
        { $unwind: "$listing" },
        { $match: { "listing.isDeleted": false, "listing.isActive": true } },
    ];

    if (searchTerm) {
        pipeline.push({
            $match: {
                $or: [
                    { "listing.name": { $regex: searchTerm, $options: "i" } },
                    { "listing.description": { $regex: searchTerm, $options: "i" } },
                ],
            },
        });
    }

    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await FavoriteModel.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limitNumber);

    pipeline.push(
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limitNumber },
    );

    const favorites = await FavoriteModel.aggregate(pipeline);

    // Populate category / host inside listing if needed
    await FavoriteModel.populate(favorites, [
        { path: "listing.facilityType", select: "name slug image" },
        { path: "listing.host", select: "name email phone profileImage" },
    ]);

    return {
        meta: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1,
        },
        data: favorites,
    };
};

export const favoriteServices = {
    toggleFavorite,
    getMyFavorites,
};
