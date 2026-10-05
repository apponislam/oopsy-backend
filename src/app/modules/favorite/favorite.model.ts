import mongoose, { Schema } from "mongoose";
import { IFavorite } from "./favorite.interface";

const favoriteSchema = new Schema<IFavorite>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
        },
        listing: {
            type: Schema.Types.ObjectId,
            ref: "Listing",
            required: [true, "Listing is required"],
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// Ensure a user can only favorite a specific listing once
favoriteSchema.index({ user: 1, listing: 1 }, { unique: true });

export const FavoriteModel = mongoose.model<IFavorite>("Favorite", favoriteSchema);
