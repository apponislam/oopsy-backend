import mongoose, { Schema } from "mongoose";
import { IListing } from "./listing.interface";

const PricingTierSchema = new Schema(
    {
        durationMinutes: {
            type: Number,
            required: [true, "Duration in minutes is required"],
            min: [1, "Duration must be at least 1 minute"],
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price cannot be negative"],
        },
    },
    { _id: false },
);

const ListingLocationSchema = new Schema(
    {
        address: {
            type: String,
            required: [true, "Street address is required"],
            trim: true,
        },
        floorUnit: {
            type: String,
            trim: true,
        },
        accessInstructions: {
            type: String,
            trim: true,
        },
        coordinates: {
            type: [Number], // [lng, lat]
        },
    },
    { _id: false },
);

const ListingSchema = new Schema<IListing>(
    {
        host: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Host is required"],
        },
        facilityType: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: [true, "Facility type (category) is required"],
        },
        name: {
            type: String,
            required: [true, "Listing name is required"],
            trim: true,
        },
        description: {
            type: String,
            required: [true, "Description is required"],
            maxLength: [400, "Description cannot exceed 400 characters"],
            trim: true,
        },
        capacity: {
            type: Number,
            required: [true, "Capacity is required"],
            min: [1, "Capacity must be at least 1"],
        },
        smokingPolicy: {
            type: String,
            default: "Non-Smoking",
        },
        amenities: {
            type: [String],
            default: [],
        },
        customTags: {
            type: [String],
            default: [],
        },
        location: {
            type: ListingLocationSchema,
            required: [true, "Location details are required"],
        },
        photos: {
            type: [String],
            validate: [
                (val: string[]) => val.length <= 10,
                "Cannot upload more than 10 photos",
            ],
            default: [],
        },
        pricingTiers: {
            type: [PricingTierSchema],
            required: [true, "At least one pricing tier is required"],
            validate: [
                (val: any[]) => val.length > 0,
                "At least one pricing tier is required",
            ],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isApproved: {
            type: Boolean,
            default: true,
        },
        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

/*
|--------------------------------------------------------------------------
| Indexing Strategy (Production Optimization)
|--------------------------------------------------------------------------
*/
ListingSchema.index({ host: 1, isDeleted: 1 });
ListingSchema.index({ facilityType: 1, isActive: 1, isDeleted: 1 });
ListingSchema.index({ isActive: 1, isDeleted: 1, createdAt: -1 });

export const ListingModel = mongoose.model<IListing>("Listing", ListingSchema);
