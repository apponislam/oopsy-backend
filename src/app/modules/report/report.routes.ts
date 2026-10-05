import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { reportControllers } from "./report.controllers";

const router = Router();

// Authenticated users — submit a report
router.post("/", auth, reportControllers.createReport);

// Super Admin Only — manage & view reports
router.get("/", auth, authorize(["SUPER_ADMIN"]), reportControllers.getAllReports);
router.get("/:id", auth, authorize(["SUPER_ADMIN"]), reportControllers.getSingleReport);
router.patch("/:id/status", auth, authorize(["SUPER_ADMIN"]), reportControllers.updateReportStatus);

export const reportRoutes = router;
