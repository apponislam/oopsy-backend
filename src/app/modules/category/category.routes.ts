import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { uploadCategoryImage } from "../../middlewares/multer";
import validateRequest from "../../middlewares/validateRequest";
import { categoryControllers } from "./category.controllers";
import { createCategorySchema, updateCategorySchema } from "./category.validations";

const router = Router();

// Public routes
router.get("/", categoryControllers.getAllCategories);

// Protected routes (SUPER_ADMIN)
router.get("/admin", auth, authorize(["SUPER_ADMIN"]), categoryControllers.getAdminCategories);
router.get("/:id", categoryControllers.getSingleCategory);
router.post("/", auth, authorize(["SUPER_ADMIN"]), uploadCategoryImage, validateRequest(createCategorySchema), categoryControllers.createCategory);
router.patch("/:id/status", auth, authorize(["SUPER_ADMIN"]), categoryControllers.toggleCategoryStatus);
router.patch("/:id", auth, authorize(["SUPER_ADMIN"]), uploadCategoryImage, validateRequest(updateCategorySchema), categoryControllers.updateCategory);
router.delete("/:id", auth, authorize(["SUPER_ADMIN"]), categoryControllers.deleteCategory);

export const categoryRoutes = router;
