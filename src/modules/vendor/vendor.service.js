import VendorRepository from "./vendor.repository.js";
import slugify from "slugify";
import crypto from "crypto";
import UserRepository from "../user/user.repository.js";
import EventService from "../../events/eventService.js";
import EventTypes from "../../events/eventTypes.js";
import AppError from "../../shared/utils/AppError.js";
import logger from "../../shared/utils/logger.js";
import { invalidateCache } from "../../shared/utils/cache.js";
import { uploadVendorAssetToCloudinary } from "../../shared/utils/uploadToCloudinary.js";

class VendorService {
  static async applyAsVendor(userId, data) {
    const existingVendor = await VendorRepository.findUserId(userId);

    if (existingVendor) {
      if (existingVendor) {
        throw new AppError("You already have a vendor account.", 409);
      }
    }

    const storeSlug = `${slugify(data.storeName, { lower: true, strict: true })}-${crypto.randomBytes(2).toString("hex")}`;

    const existingStore = await VendorRepository.findByStoreSlug(storeSlug);

    if (existingStore) {
      throw new AppError("That store name is already in use.", 409);
    }

    await UserRepository.upadateRole(userId);
    await invalidateCache("users.profile");
    await invalidateCache("users.detail");

    const vendor = await VendorRepository.create({
      userId,

      storeName: data.storeName,
      storeSlug,

      storeDescription: data.storeDescription,
      storeCategory: data.storeCategory,

      businessRegistration: data.businessRegistration,
      taxId: data.taxId,

      businessAddress: data.businessAddress,

      businessPhone: data.businessPhone,

      bankName: data.bankName,

      bankAccountNumber: data.bankAccountNumber,
      bankAccountName: data.bankAccountName,

      bankCode: data.bankCode,
    });
    EventService.emit(EventTypes.VENDOR_APPLIED, {
      userId,
      vendorId: vendor.id,
      vendor,
    });
    logger.info("Vendor application submitted", {
      userId,
      vendorId: vendor.id,
      storeName: vendor.storeName,
    });
    return vendor;
  }

  static async getVendorProfile(vendorId) {
    const vendor = await VendorRepository.findById(vendorId);
    if (!vendor) throw new AppError("Vendor not found.", 404);
    return vendor;
  }

  static async getMyVendorProfile(userId) {
    const vendor = await VendorRepository.findUserId(userId);
    if (!vendor) throw new AppError("You do not have a vendor account.", 404);
    return vendor;
  }

  static async updateVendorProfile(userId, data, files = {}) {
    const vendor = await VendorRepository.findUserId(userId);
    if (!vendor) throw new AppError("You do not have a vendor account.", 404);

    const [logo, banner] = await Promise.all([
      files.storeLogo?.[0]
        ? uploadVendorAssetToCloudinary(files.storeLogo[0].buffer, "logos")
        : null,
      files.storeBanner?.[0]
        ? uploadVendorAssetToCloudinary(files.storeBanner[0].buffer, "banners")
        : null,
    ]);

    const updatedVendor = await VendorRepository.updateVendor(vendor.id, {
      ...data,
      ...(logo && { storeLogo: logo.secure_url }),
      ...(banner && { storeBanner: banner.secure_url }),
    });
    EventService.emit(EventTypes.VENDOR_UPDATED, {
      userId,
      vendorId: vendor.id,
      vendor: updatedVendor,
    });
    logger.info("Vendor profile updated", { userId, vendorId: vendor.id });
    return updatedVendor;
  }

  static async getAllVendors() {
    return VendorRepository.getAllVendors();
  }

  static async verifyVendor(vendorId) {
    const vendor = await VendorRepository.verifyVendor(vendorId);
    EventService.emit(EventTypes.VENDOR_VERIFIED, {
      userId: vendor.userId,
      vendorId,
      vendor,
    });
    logger.info("Vendor verified", { vendorId, userId: vendor.userId });
    return vendor;
  }

  static async rejectVendor(vendorId, reason) {
    const vendor = await VendorRepository.rejectVendor(vendorId, reason);
    EventService.emit(EventTypes.VENDOR_REJECTED, {
      userId: vendor.userId,
      vendorId,
      vendor,
      reason,
    });
    logger.info("Vendor application rejected", {
      vendorId,
      userId: vendor.userId,
      reasonProvided: Boolean(reason),
    });
    return vendor;
  }

  static async suspendVendor(vendorId) {
    const vendor = await VendorRepository.suspendVendor(vendorId);
    EventService.emit(EventTypes.VENDOR_SUSPENDED, {
      userId: vendor.userId,
      vendorId,
      vendor,
    });
    logger.info("Vendor suspended", { vendorId, userId: vendor.userId });
    return vendor;
  }

  static async getVendorAnalytics(userId) {
    const vendor = await VendorRepository.findUserId(userId);
    if (!vendor) throw new AppError("You do not have a vendor account.", 404);

    // Build analytics later
    return {
      vendorId: vendor.id,
      totalSales: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      fulfillmentRate: 0,
      cancellationRate: 0,
      returnRate: 0,
      monthlyData: [],
    };
  }

  static async getVendorMetrics(vendorId) {
    return VendorRepository.getVendorMetrics(vendorId);
  }

  static async getTopVendors() {
    return VendorRepository.getTopVendors();
  }
}

export default VendorService;
