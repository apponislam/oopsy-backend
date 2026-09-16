import { Types } from "mongoose";

export type UserRole = "SUPER_ADMIN" | "CLIENT" | "PROVIDER";

export interface User {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
    profileImage?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        locality?: string;
    };
    isActive: boolean;
    isEmailVerified: boolean;
    isApproved?: boolean;
    approvedBy?: Types.ObjectId;
    isDeleted: boolean;
    lastLogin?: Date;

    // Referral fields
    referralCode: string;
    referredBy?: Types.ObjectId;

    // Password reset fields
    resetPasswordOtp?: string;
    resetPasswordOtpExpiry?: Date;
    resetPasswordToken?: string;
    resetPasswordTokenExpiry?: Date;

    // Email verification fields
    verificationToken?: string;
    verificationCode?: string;
    verificationExpiry?: Date;

    // Email update fields
    pendingEmail?: string;
    emailVerificationToken?: string;
    emailVerificationExpiry?: Date;

    createdAt: Date;
    updatedAt: Date;
}
