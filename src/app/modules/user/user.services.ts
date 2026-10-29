import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { UserModel } from "../auth/auth.model";

const getAllUsers = async (query: Record<string, any>) => {
    const {
        searchTerm,
        role,
        isActive,
        isApproved,
        isEmailVerified,
        isDeleted,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
    } = query;

    const filter: Record<string, any> = {};

    // Soft delete filter (default to non-deleted users unless requested)
    if (isDeleted !== undefined) {
        filter.isDeleted = isDeleted === "true" || isDeleted === true;
    } else {
        filter.isDeleted = false;
    }

    // Role filter
    if (role && role !== "ALL") {
        filter.role = role;
    }

    // Status filters
    if (isActive !== undefined && isActive !== "ALL") {
        filter.isActive = isActive === "true" || isActive === true;
    }

    if (isApproved !== undefined && isApproved !== "ALL") {
        filter.isApproved = isApproved === "true" || isApproved === true;
    }

    if (isEmailVerified !== undefined && isEmailVerified !== "ALL") {
        filter.isEmailVerified = isEmailVerified === "true" || isEmailVerified === true;
    }

    // Date range filter
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
            filter.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filter.createdAt.$lte = end;
        }
    }

    // Search term across name, email, phone, businessName, referralCode
    if (searchTerm) {
        filter.$or = [
            { name: { $regex: searchTerm, $options: "i" } },
            { email: { $regex: searchTerm, $options: "i" } },
            { phone: { $regex: searchTerm, $options: "i" } },
            { referralCode: { $regex: searchTerm, $options: "i" } },
            { "businessDetails.businessName": { $regex: searchTerm, $options: "i" } },
        ];
    }

    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.max(1, Number(limit));
    const skip = (pageNumber - 1) * limitNumber;

    const sortCriteria: Record<string, 1 | -1> = {
        [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const [users, total, stats] = await Promise.all([
        UserModel.find(filter)
            .select("-password -resetPasswordOtp -resetPasswordToken -verificationToken -verificationCode")
            .populate("referredBy", "name email phone profileImage")
            .populate("approvedBy", "name email")
            .sort(sortCriteria)
            .skip(skip)
            .limit(limitNumber),
        UserModel.countDocuments(filter),
        UserModel.aggregate([
            { $match: { isDeleted: false } },
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    totalClients: { $sum: { $cond: [{ $eq: ["$role", "CLIENT"] }, 1, 0] } },
                    totalProviders: { $sum: { $cond: [{ $eq: ["$role", "PROVIDER"] }, 1, 0] } },
                    pendingApprovals: {
                        $sum: {
                            $cond: [{ $and: [{ $eq: ["$role", "PROVIDER"] }, { $eq: ["$isApproved", false] }] }, 1, 0],
                        },
                    },
                    activeUsers: { $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] } },
                },
            },
        ]),
    ]);

    const totalPages = Math.ceil(total / limitNumber);

    return {
        meta: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1,
        },
        stats: stats[0] || {
            totalUsers: total,
            totalClients: 0,
            totalProviders: 0,
            pendingApprovals: 0,
            activeUsers: 0,
        },
        data: users,
    };
};

const getSingleUser = async (userId: string) => {
    const user = await UserModel.findById(userId)
        .select("-password -resetPasswordOtp -resetPasswordToken -verificationToken -verificationCode")
        .populate("referredBy", "name email phone profileImage")
        .populate("approvedBy", "name email");

    if (!user || user.isDeleted) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found or deleted");
    }

    return user;
};

const updateUserStatus = async (
    userId: string,
    payload: { isActive?: boolean; isApproved?: boolean; isEmailVerified?: boolean },
    adminId?: string
) => {
    const user = await UserModel.findById(userId);

    if (!user || user.isDeleted) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found or deleted");
    }

    if (payload.isActive !== undefined) {
        user.isActive = payload.isActive;
    }

    if (payload.isApproved !== undefined) {
        user.isApproved = payload.isApproved;
        if (payload.isApproved && adminId) {
            user.approvedBy = adminId as any;
        }
    }

    if (payload.isEmailVerified !== undefined) {
        user.isEmailVerified = payload.isEmailVerified;
    }

    await user.save();

    return UserModel.findById(userId).select("-password -resetPasswordOtp -resetPasswordToken");
};

const deleteUser = async (userId: string) => {
    const user = await UserModel.findById(userId);

    if (!user || user.isDeleted) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found or already deleted");
    }

    user.isDeleted = true;
    user.isActive = false;
    await user.save();

    return { message: "User deleted successfully" };
};

export const userServices = {
    getAllUsers,
    getSingleUser,
    updateUserStatus,
    deleteUser,
};
