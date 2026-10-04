import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { faqControllers } from "./faq.controllers";

const router = Router();

// Public Routes
router.get("/", faqControllers.getAllFaqs);
router.get("/:id", faqControllers.getSingleFaq);

// Super Admin Only Routes
router.post("/", auth, authorize(["SUPER_ADMIN"]), faqControllers.createFaq);
router.patch("/:id", auth, authorize(["SUPER_ADMIN"]), faqControllers.updateFaq);
router.delete("/:id", auth, authorize(["SUPER_ADMIN"]), faqControllers.deleteFaq);

export const faqRoutes = router;
