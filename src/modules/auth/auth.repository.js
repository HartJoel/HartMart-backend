import { prisma } from "../../config/db.js";

class AuthRepository {
  static async findUserByEmail(email) {
    return prisma.user.findUnique({
      where: { email, deletedAt: null },
    });
  }

  static async createUser(data) {
    return prisma.user.create({
      data,
    });
  }

  static async findEmailToken(token) {
    return prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        deletedAt: null,
        emailVerificationTokenExpires: {
          gt: new Date(), // Token not expired
        },
      },
    });
  }

  static async verifyEmail(user) {
    return prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpires: null,
      },
    });
  }

  static async forgetPassword(
    user,
    passwordResetToken,
    passwordResetTokenExpires,
  ) {
    return prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: passwordResetToken,
        passwordResetExpires: passwordResetTokenExpires,
      },
    });
  }

  static async findPasswordResetToken(token) {
    return prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        deletedAt: null,
        passwordResetExpires: {
          gt: new Date(), // Token not expired
        },
      },
    });
  }

  static async updatePassword(user, hashedPassword) {
    return prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  }

  static async createRefreshToken(refreshToken, user) {
    return prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  static async deleteRefreshToken(token) {
    return prisma.refreshToken.deleteMany({
      where: { token },
    });
  }
}

export default AuthRepository;
