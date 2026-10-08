import VendorService from "./vendor.service.js";
import asyncHandler from "../../shared/utils/asyncHandler.js";

const applyAsVendor = asyncHandler(async (req, res) => {
  const vendor = await VendorService.applyAsVendor(req.user.id, req.body);

  return res.status(201).json({
    success: true,
    message: "Vendor application submitted successfully. Sign in again to refresh your account permissions.",
    data: vendor,
  });
});

const getVendorProfile = asyncHandler(async (req, res) => {
  const vendor = await VendorService.getVendorProfile(req.params.vendorId);

  return res.status(200).json({
    success: true,
    message: "Vendor profile retrieved successfully.",
    data: vendor,
  });
});

const getMyVendorProfile = asyncHandler(async (req, res) => {
  const vendor = await VendorService.getMyVendorProfile(req.user.id);

  return res.status(200).json({
    success: true,
    message: "Your vendor profile was retrieved successfully.",
    data: vendor,
  });
});

const updateVendorProfile = asyncHandler(async (req, res) => {
  const vendor = await VendorService.updateVendorProfile(req.user.id, req.body, req.files ?? {});

  return res.status(200).json({
    success: true,
    message: "Vendor profile updated successfully.",
    data: vendor,
  });
});

const getAllVendors = asyncHandler(async (req, res) => {
  const vendors = await VendorService.getAllVendors();

  return res.status(200).json({
    success: true,
    message: "Vendors retrieved successfully.",
    data: vendors,
  });
});

const verifyVendor = asyncHandler(async (req, res) => {
  const vendor = await VendorService.verifyVendor(req.params.vendorId);

  return res.status(200).json({
    success: true,
    message: "Vendor verified successfully.",
    data: vendor,
  });
});

const rejectVendor = asyncHandler(async (req, res) => {
  const vendor = await VendorService.rejectVendor(
    req.params.vendorId,
    req.body.reason,
  );

  return res.status(200).json({
    success: true,
    message: "Vendor application rejected.",
    data: vendor,
  });
});

const suspendVendor = asyncHandler(async (req, res) => {
  const vendor = await VendorService.suspendVendor(req.params.vendorId);

  return res.status(200).json({
    success: true,
    message: "Vendor suspended successfully.",
    data: vendor,
  });
});

const getVendorAnalytics = asyncHandler(async (req, res) => {
  const analytics = await VendorService.getVendorAnalytics(req.user.id);

  return res.status(200).json({
    success: true,
    message: "Vendor analytics retrieved successfully.",
    data: analytics,
  });
});

const getVendorMetrics = asyncHandler(async (req, res) => {
  const metrics = await VendorService.getVendorMetrics(req.params.vendorId);

  return res.status(200).json({
    success: true,
    message: "Vendor metrics retrieved successfully.",
    data: metrics,
  });
});

const getTopVendors = asyncHandler(async (req, res) => {
  const vendors = await VendorService.getTopVendors();

  return res.status(200).json({
    success: true,
    message: "Top vendors retrieved successfully.",
    data: vendors,
  });
});

export {
  applyAsVendor,
  getVendorProfile,
  getMyVendorProfile,
  updateVendorProfile,
  getAllVendors,
  verifyVendor,
  rejectVendor,
  suspendVendor,
  getVendorAnalytics,
  getVendorMetrics,
  getTopVendors,
};
