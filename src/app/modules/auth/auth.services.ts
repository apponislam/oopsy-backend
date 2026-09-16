import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { jwtHelper } from "../../../utils/jwtHelper";
import config from "../../config";
import { UserModel } from "./auth.model";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendOtpEmail, sendVerificationEmail, sendWelcomeEmail, sendEmailUpdateVerification, sendAdminCreatedEmail, sendPasswordChangedEmail } from "../../../utils/emailTemplates";
import mongoose, { Types } from "mongoose";

const registerUser = async (data: any) => {
    // Check existing user
    const existing = await UserModel.findOne({ email: data.email });
    if (existing) throw new ApiError(httpStatus.BAD_REQUEST, "Email already in use");

    // Remove balance and percentage if sent in payload to prevent manual setting
    if (data.balance !== undefined) {
        delete data.balance;
    }
    if (data.percentage !== undefined) {
        delete data.percentage;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, Number(config.bcrypt_salt_rounds));

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create user
    const userData = {
        ...data,
        password: hashedPassword,
        isActive: true,
        isEmailVerified: false,
        balance: 0,
        verificationToken,
        verificationCode,
        verificationExpiry,
    };

    if (userData.role === "TEACHER") {
        userData.teacherApprovalStatus = "PENDING";
    }

    const createdUser = await UserModel.create(userData);

    const verificationUrl = `${config.client_url}/verify-email?token=${verificationToken}&email=${createdUser.email}`;
    sendVerificationEmail(createdUser.email as string, createdUser.name as string, verificationUrl, verificationCode);
    sendWelcomeEmail(createdUser.email as string, createdUser.name as string);

    // Generate tokens
    const jwtPayload = {
        _id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
    };

    const accessToken = jwtHelper.generateToken(jwtPayload, config.jwt_access_secret as string, config.jwt_access_expire as string);
    const refreshToken = jwtHelper.generateToken(jwtPayload, config.jwt_refresh_secret as string, config.jwt_refresh_expire as string);

    const userObject = createdUser.toObject();
    const { password: pwd, verificationToken: vToken, verificationExpiry: vExpiry, verificationCode: vCode, ...userWithoutSensitive } = userObject;

    return { user: userWithoutSensitive, accessToken, refreshToken };
};

const loginUser = async (data: { email: string; password: string }) => {
    // Find user
    const user = await UserModel.findOne({ email: data.email });
    if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, "User with this email was not found");

    // Check password
    const isPasswordValid = await bcrypt.compare(data.password, user.password as string);
    if (!isPasswordValid) throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");

    // Check if active
    if (!user.isActive) throw new ApiError(httpStatus.FORBIDDEN, "Your account has been deactivated. Please contact support.");

    // Update last login
    await UserModel.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

    // Generate tokens
    const jwtPayload = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
    };

    const accessToken = jwtHelper.generateToken(jwtPayload, config.jwt_access_secret as string, config.jwt_access_expire as string);
    const refreshToken = jwtHelper.generateToken(jwtPayload, config.jwt_refresh_secret as string, config.jwt_refresh_expire as string);

    const { password, ...userWithoutPassword } = user.toObject();

    return { user: userWithoutPassword, accessToken, refreshToken };
};

const verifyEmail = async (email: string, token?: string, otp?: string) => {
    const user = await UserModel.findOne({ email });

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User with this email was not found.");
    }

    if (user.isEmailVerified) {
        return { message: "Email is already verified." };
    }

    if (!user.verificationExpiry || user.verificationExpiry <= new Date()) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Verification period has expired.");
    }

    if (token) {
        if (user.verificationToken !== token) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Verification token is invalid.");
        }
    } else if (otp) {
        if (user.verificationCode !== otp) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Verification code (OTP) is invalid.");
        }
    } else {
        throw new ApiError(httpStatus.BAD_REQUEST, "Token or OTP is required for verification.");
    }

    // Mark email verified
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationCode = undefined;
    user.verificationExpiry = undefined;
    await user.save();

    return { message: "Email verified successfully" };
};

const resendVerificationEmail = async (email: string) => {
    const user = await UserModel.findOne({ email });
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User with this email was not found.");

    if (user.isEmailVerified) {
        throw new ApiError(httpStatus.BAD_REQUEST, "This email address is already verified.");
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken = verificationToken;
    user.verificationCode = verificationCode;
    user.verificationExpiry = verificationExpiry;
    await user.save();

    // Send verification email
    const verificationUrl = `${config.client_url}/verify-email?token=${verificationToken}&email=${user.email}`;
    sendVerificationEmail(user.email as string, user.name as string, verificationUrl, verificationCode);

    return { message: "Verification email sent successfully." };
};

const getUserById = async (userId: string) => {
    const user = await UserModel.findById(userId).select("-password");
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "Requested user was not found.");
    return user;
};

