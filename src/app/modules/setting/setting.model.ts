import mongoose, { Schema } from "mongoose";
import { ISetting } from "./setting.interface";

const SettingSchema = new Schema<ISetting>(
    {
        // Configuration
        supportEmail: {
            type: String,
            default: "support@oopsy.app",
            trim: true,
            lowercase: true,
        },
        defaultCommissionPercentage: {
            type: Number,
            default: 10,
            min: 0,
            max: 100,
        },
        maxAdvanceBookingDays: {
            type: Number,
            default: 30,
            min: 1,
        },

        // Notifications
        emailNotifications: {
            type: Boolean,
            default: true,
        },
        pushNotifications: {
            type: Boolean,
            default: true,
        },

        // Platform Controls
        allowNewRegistrations: {
            type: Boolean,
            default: true,
        },
        autoApproveReviews: {
            type: Boolean,
            default: false,
        },
        maintenanceMode: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

export const SettingModel = mongoose.models.Setting || mongoose.model<ISetting>("Setting", SettingSchema);
