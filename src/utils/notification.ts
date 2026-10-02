import { getMessaging } from "firebase-admin/messaging";
import { isFirebaseInitialized } from "./firebase";
import { notificationServices } from "../app/modules/notification/notification.services";
import { UserModel } from "../app/modules/auth/auth.model";

/**
 * Send push notification to multiple FCM tokens AND save to database
 */
const sendPushNotification = async (tokens: string[], title: string, body: string, userId?: string, type?: string, data?: Record<string, string>) => {
    // 1. Send FCM push notification via Firebase if initialized
    if (isFirebaseInitialized && tokens && Array.isArray(tokens) && tokens.length > 0) {
        const message = {
            notification: {
                title,
                body,
            },
            data: data || {},
            apns: {
                payload: {
                    aps: {
                        sound: "default",
                        badge: 1,
                    },
                },
            },
            tokens: tokens,
        };

        try {
            const response = await getMessaging().sendEachForMulticast(message);
            console.log(`[NOTIFICATION] FCM Result: ${response.successCount} sent, ${response.failureCount} failed.`);

            // Clean up invalid/failed FCM tokens if userId is provided
            if (response.failureCount > 0 && userId) {
                const failedTokens: string[] = [];
                response.responses.forEach((resp: any, idx: number) => {
                    if (!resp.success) {
                        failedTokens.push(tokens[idx]);
                    }
                });

                if (failedTokens.length > 0) {
                    await UserModel.findByIdAndUpdate(userId, {
                        $pull: { fcmTokens: { $in: failedTokens } },
                    });
                }
            }
        } catch (error) {
            console.error("[NOTIFICATION] Error sending FCM message:", error);
        }
    }

    // 2. Save notification to Database if userId is provided
    if (userId) {
        try {
            await notificationServices.sendNotification({
                receiver: userId,
                title,
                message: body,
                type: type || "GENERAL",
                data,
            });
        } catch (error) {
            console.error("[NOTIFICATION] Error saving notification to DB:", error);
        }
    }
};

/**
 * Send push notification to a specific user by userId
 */
const sendPushToUser = async (userId: string, title: string, body: string, type?: string, data?: Record<string, string>) => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) return;

        const tokens: string[] = (user as any).fcmTokens || [];
        await sendPushNotification(tokens, title, body, userId, type, data);
    } catch (error) {
        console.error("[NOTIFICATION] Error in sendPushToUser:", error);
    }
};

export const NotificationUtils = {
    sendPushNotification,
    sendPushToUser,
};

export default NotificationUtils;