const refreshAccessToken = async (refreshToken: string) => {
    if (!refreshToken) throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token is required.");

    try {
        const decoded = jwtHelper.verifyToken(refreshToken, config.jwt_refresh_secret as string);

        const user = await UserModel.findById(decoded._id).select("-password");
        if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, "User associated with this token was not found.");

        const jwtPayload = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        const accessToken = jwtHelper.generateToken(jwtPayload, config.jwt_access_secret as string, config.jwt_access_expire as string);

        return { user, accessToken };
    } catch (error) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired refresh token.");
    }
};

const requestPasswordReset = async (email: string) => {
    const user = await UserModel.findOne({ email });
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User with this email was not found.");

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    sendOtpEmail(email, otp, user.name as string);

    return { message: "OTP sent" };
};

const verifyOtp = async (email: string, otp: string) => {
    const user = await UserModel.findOne({ email });
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User with this email was not found.");

    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpiry) {
        throw new ApiError(httpStatus.BAD_REQUEST, "No password reset OTP request found for this account.");
    }

    if (user.resetPasswordOtpExpiry < new Date()) {
        throw new ApiError(httpStatus.BAD_REQUEST, "OTP has expired. Please request a new one.");
    }

    if (user.resetPasswordOtp !== otp) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP provided.");
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Clear OTP
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpiry = undefined;

    await user.save();

    return { token: resetToken };
};

const resendOtp = async (email: string) => {
    const user = await UserModel.findOne({ email });
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User with this email was not found.");

    // Generate new OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = otpExpiry;
    await user.save();

    // Send email
    sendOtpEmail(email, otp, user.name as string);

    return { message: "OTP resent successfully." };
};

const resetPassword = async (token: string, newPassword: string) => {
    const user = await UserModel.findOne({
        resetPasswordToken: token,
        resetPasswordTokenExpiry: { $gt: new Date() },
    });

    if (!user) throw new ApiError(httpStatus.BAD_REQUEST, "Invalid or expired password reset token.");

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiry = undefined;

    await user.save();
};

const updateProfile = async (userId: string, data: any) => {
    // Prevent manual balance and percentage update
    if (data.balance !== undefined) {
        delete data.balance;
    }
    if (data.percentage !== undefined) {
        delete data.percentage;
    }

    const user = await UserModel.findByIdAndUpdate(userId, { $set: data }, { returnDocument: "after", runValidators: true }).select("-password");

    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "Requested user was not found.");
    return user;
};

const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "Requested user was not found.");

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password as string);
    if (!isPasswordValid) throw new ApiError(httpStatus.BAD_REQUEST, "Current password is incorrect.");

    const hashedPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));
    user.password = hashedPassword;
    await user.save();
};

const deleteAccount = async (userId: string, password: string) => {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "Requested user was not found.");

    if (user.role === "SUPER_ADMIN") {
        throw new ApiError(httpStatus.FORBIDDEN, "Super Admin accounts cannot be deleted.");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password as string);
    if (!isPasswordValid) throw new ApiError(httpStatus.BAD_REQUEST, "Password is incorrect.");

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userObjectId = user._id;

        // // 1. Seller cleanup
        // // await SellerGroupModel.deleteMany({ sellerId: userObjectId }, { session });
        // // await CampaignSellerModel.deleteMany({ sellerId: userObjectId }, { session });

        // // 2. Admin cleanup (if Admin created groups/campaigns/invitations)
        // if (user.role === "ADMIN") {
        //     // Find groups created by this admin
        //     const adminGroups = await GroupModel.find({ createdBy: userObjectId }).select("_id").session(session).lean();
        //     const groupIds = adminGroups.map((g) => g._id);

        //     // Find campaigns created by this admin or belonging to their groups
        //     const adminCampaigns = await CampaignModel.find({
        //         $or: [{ createdBy: userObjectId }, { groupId: { $in: groupIds } }],
        //     })
        //         .select("_id")
        //         .session(session)
        //         .lean();
        //     const campaignIds = adminCampaigns.map((c) => c._id);

        //     // Clean up invitations sent by admin or for admin groups
        //     const { InvitationModel } = await import("../invitation/invitation.model");
        //     await InvitationModel.deleteMany(
        //         {
        //             $or: [{ inviterId: userObjectId }, { groupId: { $in: groupIds } }],
        //         },
        //         { session },
        //     );

        //     // Clean up group & campaign seller mappings, and campaign products for admin's groups and campaigns
        //     if (groupIds.length > 0) {
        //         await SellerGroupModel.deleteMany({ groupId: { $in: groupIds } }, { session });
        //     }
        //     if (campaignIds.length > 0) {
        //         await CampaignSellerModel.deleteMany({ campaignId: { $in: campaignIds } }, { session });
        //         await CampaignProductModel.deleteMany({ campaignId: { $in: campaignIds } }, { session });
        //     }

        //     // Soft delete groups, campaigns, and campaign orders created by this admin
        //     await GroupModel.updateMany({ createdBy: userObjectId }, { $set: { isDeleted: true } }, { session });
        //     await CampaignModel.updateMany({ $or: [{ createdBy: userObjectId }, { groupId: { $in: groupIds } }] }, { $set: { isDeleted: true } }, { session });
        //     if (campaignIds.length > 0) {
        //         await OrderModel.deleteMany({ campaignId: { $in: campaignIds } }, { session });
        //     }
        // }

        // // 3. Directly delete orders associated with this user as a seller
        // await OrderModel.deleteMany({ memberId: userObjectId }, { session });

        // Delete user document completely so they can re-register with the same email/login credentials in the future
        await UserModel.findByIdAndDelete(userObjectId, { session });

        await session.commitTransaction();
        session.endSession();
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

