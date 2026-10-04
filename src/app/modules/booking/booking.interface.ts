import { Types } from "mongoose";

export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export interface IBooking {
    _id?: Types.ObjectId;
    bookingId: string; // e.g. OP-24851
    user: Types.ObjectId; // Customer making the booking
    host: Types.ObjectId; // Listing host
    listing: Types.ObjectId; // Booked facility listing
    date: Date; // e.g. May 20, 2024
    time: string; // e.g. "10:00 AM"
    durationMinutes: number; // e.g. 30 Minutes
    price: number; // e.g. £6
    currency?: string; // default GBP
    status: BookingStatus;
    isPaid?: boolean;
    stripePaymentIntentId?: string;
    cancelledBy?: Types.ObjectId;
    cancelReason?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IBookingFilterOptions {
    searchTerm?: string;
    status?: BookingStatus | "ALL";
    page?: number;
    limit?: number;
}
