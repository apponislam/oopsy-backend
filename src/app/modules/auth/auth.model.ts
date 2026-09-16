import mongoose, { Schema } from "mongoose";
import { User } from "./auth.interface";

const UserSchema = new Schema<User>(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            lowercase: true,
            trim: true,
            match: [/.+\@.+\..+/, "Please enter a valid email address"],
        },

        password: {
            type: String,
            required: [true, "Password is required"],
        },

        role: {
            type: String,
            enum: ["SUPER_ADMIN", "CLIENT", "PROVIDER"],
            required: true,
        },

        phone: {
            type: String,
        },

        profileImage: {
            type: String,
        },

        address: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: String,
            location: {
                type: {
                    type: String,
                    enum: ["Point"],
                    default: "Point",
                },
                coordinates: {
                    type: [Number],
                },
            },
        },

        businessDetails: {
            businessName: String,
            businessType: String,
            companyRegistrationNumber: String,
            vatNumber: String,
        },

        website: String,
        businessDocument: String,
        governmentIssuedId: String,

        balance: {
            type: Number,
            default: 0,
            min: 0,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        isEmailVerified: {
            type: Boolean,
            default: false,
        },

        isApproved: {
            type: Boolean,
            default: false,
        },

        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },

        isDeleted: {
            type: Boolean,
            default: false,
        },

        lastLogin: {
            type: Date,
        },

        // Referral fields
        referralCode: {
            type: String,
            unique: true,
        },
        referredBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },

        resetPasswordOtp: String,
        resetPasswordOtpExpiry: Date,
        resetPasswordToken: String,
        resetPasswordTokenExpiry: Date,

        verificationToken: String,
        verificationCode: String,
        verificationExpiry: Date,

        pendingEmail: String,
        emailVerificationToken: String,
        emailVerificationExpiry: Date,
    },
    {
        timestamps: true,
        versionKey: false,

        toJSON: {
            transform(doc, ret: Partial<User>) {
                delete ret.password;
                delete ret.resetPasswordOtp;
                delete ret.resetPasswordOtpExpiry;
                delete ret.resetPasswordToken;
                delete ret.resetPasswordTokenExpiry;
                delete ret.verificationToken;
                delete ret.verificationCode;
                delete ret.verificationExpiry;
                delete ret.emailVerificationToken;
                delete ret.emailVerificationExpiry;
                delete ret.pendingEmail;
                return ret;
            },
        },
    },
);

UserSchema.pre("save", async function () {
    if (this.isNew && !this.referralCode) {
        // Generate a random 8-character uppercase alphanumeric code
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "";
        for (let i = 0; i < 8; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        this.referralCode = code;
    }
});

/*
|--------------------------------------------------------------------------
| Index Strategy (Production Safe)
|--------------------------------------------------------------------------
*/

// Authentication lookup
UserSchema.index({ email: 1 }, { unique: true });

UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ referredBy: 1 });

UserSchema.index({ isEmailVerified: 1 });
UserSchema.index({ "address.location": "2dsphere" });

// Token lookup indexes (important for auth flows)
UserSchema.index({ resetPasswordToken: 1 });
UserSchema.index({ verificationToken: 1 });
UserSchema.index({ emailVerificationToken: 1 });

// Activity tracking optimization
UserSchema.index({ lastLogin: -1 });

export const UserModel = mongoose.model<User>("User", UserSchema);