const updateEmail = async (userId: string, newEmail: string, password: string) => {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "Requested user was not found.");

    const isPasswordValid = await bcrypt.compare(password, user.password as string);
    if (!isPasswordValid) throw new ApiError(httpStatus.BAD_REQUEST, "Password is incorrect.");

    const existingUser = await UserModel.findOne({ email: newEmail });
    if (existingUser) throw new ApiError(httpStatus.BAD_REQUEST, "This email address is already in use.");

    // Generate verification token for new email
    const verificationToken = crypto.randomBytes(32).toString("hex");

    user.pendingEmail = newEmail;
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await user.save();

    // Send verification email
    const verificationUrl = `${config.client_url}/verify-new-email?token=${verificationToken}&email=${newEmail}`;
    sendEmailUpdateVerification(newEmail, user.name as string, verificationUrl);
};

const resendEmailUpdate = async (userId: string, password: string) => {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "Requested user was not found.");

    if (!user.pendingEmail) {
        throw new ApiError(httpStatus.BAD_REQUEST, "No pending email update request found.");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password as string);
    if (!isPasswordValid) throw new ApiError(httpStatus.BAD_REQUEST, "Password is incorrect.");

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpiry = verificationExpiry;
    await user.save();

    // Send verification email
    const verificationUrl = `${config.client_url}/verify-new-email?token=${verificationToken}&email=${user.pendingEmail}`;
    sendEmailUpdateVerification(user.pendingEmail as string, user.name as string, verificationUrl);

    return { message: "Verification email resent successfully." };
};

const verifyNewEmail = async (token: string, email: string) => {
    const user = await UserModel.findOne({
        pendingEmail: email,
        emailVerificationToken: token,
        emailVerificationExpiry: { $gt: new Date() },
    });

    if (!user) throw new ApiError(httpStatus.BAD_REQUEST, "Invalid or expired email update verification token.");

    // Update email
    user.email = email;
    user.pendingEmail = undefined;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;

    await user.save();

    return { message: "New email verified successfully" };
};

const setUserPassword = async (userId: string, newPassword: string) => {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "Requested user was not found.");

    const hashedPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));
    user.password = hashedPassword;
    await user.save();
};

const updateUserBySuperAdmin = async (userId: string, data: any) => {
    let plainPassword = "";
    // If password is being updated, hash it
    if (data.password) {
        plainPassword = data.password;
        data.password = await bcrypt.hash(data.password, Number(config.bcrypt_salt_rounds));
    }

    const user = await UserModel.findByIdAndUpdate(userId, { $set: data }, { returnDocument: "after", runValidators: true }).select("-password");
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "Requested user was not found.");

    // If password was updated, send notification email
    if (plainPassword && user.email) {
        sendPasswordChangedEmail(user.email, user.name, plainPassword);
    }

    return user;
};

export const authServices = {
    registerUser,
    loginUser,
    verifyEmail,
    resendVerificationEmail,
    getUserById,
    refreshAccessToken,
    requestPasswordReset,
    verifyOtp,
    resendOtp,
    resetPassword,
    updateProfile,
    changePassword,
    deleteAccount,
    updateEmail,
    resendEmailUpdate,
    verifyNewEmail,
    setUserPassword,
    updateUserBySuperAdmin,
};
