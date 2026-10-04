import httpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { ListingModel } from "../listing/listing.model";
import { IBooking, IBookingFilterOptions } from "./booking.interface";
import { BookingModel } from "./booking.model";

const createBooking = async (
    userId: string,
    payload: {
        listing: string;
        date: string;
        time: string;
        durationMinutes: number;
    },
) => {
    const { listing: listingId, date, time, durationMinutes } = payload;

    // 1. Verify listing exists and is active/approved
    const listing = await ListingModel.findOne({
        _id: listingId,
        isActive: true,
        isApproved: true,
        isDeleted: false,
    });

    if (!listing) {
        throw new ApiError(httpStatus.NOT_FOUND, "Listing not found or is currently unavailable");
    }

    // 2. Prevent host from booking their own listing
    if (listing.host.toString() === userId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Hosts cannot book their own listing");
    }

    // 3. Find matching pricing tier for requested duration
    const matchingTier = listing.pricingTiers.find((tier) => tier.durationMinutes === Number(durationMinutes));
    if (!matchingTier) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Invalid duration. Available durations for this listing are: ${listing.pricingTiers.map((t) => `${t.durationMinutes} mins`).join(", ")}`,
        );
    }

    const price = matchingTier.price;

    // 4. Create Booking
    const booking = await BookingModel.create({
        user: userId,
        host: listing.host,
        listing: listingId,
        date: new Date(date),
        time,
        durationMinutes: Number(durationMinutes),
        price,
        status: "CONFIRMED",
        isPaid: false,
    });

    const populatedBooking = await booking.populate([
        { path: "user", select: "name email phone profileImage" },
        { path: "host", select: "name email phone profileImage" },
        { path: "listing", select: "name location photos pricingTiers capacity facilityType" },
    ]);

    return populatedBooking;
};

const getMyBookings = async (userId: string, filters: IBookingFilterOptions) => {
    const { searchTerm, status, page = 1, limit = 10 } = filters;
    const userObjId = new Types.ObjectId(userId);

    const query: any = {
        $or: [{ user: userObjId }, { host: userObjId }],
    };

    if (status && status !== "ALL") {
        query.status = status;
    }

    if (searchTerm) {
        query.$or = [
            { bookingId: { $regex: searchTerm, $options: "i" } },
            { time: { $regex: searchTerm, $options: "i" } },
        ];
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const bookings = await BookingModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .populate("user", "name email phone profileImage")
        .populate("host", "name email phone profileImage")
        .populate("listing", "name location photos pricingTiers facilityType");

    const total = await BookingModel.countDocuments(query);
    const totalPages = Math.ceil(total / limitNumber);

    return {
        meta: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1,
        },
        data: bookings,
    };
};

const getSingleBooking = async (id: string, userId: string) => {
    const booking = await BookingModel.findById(id)
        .populate("user", "name email phone profileImage")
        .populate("host", "name email phone profileImage")
        .populate({
            path: "listing",
            select: "name location photos pricingTiers facilityType host description capacity",
            populate: { path: "facilityType", select: "name slug image" },
        });

    if (!booking) {
        throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
    }

    const userObjId = new Types.ObjectId(userId);
    if (!booking.user.equals(userObjId) && !booking.host.equals(userObjId)) {
        throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to view this booking");
    }

    return booking;
};

const cancelBooking = async (id: string, userId: string, reason?: string) => {
    const booking = await BookingModel.findById(id);
    if (!booking) {
        throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
    }

    const userObjId = new Types.ObjectId(userId);
    if (!booking.user.equals(userObjId) && !booking.host.equals(userObjId)) {
        throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to cancel this booking");
    }

    if (booking.status === "CANCELLED") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Booking is already cancelled");
    }

    booking.status = "CANCELLED";
    booking.cancelledBy = userObjId;
    if (reason) {
        booking.cancelReason = reason;
    }
    await booking.save();

    return booking;
};

export const bookingServices = {
    createBooking,
    getMyBookings,
    getSingleBooking,
    cancelBooking,
};
