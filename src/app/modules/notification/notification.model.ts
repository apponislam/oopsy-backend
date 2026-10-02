import mongoose, { Schema } from "mongoose";
import { INotification, NotificationType } from "./notification.interface";

const NotificationSchema = new Schema<INotification>(
    {
        receiver: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Receiver is required"],
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        type: {
            type: String,
            default: NotificationType.GENERAL,
        },
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
        },
        message: {
            type: String,
            required: [true, "Message is required"],
            trim: true,
        },
        data: {
            type: Schema.Types.Mixed,
            default: {},
        },
        isRead: {
            type: Boolean,
            default: false,
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
| Deep Indexing Strategy (Production Optimization)
|--------------------------------------------------------------------------
*/
NotificationSchema.index({ receiver: 1, isDeleted: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ receiver: 1, isDeleted: 1, createdAt: -1 });
NotificationSchema.index({ sender: 1, isDeleted: 1, createdAt: -1 });

export const NotificationModel =
    mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);
