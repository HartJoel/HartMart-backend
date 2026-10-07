import { prisma } from "../../config/db.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import AuthRepository from "./auth.repository.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../shared/utils/generate.token.js";
import AppError from "../../shared/utils/AppError.js";
import logger from "../../shared/utils/logger.js";
import EventService from "../../events/eventService.js";
import EventTypes from "../../events/eventTypes.js";

class AuthService {
  // REGISTER USER
  static async register(data, requestMeta = {}) {
    const { name, email } = data;

    logger.info("Registration attempt", {
      email,
      userId: requestMeta.userId,
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
      timestamp: new Date(),
    });

    try {
      const userExists = await AuthRepository.findUserByEmail(email);

      if (userExists) {
        logger.warn("Registration failed - email already exists", {
          email,
          ip: requestMeta.ip,
          userAgent: requestMeta.userAgent,
          timestamp: new Date(),
        });

        throw new AppError("User with this email already exists", 409);
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const user = await AuthRepository.createUser({
        name,
        email,
        password: hashedPassword,
        emailVerified: true,
      });

      logger.info("User registered", {
        userId: user.id,
        email: user.email,
        timestamp: new Date(),
        ip: requestMeta.ip,
        userAgent: requestMeta.userAgent,
      });
      EventService.emit(EventTypes.USER_REGISTERED, {
        user,
        ipAddress: requestMeta.ip,
        userAgent: requestMeta.userAgent,
      });

      return { user };
    } catch (error) {
      if (!(error instanceof AppError)) {
        logger.error("Unexpected registration error", {
          email,
          error: error.message,
          stack: error.stack,
          ip: requestMeta.ip,
          userAgent: requestMeta.userAgent,
          timestamp: new Date(),
        });
      }

      throw error;
    }
  }

  // VERIFY EMAIL
  static async verifyEmail(token, requestMeta = {}) {
    try {
      const user = await AuthRepository.findEmailToken(token);

      if (!user) {
        logger.warn("Email verification failed - invalid or expired token", {
          ip: requestMeta.ip,
          userAgent: requestMeta.userAgent,
          timestamp: new Date(),
        });

        throw new AppError("The verification token is invalid or has expired.", 400);
      }

      const updatedUser = await AuthRepository.verifyEmail(user);

      logger.info("Email verified", {
        userId: updatedUser.id,
        email: updatedUser.email,
        timestamp: new Date(),
        ip: requestMeta.ip,
        userAgent: requestMeta.userAgent,
      });
      EventService.emit(EventTypes.USER_EMAIL_VERIFIED, {
        user: updatedUser,
        ipAddress: requestMeta.ip,
        userAgent: requestMeta.userAgent,
      });

      return {
        success: true,
        message: "Email verified successfully",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          emailVerified: updatedUser.emailVerified,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // LOGIN USER
  static async login(data, requestMeta = {}) {
    const { email } = data;

    logger.info("Login attempt", {
      email,
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
      timestamp: new Date(),
    });

    try {
      const user = await AuthRepository.findUserByEmail(email);

      if (!user) {
        logger.warn("Login failed - user not found", {
          email,
          ip: requestMeta.ip,
          userAgent: requestMeta.userAgent,
          timestamp: new Date(),
        });

        throw new AppError("Invalid email or password", 401);
      }

      const isPasswordValid = await bcrypt.compare(
        data.password,
        user.password,
      );

      if (!isPasswordValid) {
        logger.warn("Login failed - invalid password", {
          userId: user.id,
          email: user.email,
          ip: requestMeta.ip,
          userAgent: requestMeta.userAgent,
          timestamp: new Date(),
        });

        throw new AppError("Invalid email or password", 401);
      }

      const accessToken = generateAccessToken(user.id, user.role);
      const refreshToken = generateRefreshToken(user.id);

      await AuthRepository.createRefreshToken(refreshToken, user);

      delete user.password;

      logger.info("User logged in", {
        userId: user.id,
        email: user.email,
        role: user.role,
        timestamp: new Date(),
        ip: requestMeta.ip,
        userAgent: requestMeta.userAgent,
      });

      EventService.emit(EventTypes.USER_LOGGED_IN, {
        user: user.id,
        ipAddress: requestMeta.ip,
        userAgent: requestMeta.userAgent,
      });

      return {
        user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (!(error instanceof AppError)) {
        logger.error("Unexpected login error", {
          email,
          error: error.message,
          stack: error.stack,
          ip: requestMeta.ip,
          userAgent: requestMeta.userAgent,
          timestamp: new Date(),
        });
      }

      throw error;
    }
  }

  // LOGOUT USER
  static async logout(refreshTokenCookie, requestMeta = {}) {
    if (refreshTokenCookie) {
      await AuthRepository.deleteRefreshToken(refreshTokenCookie);
    }

    logger.info("User logged out", {
      userId: requestMeta.userId,
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
      timestamp: new Date(),
    });

    if (requestMeta.userId) {
      EventService.emit(EventTypes.USER_LOGGED_OUT, {
        user: requestMeta.userId,
        ipAddress: requestMeta.ip,
        userAgent: requestMeta.userAgent,
      });
    }

    return { message: "Logged out successfully" };
  }

  // FORGOT PASSWORD
  static async forgotPassword(email, requestMeta = {}) {
    logger.info("Password reset requested", {
      email,
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
      timestamp: new Date(),
    });

    try {
      const user = await AuthRepository.findUserByEmail(email);

      if (!user) {
        logger.warn("Password reset requested for unknown email", {
          email,
          ip: requestMeta.ip,
          userAgent: requestMeta.userAgent,
          timestamp: new Date(),
        });

        return {
          success: true,
          message: "If an account exists, password reset email will be sent",
        };
      }

      const passwordResetToken = crypto.randomBytes(32).toString("hex");
      const passwordResetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

      await AuthRepository.forgetPassword(
        user,
        passwordResetToken,
        passwordResetTokenExpires,
      );

      logger.info("Password reset token created", {
        userId: user.id,
        email: user.email,
        timestamp: new Date(),
        ip: requestMeta.ip,
        userAgent: requestMeta.userAgent,
      });

      return {
        success: true,
        message: "If an account exists, password reset email will be sent",
        passwordResetToken,
      };
    } catch (error) {
      if (!(error instanceof AppError)) {
        logger.error("Unexpected password reset request error", {
          email,
          error: error.message,
          stack: error.stack,
          ip: requestMeta.ip,
          userAgent: requestMeta.userAgent,
          timestamp: new Date(),
        });
      }

      throw error;
    }
  }

  // RESET PASSWORD
  static async resetPassword(token, newPassword, requestMeta = {}) {
    try {
      const user = await AuthRepository.findPasswordResetToken(token);

      if (!user) {
        logger.warn("Password reset failed - invalid or expired token", {
          ip: requestMeta.ip,
          userAgent: requestMeta.userAgent,
          timestamp: new Date(),
        });

        throw new AppError("The password reset token is invalid or has expired.", 400);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await AuthRepository.updatePassword(user, hashedPassword);

      logger.info("Password reset successful", {
        userId: user.id,
        email: user.email,
        timestamp: new Date(),
        ip: requestMeta.ip,
        userAgent: requestMeta.userAgent,
      });

      return {
        success: true,
        message: "Password reset successfully. Please login with new password.",
      };
    } catch (error) {
      if (!(error instanceof AppError)) {
        logger.error("Unexpected password reset error", {
          error: error.message,
          stack: error.stack,
          ip: requestMeta.ip,
          userAgent: requestMeta.userAgent,
          timestamp: new Date(),
        });
      }

      throw error;
    }
  }
}

export default AuthService;
