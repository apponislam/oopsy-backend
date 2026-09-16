import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { uploadCategoryImage } from "../../middlewares/multer";
import { categoryControllers } from "./category.controllers";

const router = Router();

// Public routes
router.get("/", categoryControllers.getAllCategories);

// Protected routes (SUPER_ADMIN)
router.get("/admin", auth, authorize(["SUPER_ADMIN"]), categoryControllers.getAdminCategories);
router.get("/:id", categoryControllers.getSingleCategory);
router.post("/", auth, authorize(["SUPER_ADMIN"]), uploadCategoryImage, categoryControllers.createCategory);
router.patch("/:id/status", auth, authorize(["SUPER_ADMIN"]), categoryControllers.toggleCategoryStatus);
router.patch("/:id", auth, authorize(["SUPER_ADMIN"]), uploadCategoryImage, categoryControllers.updateCategory);
router.delete("/:id", auth, authorize(["SUPER_ADMIN"]), categoryControllers.deleteCategory);

export const categoryRoutes = router;
