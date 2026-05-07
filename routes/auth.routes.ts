import { Router } from "express";
import { authRateLimiter } from "../middlewares/rateLimiter";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateRegister, validateLogin } from "../validators/auth.validator";
import * as authController from "../controllers/auth/auth.controller";

const router = Router();

router.post("/register", authRateLimiter, validateRegister, authController.register);
router.post("/login", authRateLimiter, validateLogin, authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authMiddleware, authController.logout);
router.get("/me", authMiddleware, authController.me);

export default router;
