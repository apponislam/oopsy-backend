import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { publicControllers } from "./public.controllers";

const router = Router();

// Public routes — read policy by type
router.get("/:type", publicControllers.getPolicyByType);

// Admin-only routes — create/update policy
router.post("/", auth, authorize(["SUPER_ADMIN"]), publicControllers.upsertPolicy);

export const publicRoutes = router;
