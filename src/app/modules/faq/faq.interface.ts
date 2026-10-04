import { Types } from "mongoose";

export interface IFaq {
    _id?: Types.ObjectId;
    question: string;
    answer: string;
    category?: string;
    isActive?: boolean;
    isDeleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
