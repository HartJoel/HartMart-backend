import { prisma } from "../../config/db.js";

class WishlistRepository {
  static async findItem(userId, productId) {
    return prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
  }

  static async create(data) {
    return prisma.wishlistItem.create({ data });
  }

  static async getUserWishlist(userId) {
    return prisma.wishlistItem.findMany({
      where: { userId, product: { is: { deletedAt: null } } },
      include: {
        product: true,
      },
    });
  }

  static async removeItem(userId, productId) {
  return prisma.wishlistItem.delete({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });
}
}

export default WishlistRepository;
