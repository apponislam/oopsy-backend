import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import config from "../../config";
import { Request, Response } from "express";
import { authServices } from "./auth.services";
import { getSocket } from "../../socket/socket";

const register = catchAsync(async (req: Request, res: Response) => {
    // Extract uploaded files (profileImage, businessDocument, governmentIssuedId)
    const userFiles: any = {};
    if (req.files && !Array.isArray(req.files)) {
        const filesMap = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (filesMap["profileImage"]?.[0]) userFiles.profileImage = filesMap["profileImage"][0].filename;
        if (filesMap["businessDocument"]?.[0]) userFiles.businessDocument = filesMap["businessDocument"][0].filename;
        if (filesMap["governmentIssuedId"]?.[0]) userFiles.governmentIssuedId = filesMap["governmentIssuedId"][0].filename;
    } else if (req.file) {
        userFiles.profileImage = req.file.filename;
    }

    // Parse the body field if it's a string
    let data: any = {};
    if (req.body.body && typeof req.body.body === "string") {
        data = JSON.parse(req.body.body);
    }

    let addressData = data.address || req.body.address;
    if (typeof addressData === "string") {
        try {
            addressData = JSON.parse(addressData);
        } catch {}
    }

    let businessDetailsData = data.businessDetails || req.body.businessDetails;
    if (typeof businessDetailsData === "string") {
        try {
            businessDetailsData = JSON.parse(businessDetailsData);
        } catch {}
    }

    // Parse JSON fields
    const userData: any = {
        name: data.name || req.body.name,
        email: data.email || req.body.email,
        password: data.password || req.body.password,
        role: data.role || req.body.role,
        phone: data.phone || req.body.phone,
        website: data.website || req.body.website,
        ...(userFiles.profileImage && { profileImage: userFiles.profileImage }),
        ...(userFiles.businessDocument && { businessDocument: userFiles.businessDocument }),
        ...(userFiles.governmentIssuedId && { governmentIssuedId: userFiles.governmentIssuedId }),
        ...(addressData && { address: addressData }),
        ...(businessDetailsData && { businessDetails: businessDetailsData }),
    };

    // Basic validation
    if (!userData.name || !userData.email || !userData.password) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Name, email, and password are required");
    }

    // Location is already parsed
    if (data.location) userData.location = data.location;

    const result = await authServices.registerUser(userData);

    // Previous code:
    // res.cookie("refreshToken", result.refreshToken, {
    //     httpOnly: true,
    //     secure: config.node_env === "production",
    //     sameSite: "strict",
    //     maxAge: 30 * 24 * 60 * 60 * 1000,
    // });

    // New code:
    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: config.node_env === "production" ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "User registered successfully",
        data: {
            user: result.user,
            accessToken: result.accessToken,
        },
    });
});

const login = catchAsync(async (req: Request, res: Response) => {
    const result = await authServices.loginUser(req.body);

    // Previous code:
    // res.cookie("refreshToken", result.refreshToken, {
    //     httpOnly: true,
    //     secure: config.node_env === "production",
    //     sameSite: "strict",
    //     maxAge: 30 * 24 * 60 * 60 * 1000,
    // });

    // New code:
    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: config.node_env === "production" ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Login successful",
        data: {
            user: result.user,
            accessToken: result.accessToken,
        },
    });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
    const token = req.query.token as string | undefined;
    const otp = req.query.otp as string | undefined;
    const email = req.query.email as string;

    if (!email) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Email is required");
    }

    const result = await authServices.verifyEmail(email, token, otp);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const resendVerificationEmail = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    await authServices.resendVerificationEmail(email);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Verification email resent successfully",
        data: null,
    });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
    const user = await authServices.getUserById(req.user._id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User retrieved successfully",
        data: user,
    });
});

const logout = catchAsync(async (req: Request, res: Response) => {
    // Previous code:
    // res.clearCookie("refreshToken");

    // New code:
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: config.node_env === "production" ? "none" : "lax",
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Logout successful",
        data: null,
    });
});

const refreshAccessToken = catchAsync(async (req: Request, res: Response) => {
    // Previous code:
    // const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    // New code:
    const refreshToken = req?.cookies?.refreshToken || req?.body?.refreshToken || (req?.headers?.["x-refresh-token"] as string);

    if (!refreshToken) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token is missing or expired. Please log in again.");
    }

    const result = await authServices.refreshAccessToken(refreshToken);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Token refreshed successfully",
        data: result,
    });
});

const requestPasswordReset = catchAsync(async (req: Request, res: Response) => {
    await authServices.requestPasswordReset(req.body.email);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Password reset OTP sent to email",
        data: null,
    });
});

const verifyOtp = catchAsync(async (req: Request, res: Response) => {
    const result = await authServices.verifyOtp(req.body.email, req.body.otp);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "OTP verified successfully",
        data: { token: result.token },
    });
});

