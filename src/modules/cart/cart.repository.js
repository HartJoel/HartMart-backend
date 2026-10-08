import { prisma } from "../../config/db.js";

class CartRespository {
  static async findItem(userId, productId) {
    return prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
  }

  static async create(data) {
    return prisma.cartItem.create({
      data,
    });
  }

  static async updateQuantity(id, quantity) {
    return prisma.cartItem.update({
      where: { id },
      data: { quantity },
    });
  }

  static async getUserCart(userId) {
    return prisma.cartItem.findMany({
      where: { userId, product: { is: { deletedAt: null } } },
      include: {
        product: true,
      },
    });
  }

  // static async updateQuantity(cartItemId, quantity) {
  //   return prisma.cartItem.update({
  //     where: {
  //       cartItemId,
  //     },
  //     data: quantity,
  //   });
  // }

  static async deleteItem(cartItemId) {
    return prisma.cartItem.delete({
      where: { id: cartItemId },
    });
  }

  static async clearCart(userId) {
    return prisma.cartItem.deleteMany({
      where: {
        userId,
      },
    });
  }
}

export default CartRespository;
