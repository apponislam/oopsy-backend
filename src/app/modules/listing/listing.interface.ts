import { Types } from "mongoose";

export interface IPricingTier {
    durationMinutes: number;
    price: number;
}

export interface IListingLocation {
    address: string;
    floorUnit?: string;
    accessInstructions?: string;
    location?: {
        type: "Point";
        coordinates: [number, number]; // [longitude, latitude]
    };
}

export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface IAvailabilitySlot {
    day: DayOfWeek;
    startTime?: string; // "08:00"
    endTime?: string;   // "18:00"
    isAvailable: boolean;
}

export interface IListing {
    _id?: Types.ObjectId;
    host: Types.ObjectId;
    facilityType: Types.ObjectId;
    name: string;
    description: string;
    capacity: number;
    smokingPolicy: string;
    amenities: string[];
    customTags?: string[];
    location: IListingLocation;
    photos: string[];
    pricingTiers: IPricingTier[];
    availableDays?: IAvailabilitySlot[];
    averageRating?: number;
    totalReviews?: number;
    isActive?: boolean;
    isApproved?: boolean;
    approvedBy?: Types.ObjectId;
    isDeleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
