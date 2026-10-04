import { Router } from "express";
import auth from "../../middlewares/auth";
import { bookingControllers } from "./booking.controllers";

const router = Router();

// All booking routes require authentication
router.post("/", auth, bookingControllers.createBooking);
router.get("/my-bookings", auth, bookingControllers.getMyBookings);
router.get("/:id", auth, bookingControllers.getSingleBooking);
router.patch("/:id/cancel", auth, bookingControllers.cancelBooking);

export const bookingRoutes = router;
