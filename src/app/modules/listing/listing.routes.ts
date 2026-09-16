import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { uploadListingPhotos } from "../../middlewares/multer";
import { listingControllers } from "./listing.controllers";

const router = Router();

// Public routes
router.get("/", listingControllers.getAllListings);

// Admin routes (SUPER_ADMIN)
router.get("/admin", auth, authorize(["SUPER_ADMIN"]), listingControllers.getAdminListings);

router.get("/:id", listingControllers.getSingleListing);

// Host routes (Authenticated users)
router.get("/my/listings", auth, listingControllers.getHostListings);
router.post("/", auth, uploadListingPhotos, listingControllers.createListing);
router.patch("/:id/status", auth, listingControllers.toggleListingStatus);
router.patch("/:id", auth, uploadListingPhotos, listingControllers.updateListing);
router.delete("/:id", auth, listingControllers.deleteListing);

export const listingRoutes = router;
