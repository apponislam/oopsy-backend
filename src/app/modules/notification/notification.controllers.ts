import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { notificationServices } from "./notification.services";

const sendAdminBroadcastNotification = catchAsync(async (req: Request, res: Response) => {
    const senderId = (req as any).user._id;
    const result = await notificationServices.sendAdminBroadcastNotification(senderId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: result,
    });
});

const getUserNotifications = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const result = await notificationServices.getUserNotifications(userId, req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Notifications retrieved successfully",
        data: result.data,
        meta: result.meta,
        stats: { unreadCount: result.unreadCount },
    });
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = (req as any).user._id;

    const result = await notificationServices.markAsRead(id, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Notification marked as read",
        data: result,
    });
});

const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;

    const result = await notificationServices.markAllAsRead(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const deleteNotification = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = (req as any).user._id;

    const result = await notificationServices.deleteNotification(id, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const deleteAllNotifications = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;

    const result = await notificationServices.deleteAllNotifications(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

export const notificationControllers = {
    sendAdminBroadcastNotification,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
};
