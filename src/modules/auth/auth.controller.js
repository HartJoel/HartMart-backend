import jwt from "jsonwebtoken";
import AuthService from "./auth.service.js";
import asyncHandler from "../../shared/utils/asyncHandler.js";
import { setAuthCookies, clearAuthCookies } from "../../shared/utils/generate.token.js";
import { sendErrorResponse } from "../../shared/utils/error-response.js";

const register = asyncHandler(async (req, res) => {
  const requestMeta = {
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  };

  const { user } = await AuthService.register(req.body, requestMeta);

  return res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    },
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.validatedQuery ?? req.query;

  const requestMeta = {
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  };

  if (!token) {
    return sendErrorResponse(res, 400, "The verification token is required.");
  }
  const result = await AuthService.verifyEmail(token, requestMeta);

  return res.status(200).json({
    success: true,
    message: result.message,
    data: {
      user: result.user,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const requestMeta = {
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  };

  const { user, accessToken, refreshToken } = await AuthService.login(
    req.body,
    requestMeta,
  );

  // Set cookies in response
  setAuthCookies(res, accessToken, refreshToken);

  // Return user data (consistent with register response)
  return res.status(200).json({
    success: true,
    message: "Logged in successfully",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  const refreshTokenCookie = req.cookies.refreshToken;

  let userId = req.user?.id;
  if (!userId && refreshTokenCookie) {
    try {
      userId = jwt.verify(refreshTokenCookie, process.env.JWT_REFRESH_SECRET).id;
    } catch {
      // Token invalid/expired - still proceed to clear cookies below.
    }
  }

  const requestMeta = {
    userId,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  };

  const result = await AuthService.logout(refreshTokenCookie, requestMeta);

  clearAuthCookies(res);

  return res.status(200).json({
    success: true,
    message: result.message,
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const requestMeta = {
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  };

  const result = await AuthService.forgotPassword(email, requestMeta);

  return res.status(200).json({
    success: true,
    message: result.message,
    token: result.passwordResetToken,
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.validatedQuery ?? req.query;
  const { password } = req.body;

  const requestMeta = {
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  };

  const result = await AuthService.resetPassword(token, password, requestMeta);

  return res.status(200).json({
    success: true,
    message: result.message,
  });
});

export { register, verifyEmail, login, logout, forgotPassword, resetPassword };
