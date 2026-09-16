import httpStatus from "http-status";
import path from "path";
import fs from "fs";
import ApiError from "../../../errors/ApiError";
import { IListing } from "./listing.interface";
import { ListingModel } from "./listing.model";

const createListing = async (hostId: string, payload: Partial<IListing>, files?: Express.Multer.File[]) => {
    let photoUrls: string[] = payload.photos || [];
    if (files && Array.isArray(files) && files.length > 0) {
        const uploadedUrls = files.map((file) => file.filename);
        photoUrls = [...photoUrls, ...uploadedUrls];
    }

    const listingData = {
        ...payload,
        host: hostId,
        photos: photoUrls,
    };

    const listing = await ListingModel.create(listingData);
    return listing;
};

const getAllListings = async (query: any) => {
    const { facilityType, capacity, minPrice, maxPrice, search, page = 1, limit = 10 } = query;

    const filter: any = { isDeleted: false, isActive: true };

    if (facilityType) {
        filter.facilityType = facilityType;
    }

    if (capacity) {
        filter.capacity = { $gte: Number(capacity) };
    }

    if (minPrice || maxPrice) {
        filter["pricingTiers.price"] = {};
        if (minPrice) filter["pricingTiers.price"].$gte = Number(minPrice);
        if (maxPrice) filter["pricingTiers.price"].$lte = Number(maxPrice);
    }

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { "location.address": { $regex: search, $options: "i" } },
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [listings, total] = await Promise.all([
        ListingModel.find(filter)
            .populate("host", "name email phone profileImage")
            .populate("facilityType", "name slug image")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        ListingModel.countDocuments(filter),
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
        data: listings,
    };
};

const getAdminListings = async (query: any) => {
    const { facilityType, capacity, isActive, isApproved, search, page = 1, limit = 10 } = query;

    const filter: any = { isDeleted: false };

    if (facilityType) filter.facilityType = facilityType;
    if (capacity) filter.capacity = { $gte: Number(capacity) };
    if (isActive !== undefined && isActive !== "") {
        filter.isActive = isActive === "true" || isActive === true;
    }
    if (isApproved !== undefined && isApproved !== "") {
        filter.isApproved = isApproved === "true" || isApproved === true;
    }

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { "location.address": { $regex: search, $options: "i" } },
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [listings, total] = await Promise.all([
        ListingModel.find(filter)
            .populate("host", "name email phone profileImage")
            .populate("facilityType", "name slug image")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        ListingModel.countDocuments(filter),
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
        data: listings,
    };
};

const getHostListings = async (hostId: string) => {
    const listings = await ListingModel.find({ host: hostId, isDeleted: false })
        .populate("facilityType", "name slug image")
        .sort({ createdAt: -1 });
    return listings;
};

const getSingleListing = async (id: string) => {
    const listing = await ListingModel.findOne({ _id: id, isDeleted: false })
        .populate("host", "name email phone profileImage businessDetails")
        .populate("facilityType", "name slug image");

    if (!listing) {
        throw new ApiError(httpStatus.NOT_FOUND, "Listing not found");
    }

    return listing;
};

const updateListing = async (
    id: string,
    hostId: string,
    payload: any,
    files?: Express.Multer.File[],
) => {
    const existingListing = await ListingModel.findOne({ _id: id, isDeleted: false });

    if (!existingListing) {
        throw new ApiError(httpStatus.NOT_FOUND, "Listing not found");
    }

    if (existingListing.host.toString() !== hostId) {
        throw new ApiError(httpStatus.FORBIDDEN, "You can only update your own listing");
    }

    let currentPhotos = existingListing.photos || [];

    // 1. Remove photos specified in removePhotos array
    if (payload.removePhotos && Array.isArray(payload.removePhotos) && payload.removePhotos.length > 0) {
        const removePhotos: string[] = payload.removePhotos;
        currentPhotos = currentPhotos.filter((photo) => !removePhotos.includes(photo));

        // Delete photo files from disk
        for (const photoPath of removePhotos) {
            try {
                const fullPath = path.join(process.cwd(), photoPath.startsWith("/") ? photoPath.slice(1) : photoPath);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            } catch (err) {
                // Ignore file unlink error if missing
            }
        }
        delete payload.removePhotos;
    }

    // 2. Add new uploaded photo files
    if (files && Array.isArray(files) && files.length > 0) {
        const uploadedUrls = files.map((file) => file.filename);
        currentPhotos = [...currentPhotos, ...uploadedUrls].slice(0, 10);
    }

    // If photos was passed in payload explicitly, use that base + uploaded
    if (payload.photos && Array.isArray(payload.photos)) {
        currentPhotos = payload.photos;
        if (files && Array.isArray(files) && files.length > 0) {
            const uploadedUrls = files.map((file) => file.filename);
            currentPhotos = [...currentPhotos, ...uploadedUrls].slice(0, 10);
        }
    }

    payload.photos = currentPhotos;

    const updatedListing = await ListingModel.findByIdAndUpdate(
        id,
        { $set: payload },
        { returnDocument: "after", runValidators: true },
    );

    return updatedListing;
};

const toggleListingStatus = async (id: string, hostId: string) => {
    const listing = await ListingModel.findOne({ _id: id, isDeleted: false });

    if (!listing) {
        throw new ApiError(httpStatus.NOT_FOUND, "Listing not found");
    }

    if (listing.host.toString() !== hostId) {
        throw new ApiError(httpStatus.FORBIDDEN, "You can only change status of your own listing");
    }

    listing.isActive = !listing.isActive;
    await listing.save();

    return listing;
};

const deleteListing = async (id: string, hostId: string) => {
    const listing = await ListingModel.findOne({ _id: id, isDeleted: false });

    if (!listing) {
        throw new ApiError(httpStatus.NOT_FOUND, "Listing not found");
    }

    if (listing.host.toString() !== hostId) {
        throw new ApiError(httpStatus.FORBIDDEN, "You can only delete your own listing");
    }

    listing.isDeleted = true;
    await listing.save();

    return { message: "Listing deleted successfully" };
};

export const listingServices = {
    createListing,
    getAllListings,
    getAdminListings,
    getHostListings,
    getSingleListing,
    updateListing,
    toggleListingStatus,
    deleteListing,
};
