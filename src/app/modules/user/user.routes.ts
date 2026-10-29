import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { userControllers } from "./user.controllers";

const router = Router();

// All user management routes require Super Admin authorization
router.get("/", auth, authorize(["SUPER_ADMIN"]), userControllers.getAllUsers);
router.get("/:userId", auth, authorize(["SUPER_ADMIN"]), userControllers.getSingleUser);
router.patch("/:userId/status", auth, authorize(["SUPER_ADMIN"]), userControllers.updateUserStatus);
router.delete("/:userId", auth, authorize(["SUPER_ADMIN"]), userControllers.deleteUser);

export const userRoutes = router;
