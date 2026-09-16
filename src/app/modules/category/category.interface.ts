import { Types } from "mongoose";

export interface ICategory {
    _id?: Types.ObjectId;
    name: string;
    slug?: string;
    image?: string;
    isActive?: boolean;
    isDeleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
