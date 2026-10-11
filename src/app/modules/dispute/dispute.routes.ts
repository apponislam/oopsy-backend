import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { disputeControllers } from "./dispute.controllers";

const router = Router();

// Authenticated users: Create dispute & view own disputes
router.post("/", auth, disputeControllers.createDispute);
router.get("/my-disputes", auth, disputeControllers.getMyDisputes);
router.patch("/:id/cancel", auth, disputeControllers.cancelDispute);

// Admin-only: View all disputes & resolve
router.get("/", auth, authorize(["SUPER_ADMIN"]), disputeControllers.getAllDisputes);
router.patch("/:id/resolve", auth, authorize(["SUPER_ADMIN"]), disputeControllers.resolveDisputeByAdmin);

// View single dispute (Initiator, Defendant, or Super Admin)
router.get("/:id", auth, disputeControllers.getSingleDispute);

export const disputeRoutes = router;
