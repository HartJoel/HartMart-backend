import express from "express";
import {
  confirmPayment,
  getPayment,
  getPayments,
  initializePayment,
  paystackWebhook,
} from "./payment.controller.js";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";
import { requireRole } from "../../shared/middleware/rbac.middleware.js";
import { validateRequest } from "../../shared/middleware/validate.request.js";
import { initializePaymentSchema, paystackWebhookSchema } from "./payment.validator.js";
import { validateIdParam } from "../../shared/middleware/validate.id-param.js";
import { paymentListQuerySchema } from "../../shared/validators/list-query.validator.js";

const router = express.Router();

// Paystack authenticates webhook requests with its signature, not our user auth.
router.post("/webhooks/paystack", validateRequest(paystackWebhookSchema), paystackWebhook);

router.use(authMiddleware);

router.post("/initialize", validateRequest(initializePaymentSchema), initializePayment);
router.post("/:paymentId/confirm", validateIdParam("paymentId"), confirmPayment);
router.get("/", validateRequest(paymentListQuerySchema, "query"), requireRole("ADMIN"), getPayments);
router.get("/:paymentId", validateIdParam("paymentId"), getPayment);

export default router;
