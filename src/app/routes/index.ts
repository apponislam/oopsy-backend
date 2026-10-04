import express from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { publicRoutes } from "../modules/public/public.routes";
import { categoryRoutes } from "../modules/category/category.routes";
import { settingRoutes } from "../modules/setting/setting.routes";
import { listingRoutes } from "../modules/listing/listing.routes";
import { reviewRoutes } from "../modules/review/review.routes";
import { notificationRoutes } from "../modules/notification/notification.routes";
import { TransactionRoutes } from "../modules/transaction/transaction.routes";
import { faqRoutes } from "../modules/faq/faq.routes";

const router = express.Router();

const moduleRoutes = [
    {
        path: "/auth",
        route: authRoutes,
    },
    {
        path: "/public",
        route: publicRoutes,
    },
    {
        path: "/categories",
        route: categoryRoutes,
    },
    {
        path: "/settings",
        route: settingRoutes,
    },
    {
        path: "/listings",
        route: listingRoutes,
    },
    {
        path: "/reviews",
        route: reviewRoutes,
    },
    {
        path: "/notifications",
        route: notificationRoutes,
    },
    {
        path: "/transactions",
        route: TransactionRoutes,
    },
    {
        path: "/faqs",
        route: faqRoutes,
    },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
