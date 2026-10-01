import { Router } from "express";
import auth from "../../middlewares/auth";
import { reviewControllers } from "./review.controllers";

const router = Router();

// Public routes
router.get("/listing/:listingId", reviewControllers.getListingReviews);
router.get("/listing/:listingId/stats", reviewControllers.getListingReviewStats);
router.get("/:id", reviewControllers.getSingleReview);

// Authenticated user routes
router.post("/", auth, reviewControllers.createReview);
router.get("/my-reviews", auth, reviewControllers.getUserReviews);
router.patch("/:id", auth, reviewControllers.updateReview);
router.delete("/:id", auth, reviewControllers.deleteReview);

export const reviewRoutes = router;
