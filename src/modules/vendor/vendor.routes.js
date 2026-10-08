import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";
import {
  applyAsVendor,
  getVendorProfile,
  getMyVendorProfile,
  getAllVendors,
  verifyVendor,
  rejectVendor,
  suspendVendor,
  getVendorAnalytics,
  getVendorMetrics,
  getTopVendors,
  updateVendorProfile,
} from "./vendor.controller.js";
import { validateRequest } from "../../shared/middleware/validate.request.js";
import { rejectVendorSchema, updateVendorProfileSchema, vendorApplicationSchema } from "./vendor.validator.js";
import { validateIdParam } from "../../shared/middleware/validate.id-param.js";

const router = express.Router();

router.post("/apply", authMiddleware, validateRequest(vendorApplicationSchema), applyAsVendor);

// Public
router.get("/", getAllVendors);
router.get("/top", getTopVendors);
router.get("/me", authMiddleware, getMyVendorProfile);

// Vendor
router.patch("/me", authMiddleware, validateRequest(updateVendorProfileSchema), updateVendorProfile);
router.get("/me/analytics", authMiddleware, getVendorAnalytics);

// Admin
router.post("/:vendorId/verify", authMiddleware, validateIdParam("vendorId"), verifyVendor);
router.post("/:vendorId/reject", authMiddleware, validateIdParam("vendorId"), validateRequest(rejectVendorSchema), rejectVendor);
router.post("/:vendorId/suspend", authMiddleware, validateIdParam("vendorId"), suspendVendor);
router.get("/:vendorId/metrics", authMiddleware, validateIdParam("vendorId"), getVendorMetrics);

router.get("/:vendorId", validateIdParam("vendorId"), getVendorProfile);

export default router;
