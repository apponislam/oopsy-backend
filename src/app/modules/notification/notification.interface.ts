import { Types } from "mongoose";

export enum NotificationType {
    REVIEW_ADDED = "REVIEW_ADDED",
    REVIEW_REPLIED = "REVIEW_REPLIED",
    BOOKING_CREATED = "BOOKING_CREATED",
    BOOKING_STATUS_CHANGED = "BOOKING_STATUS_CHANGED",
    SYSTEM_ALERT = "SYSTEM_ALERT",
    GENERAL = "GENERAL",
}

export interface INotification {
    _id?: Types.ObjectId;
    receiver: Types.ObjectId;
    sender?: Types.ObjectId;
    type: NotificationType | string;
    title: string;
    message: string;
    data?: Record<string, any>;
    isRead?: boolean;
    isDeleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
