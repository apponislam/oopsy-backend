import { Router } from "express";
import auth from "../../middlewares/auth";
import { uploadListingPhotos } from "../../middlewares/multer";
import { listingControllers } from "./listing.controllers";

const router = Router();

// Public routes
router.get("/", listingControllers.getAllListings);
router.get("/:id", listingControllers.getSingleListing);

// Host routes (Authenticated users - PROVIDER & SUPER_ADMIN & CLIENT)
router.get("/my/listings", auth, listingControllers.getHostListings);
router.post("/", auth, uploadListingPhotos, listingControllers.createListing);
router.patch("/:id/status", auth, listingControllers.toggleListingStatus);
router.patch("/:id", auth, uploadListingPhotos, listingControllers.updateListing);
router.delete("/:id", auth, listingControllers.deleteListing);

export const listingRoutes = router;
