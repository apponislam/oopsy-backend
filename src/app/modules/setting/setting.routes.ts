import { Router } from "express";
import { settingControllers } from "./setting.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";

const router = Router();

router.get("/", settingControllers.getSettings);
router.patch("/", auth, authorize(["SUPER_ADMIN"]), settingControllers.updateSettings);

export const settingRoutes = router;
