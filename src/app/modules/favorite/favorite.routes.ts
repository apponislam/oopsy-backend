import { Router } from "express";
import auth from "../../middlewares/auth";
import { favoriteControllers } from "./favorite.controllers";

const router = Router();

// Authenticated user routes
router.post("/toggle", auth, favoriteControllers.toggleFavorite);
router.get("/", auth, favoriteControllers.getMyFavorites);

export const favoriteRoutes = router;
