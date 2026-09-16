import express from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { publicRoutes } from "../modules/public/public.routes";
import { categoryRoutes } from "../modules/category/category.routes";
import { settingRoutes } from "../modules/setting/setting.routes";

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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
