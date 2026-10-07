import express from "express";
import {
  register,
  verifyEmail,
  login,
  logout,
  forgotPassword,
  resetPassword,
} from "./auth.controller.js";
import { validateRequest } from "../../shared/middleware/validate.request.js";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema, tokenQuerySchema } from "./auth.validator.js";
const router = express.Router();

router.post("/register", validateRequest(registerSchema), register);
router.post("/verify-email", validateRequest(tokenQuerySchema, "query"), verifyEmail);
router.post("/login", validateRequest(loginSchema) ,login);
router.post("/logout", logout);
router.post("/forgot-password", validateRequest(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validateRequest(resetPasswordSchema), validateRequest(tokenQuerySchema, "query"), resetPassword);

export default router;
