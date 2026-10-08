import { prisma } from "../../config/db.js";
import QueryBuilder from "../../shared/utils/queryBuilder.js";

class AdminRepository {
  static async getTotalUsers() {
    return prisma.user.count({
      where: {
        deletedAt: null,
      },
    });
  }

  static async getTotalVendors() {
    return prisma.vendor.count({
      where: {
        deletedAt: null,
      },
    });
  }

  static async getTotalOrders() {
    return prisma.order.count();
  }

  static async getTotalRevenue() {
    return prisma.order.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        status: {
          in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"],
        },
      },
    });
  }

  static async getTodaySales(startOfDay, endOfDay) {
    return prisma.order.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
        status: {
          in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"],
        },
      },
    });
  }

  static async getPendingVerifications() {
    return prisma.vendor.count({
      where: {
        status: "PENDING_VERIFICATION",
        deletedAt: null,
      },
    });
  }

  //REPORT
  static async getSalesReport(startDate, endDate) {
    return prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"],
        },
      },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  static async findUsers(query) {
    return new QueryBuilder(prisma.user, query, { supportsSoftDelete: true })
      .search(["name", "email"])
      .filter()
      .sort()
      .paginate()
      .exec();
  }



  static async findAuditLogs(query) {
    return new QueryBuilder(prisma.auditLog, query)
      .filter()
      .sort()
      .paginate()
      .exec();
  }

  static async getOrdersForExport({ startDate, endDate }) {
    const where = {};

    if (startDate || endDate) {
      where.createdAt = {};

      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }

      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    return prisma.order.findMany({
      where,

      select: {
        id: true,
        orderNumber: true,
        customerId: true,
        status: true,

        subtotal: true,
        taxAmount: true,
        shippingCost: true,
        discountAmount: true,
        totalAmount: true,

        createdAt: true,
        confirmedAt: true,
        shippedAt: true,
        deliveredAt: true,
        cancelledAt: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getUsersForExport({ startDate, endDate }) {
    const where = { deletedAt: null };

    if (startDate || endDate) {
      where.createdAt = {};

      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }

      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    return prisma.user.findMany({
      where,

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getVendorsForExport({ startDate, endDate }) {
    const where = { deletedAt: null };

    if (startDate || endDate) {
      where.createdAt = {};

      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }

      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    return prisma.vendor.findMany({
      where,

      select: {
        id: true,
        storeName: true,
        storeSlug: true,
        storeCategory: true,
        status: true,
        averageRating: true,
        totalReviews: true,
        bankVerified: true,
        createdAt: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getProductsForExport({ startDate, endDate }) {
    const where = { deletedAt: null };

    if (startDate || endDate) {
      where.createdAt = {};

      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }

      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    return prisma.product.findMany({
      where,

      select: {
        id: true,
        sku: true,
        name: true,
        basePrice: true,
        discountPrice: true,
        currency: true,
        totalStock: true,
        availableStock: true,
        status: true,
        isApproved: true,
        isPublished: true,
        averageRating: true,
        reviewCount: true,
        createdAt: true,

        vendor: {
          select: {
            storeName: true,
          },
        },

        category: {
          select: {
            name: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }
}

export default AdminRepository;
