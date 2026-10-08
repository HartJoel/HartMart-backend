import { prisma } from "../../config/db.js";

class VendorRepository {
  static async findUserId(userId) {
    return prisma.vendor.findUnique({
      where: {
        userId,
        deletedAt: null,
      },
    });
  }

  static async findById(vendorId) {
    return prisma.vendor.findUnique({
      where: { id: vendorId, deletedAt: null },
    });
  }

  static async findByStoreSlug(storeSlug) {
    return prisma.vendor.findUnique({
      where: {
        storeSlug,
        deletedAt: null,
      },
    });
  }

  static async create(data) {
    return prisma.vendor.create({
      data,
    });
  }

  static async updateVendor(vendorId, data) {
    return prisma.vendor.update({
      where: {
        id: vendorId,
        deletedAt: null,
      },
      data,
    });
  }

  static async getAllVendors() {
    return prisma.vendor.findMany({
      where: {
        deletedAt: null,
      },
    });
  }

  static async verifyVendor(vendorId) {
    return prisma.vendor.update({
      where: {
        id: vendorId,
        deletedAt: null,
      },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
      },
    });
  }

  static async rejectVendor(vendorId, reason) {
    return prisma.vendor.update({
      where: {
        id: vendorId,
        deletedAt: null,
      },
      data: {
        status: "REJECTED",
        rejectionReason: reason,
      },
    });
  }

  static suspendVendor(vendorId) {
    return prisma.vendor.update({
      where: {
        id: vendorId,
        deletedAt: null,
      },
      data: {
        status: "SUSPENDED",
      },
    });
  }

  static getVendorMetrics(vendorId) {
    return prisma.vendor.findUnique({
      where: {
        id: vendorId,
        deletedAt: null,
      },
      select: {
        averageRating: true,
        totalReviews: true,
        status: true,
        verifiedAt: true,
        createdAt: true,
      },
    });
  }

  static getTopVendors() {
    return prisma.vendor.findMany({
      where: { deletedAt: null },
      orderBy: {
        averageRating: "desc",
      },
      take: 10,
    });
  }
}

export default VendorRepository;
