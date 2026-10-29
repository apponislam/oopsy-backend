import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { userServices } from "./user.services";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const result = await userServices.getAllUsers(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Users retrieved successfully",
        data: result.data,
        meta: result.meta,
        stats: result.stats,
    });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const result = await userServices.getSingleUser(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User retrieved successfully",
        data: result,
    });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const adminId = (req as any).user?._id;
    const result = await userServices.updateUserStatus(userId, req.body, adminId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User status updated successfully",
        data: result,
    });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const result = await userServices.deleteUser(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User deleted successfully",
        data: result,
    });
});

export const userControllers = {
    getAllUsers,
    getSingleUser,
    updateUserStatus,
    deleteUser,
};
