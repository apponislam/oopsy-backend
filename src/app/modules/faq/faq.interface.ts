import { Types } from "mongoose";

export interface IFaq {
    _id?: Types.ObjectId;
    question: string;
    answer: string;
    createdAt?: Date;
    updatedAt?: Date;
}
