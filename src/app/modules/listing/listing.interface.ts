import { Types } from "mongoose";

export interface IPricingTier {
    durationMinutes: number;
    price: number;
}

export interface IListingLocation {
    address: string;
    floorUnit?: string;
    accessInstructions?: string;
    coordinates?: [number, number];
}

export interface IListing {
    _id?: Types.ObjectId;
    host: Types.ObjectId;
    facilityType: Types.ObjectId; // References Category model
    name: string;
    description: string;
    capacity: number;
    smokingPolicy: string;
    amenities: string[];
    customTags?: string[];
    location: IListingLocation;
    photos: string[];
    pricingTiers: IPricingTier[];
    isActive?: boolean;
    isApproved?: boolean;
    approvedBy?: Types.ObjectId;
    isDeleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
