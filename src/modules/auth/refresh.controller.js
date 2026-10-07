// controllers/refreshController.js
import jwt from "jsonwebtoken";
import { prisma } from "../../config/db.js";
import { generateAccessToken, getAuthCookieOptions } from "../../shared/utils/generate.token.js";
import logger from "../../shared/utils/logger.js";
import { sendErrorResponse } from "../../shared/utils/error-response.js";

export const refreshToken = async (req, res) => {
  try {
    const refreshTokenCookie = req.cookies.refreshToken;

    if (!refreshTokenCookie) {
      return sendErrorResponse(res, 401, "Authentication is required. Please sign in.");
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshTokenCookie, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      const expired = error.name === "TokenExpiredError";
      if (expired) {
        return sendErrorResponse(res, 401, "Your refresh token has expired. Please sign in again.", "TOKEN_EXPIRED");
      }
      if (["JsonWebTokenError", "NotBeforeError"].includes(error.name)) {
        return sendErrorResponse(res, 401, "The refresh token is invalid. Please sign in again.");
      }
      throw error;
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenCookie },
    });

    if (!storedToken) {
      return sendErrorResponse(res, 401, "The refresh token is no longer valid. Please sign in again.");
    }

    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({
        where: { token: refreshTokenCookie },
      });

      return sendErrorResponse(res, 401, "Your refresh token has expired. Please sign in again.", "TOKEN_EXPIRED");
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      await prisma.refreshToken.delete({
        where: { token: refreshTokenCookie },
      });

      return sendErrorResponse(res, 401, "The refresh token is no longer valid. Please sign in again.");
    }

    const newAccessToken = generateAccessToken(user.id, user.role);

    res.cookie("accessToken", newAccessToken, {
      ...getAuthCookieOptions(),
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    logger.error("Refresh token request failed", { service: "auth", userId: req.user?.id, ip: req.ip, userAgent: req.get("User-Agent"), errorMessage: error.message, stack: error.stack });
    return sendErrorResponse(res, 500, "Unable to refresh your session due to a server error.");
  }
};