const resendOtp = catchAsync(async (req: Request, res: Response) => {
    await authServices.resendOtp(req.body.email);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "OTP resent successfully",
        data: null,
    });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const token = (req.query.token as string) || req.body.token;
    await authServices.resetPassword(token, req.body.newPassword);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Password reset successful",
        data: null,
    });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
    // Extract uploaded files (profileImage, businessDocument, governmentIssuedId)
    const userFiles: any = {};
    if (req.files && !Array.isArray(req.files)) {
        const filesMap = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (filesMap["profileImage"]?.[0]) userFiles.profileImage = filesMap["profileImage"][0].filename;
        if (filesMap["businessDocument"]?.[0]) userFiles.businessDocument = filesMap["businessDocument"][0].filename;
        if (filesMap["governmentIssuedId"]?.[0]) userFiles.governmentIssuedId = filesMap["governmentIssuedId"][0].filename;
    } else if (req.file) {
        userFiles.profileImage = req.file.filename;
    }

    let data: any = {};
    if (req.body.body && typeof req.body.body === "string") {
        try {
            data = JSON.parse(req.body.body);
        } catch (error) {
            try {
                const bodyStr = `{${req.body.body}}`;
                data = JSON.parse(bodyStr);
            } catch (innerError) {
                throw new ApiError(httpStatus.BAD_REQUEST, "Invalid JSON in request body");
            }
        }
    } else {
        data = req.body;
    }

    // Parse address if it comes as a JSON string
    let parsedAddress = data.address;
    if (typeof parsedAddress === "string") {
        try {
            parsedAddress = JSON.parse(parsedAddress);
        } catch {
            // Keep original if not JSON
        }
    }

    // Parse businessDetails if it comes as a JSON string
    let parsedBusinessDetails = data.businessDetails;
    if (typeof parsedBusinessDetails === "string") {
        try {
            parsedBusinessDetails = JSON.parse(parsedBusinessDetails);
        } catch {
            // Keep original if not JSON
        }
    }

    // Construct update data based on the provided fields
    const updateData: any = {
        ...(data.name && { name: data.name }),
        ...(data.phone && { phone: data.phone }),
        ...(data.website && { website: data.website }),
        ...(userFiles.profileImage && { profileImage: userFiles.profileImage }),
        ...(userFiles.businessDocument && { businessDocument: userFiles.businessDocument }),
        ...(userFiles.governmentIssuedId && { governmentIssuedId: userFiles.governmentIssuedId }),
        ...(parsedAddress && { address: parsedAddress }),
        ...(parsedBusinessDetails && { businessDetails: parsedBusinessDetails }),
    };

    const updatedUser = await authServices.updateProfile(req.user._id, updateData);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
    });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
    await authServices.changePassword(req.user._id, req.body.currentPassword, req.body.newPassword);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Password changed successfully",
        data: null,
    });
});

const deleteAccount = catchAsync(async (req: Request, res: Response) => {
    const { password } = req.body;
    if (!password) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Password is required to delete account");
    }

    await authServices.deleteAccount(req.user._id, password);

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: config.node_env === "production" ? "none" : "lax",
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Account deleted successfully",
        data: null,
    });
});

const updateEmail = catchAsync(async (req: Request, res: Response) => {
    await authServices.updateEmail(req.user._id, req.body.email, req.body.password);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Email update requested. Please verify new email.",
        data: null,
    });
});

const resendEmailUpdate = catchAsync(async (req: Request, res: Response) => {
    await authServices.resendEmailUpdate(req.user._id, req.body.password);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Email verification resent successfully",
        data: null,
    });
});

const verifyNewEmail = catchAsync(async (req: Request, res: Response) => {
    const { token, email } = req.query;
    await authServices.verifyNewEmail(token as string, email as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "New email verified successfully",
        data: null,
    });
});

const setUserPassword = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const { password } = req.body;
    await authServices.setUserPassword(userId, password);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Password set successfully",
        data: null,
    });
});

const updateUserBySuperAdmin = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;

    let updateData: any = {};
    if (req.body.body && typeof req.body.body === "string") {
        updateData = JSON.parse(req.body.body);
    } else {
        updateData = { ...req.body };
    }

    if (req.file) {
        updateData.profileImage = `/uploads/profile-images/${req.file.filename}`;
    }

    if (typeof updateData.address === "string") {
        try {
            updateData.address = JSON.parse(updateData.address);
        } catch {
            // Keep original if not JSON
        }
    }

    const result = await authServices.updateUserBySuperAdmin(userId as string, updateData);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User updated successfully",
        data: result,
    });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const user = await authServices.getUserById(userId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User retrieved successfully",
        data: user,
    });
});

export const authControllers = {
    register,
    login,
    verifyEmail,
    resendVerificationEmail,
    getMe,
    getUserById,
    logout,
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
