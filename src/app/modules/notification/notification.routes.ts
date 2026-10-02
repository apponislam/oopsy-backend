import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { notificationControllers } from "./notification.controllers";

const router = Router();

// Super Admin Broadcast Endpoint
router.post("/admin/send", auth, authorize(["SUPER_ADMIN"]), notificationControllers.sendAdminBroadcastNotification);

// Authenticated User Notification Routes
router.get("/", auth, notificationControllers.getUserNotifications);
router.patch("/mark-all-read", auth, notificationControllers.markAllAsRead);
router.patch("/:id/read", auth, notificationControllers.markAsRead);
router.delete("/clear-all", auth, notificationControllers.deleteAllNotifications);
router.delete("/:id", auth, notificationControllers.deleteNotification);

export const notificationRoutes = router;
