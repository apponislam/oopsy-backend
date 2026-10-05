import { Types } from "mongoose";

export interface IFavorite {
    _id?: Types.ObjectId;
    user: Types.ObjectId;
    listing: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IFavoriteFilterOptions {
    searchTerm?: string;
    page?: number;
    limit?: number;
}
