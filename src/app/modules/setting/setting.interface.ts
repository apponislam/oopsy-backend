import { Types } from "mongoose";

export interface ISetting {
    _id?: Types.ObjectId;

    // Configuration
    supportEmail: string;
    defaultCommissionPercentage: number;
    maxAdvanceBookingDays: number;

    // Notifications
    emailNotifications: boolean;
    pushNotifications: boolean;

    // Platform Controls
    allowNewRegistrations: boolean;
    autoApproveReviews: boolean;
    maintenanceMode: boolean;

    createdAt?: Date;
    updatedAt?: Date;
}
