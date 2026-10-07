import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import { connectDB, disconnectDB } from "./config/db.js";
import { corsOptions } from "./config/cors.js";
import registerNotificationListeners from "./events/listeners/notificationListeners.js";
import registerAuditListeners from "./events/listeners/auditListeners.js";

registerNotificationListeners();
registerAuditListeners();

// Import Routes
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import refreshRoutes from "./modules/auth/refresh.routes.js";
import addressRoutes from "./modules/address/address.routes.js";
import vendorRoutes from "./modules/vendor/vendor.routes.js";
import categoryRoutes from "./modules/category/category.routes.js";
import productRoutes from "./modules/product/product.routes.js";
import cartRoutes from "./modules/cart/cart.routes.js";
import wishLists from "./modules/wishlist/wishlist.routes.js";
import orderRoutes from "./modules/order/order.routes.js";
import reviewRoutes from "./modules/review/review.routes.js";
import healthRoutes from "./modules/health/health.routes.js";
import notificationRoutes from "./modules/notification/notification.routes.js";
import errorMiddleware from "./shared/middleware/error.middleware.js";
import logger from "./shared/utils/logger.js";
import { sendErrorResponse } from "./shared/utils/error-response.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";

config();
connectDB();

const app = express();

app.use(cors(corsOptions));

// Body parsing middlwares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/addresses", addressRoutes);
app.use("/api/v1/auth", refreshRoutes);
app.use("/api/v1/vendor", vendorRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/carts", cartRoutes);
app.use("/api/v1/wishlists", wishLists);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/notification", notificationRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api", healthRoutes);

app.use((req, res) =>
  sendErrorResponse(res, 404, "The requested API route was not found."),
);
app.use(errorMiddleware);

// Handle unhandled promise rejections (e.g., database connection errors)
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled promise rejection", {
    service: "process",
    errorMessage: err?.message,
    stack: err?.stack,
  });
  const shutdown = async () => {
    await disconnectDB();
    process.exit(1);
  };
  if (app.locals.httpServer) app.locals.httpServer.close(shutdown);
  else shutdown();
});

// Handle uncaught exceptions
process.on("uncaughtException", async (err) => {
  logger.error("Uncaught exception", {
    service: "process",
    errorMessage: err.message,
    stack: err.stack,
  });
  await disconnectDB();
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("Shutdown signal received", {
    service: "process",
    signal: "SIGTERM",
  });
  const shutdown = async () => {
    await disconnectDB();
    process.exit(0);
  };
  if (app.locals.httpServer) app.locals.httpServer.close(shutdown);
  else await shutdown();
});

export default app;
