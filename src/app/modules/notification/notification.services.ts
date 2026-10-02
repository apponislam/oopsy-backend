import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import NotificationUtils from "../../../utils/notification";
import { UserModel } from "../auth/auth.model";
import { sendToUsers } from "../../socket/socket";
import { NotificationModel } from "./notification.model";

const sendNotification = async (payload: {
    receiver: string;
    sender?: string;
    type?: string;
    title: string;
    message: string;
    data?: Record<string, any>;
}) => {
    const notification = await NotificationModel.create(payload);

    const populatedNotification = await notification.populate([
        { path: "sender", select: "name email profileImage role" },
        { path: "receiver", select: "name email profileImage role" },
    ]);

    // Emit real-time notification via Socket.io
    try {
        sendToUsers([payload.receiver], "new_notification", populatedNotification);
    } catch (err) {
        // Suppress socket emission error if socket not active
    }

    return populatedNotification;
};

const sendAdminBroadcastNotification = async (
    senderId: string,
    payload: {
        target: "CLIENT" | "PROVIDER" | "ALL" | "SELECTED";
        targetUserIds?: string[];
        title: string;
        message: string;
        type?: string;
        data?: Record<string, any>;
    },
) => {
    const { target, targetUserIds, title, message, type = "SYSTEM_ALERT", data } = payload;

    let targetUsers: any[] = [];

    if (target === "SELECTED" && targetUserIds && targetUserIds.length > 0) {
        targetUsers = await UserModel.find({ _id: { $in: targetUserIds } }).select("_id fcmTokens");
    } else if (target === "CLIENT") {
        targetUsers = await UserModel.find({ role: "CLIENT" }).select("_id fcmTokens");
    } else if (target === "PROVIDER") {
        targetUsers = await UserModel.find({ role: "PROVIDER" }).select("_id fcmTokens");
    } else if (target === "ALL") {
        targetUsers = await UserModel.find({ role: { $in: ["CLIENT", "PROVIDER"] } }).select("_id fcmTokens");
    }

    if (targetUsers.length === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, "No target users found for notification broadcast");
    }

    // 1. Prepare bulk DB notifications
    const notificationDocs = targetUsers.map((user) => ({
        receiver: user._id,
        sender: senderId,
        type,
        title,
        message,
        data: data || {},
    }));

    await NotificationModel.insertMany(notificationDocs);

    // 2. Real-time Socket dispatch to all target user rooms
    const receiverIds = targetUsers.map((u) => u._id.toString());
    try {
        sendToUsers(receiverIds, "new_notification", {
            sender: senderId,
            type,
            title,
            message,
            data: data || {},
            createdAt: new Date(),
        });
    } catch (err) {
        // Suppress socket error
    }

    // 3. FCM Push Notifications (if FCM tokens present)
    try {
        const allTokens: string[] = targetUsers.flatMap((u) => u.fcmTokens || []).filter(Boolean);
        if (allTokens.length > 0) {
            await NotificationUtils.sendPushNotification(allTokens, title, message, undefined, type, data);
        }
    } catch (err) {
        // Suppress FCM error
    }

    return {
        recipientCount: targetUsers.length,
        message: `Broadcast notification successfully sent to ${targetUsers.length} user(s)`,
    };
};

const getUserNotifications = async (userId: string, query: any) => {
    const { page = 1, limit = 10, isRead } = query;

    const filter: any = { receiver: userId, isDeleted: false };
    if (isRead !== undefined && isRead !== "") {
        filter.isRead = isRead === "true" || isRead === true;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total, unreadCount] = await Promise.all([
        NotificationModel.find(filter)
            .populate("sender", "name email profileImage role")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        NotificationModel.countDocuments(filter),
        NotificationModel.countDocuments({ receiver: userId, isRead: false, isDeleted: false }),
    ]);

    const totalPages = Math.ceil(total / Number(limit));
    const pageNumber = Number(page);

    return {
        meta: {
            page: pageNumber,
            limit: Number(limit),
            total,
            totalPages,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1,
        },
        unreadCount,
        data: notifications,
    };
};

const markAsRead = async (id: string, userId: string) => {
    const notification = await NotificationModel.findOne({ _id: id, receiver: userId, isDeleted: false });

    if (!notification) {
        throw new ApiError(httpStatus.NOT_FOUND, "Notification not found");
    }

    notification.isRead = true;
    await notification.save();

    return notification;
};

const markAllAsRead = async (userId: string) => {
    await NotificationModel.updateMany(
        { receiver: userId, isRead: false, isDeleted: false },
        { $set: { isRead: true } },
    );

    return { message: "All notifications marked as read" };
};

const deleteNotification = async (id: string, userId: string) => {
    const notification = await NotificationModel.findOne({ _id: id, receiver: userId, isDeleted: false });

    if (!notification) {
        throw new ApiError(httpStatus.NOT_FOUND, "Notification not found");
    }

    notification.isDeleted = true;
    await notification.save();

    return { message: "Notification deleted successfully" };
};

const deleteAllNotifications = async (userId: string) => {
    await NotificationModel.updateMany(
        { receiver: userId, isDeleted: false },
        { $set: { isDeleted: true } },
    );

    return { message: "All notifications cleared successfully" };
};

export const notificationServices = {
    sendNotification,
    sendAdminBroadcastNotification,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
};
