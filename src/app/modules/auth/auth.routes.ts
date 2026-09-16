import { Router } from "express";
import { authControllers } from "./auth.controllers";
import auth from "../../middlewares/auth";
import { uploadProfileImage } from "../../middlewares/multer";
import authorize from "../../middlewares/authorized";
const router = Router();

// Public routes
router.post("/register", uploadProfileImage, authControllers.register);
router.post("/login", authControllers.login);
router.get("/verify-email", authControllers.verifyEmail);
router.post("/resend-verification", authControllers.resendVerificationEmail);
router.post("/refresh-token", authControllers.refreshAccessToken);
router.post("/forgot-password", authControllers.requestPasswordReset);
router.post("/verify-otp", authControllers.verifyOtp);
router.post("/resend-otp", authControllers.resendOtp);
router.post("/reset-password", authControllers.resetPassword);
// Protected routes (require auth)
router.get("/me", auth, authControllers.getMe);
router.post("/logout", auth, authControllers.logout);
router.patch("/profile", auth, uploadProfileImage, authControllers.updateProfile);
router.post("/change-password", auth, authControllers.changePassword);
router.delete("/delete-account", auth, authControllers.deleteAccount);
router.post("/update-email", auth, authControllers.updateEmail);
router.get("/verify-new-email", authControllers.verifyNewEmail);
router.post("/resend-email-update", auth, authControllers.resendEmailUpdate);

// Admin only routes
router.get("/users/:userId", auth, authorize(["SUPER_ADMIN", "ADMIN"]), authControllers.getUserById);
router.post("/set-password/:userId", auth, authControllers.setUserPassword);
router.patch("/users/:userId", auth, authorize(["SUPER_ADMIN"]), uploadProfileImage, authControllers.updateUserBySuperAdmin);

export const authRoutes = router;
