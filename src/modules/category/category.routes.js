import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategory,
  updateCategory,
} from "./category.controller.js";
import { validateRequest } from "../../shared/middleware/validate.request.js";
import { createCategorySchema, updateCategorySchema } from "./category.validator.js";
import { validateIdParam } from "../../shared/middleware/validate.id-param.js";
import { upload } from "../../shared/middleware/upload.js";

const router = express.Router();

router.post("/", authMiddleware, upload.single("icon"), validateRequest(createCategorySchema), createCategory);
router.get("/", getCategories);
router.get("/:categoryId", validateIdParam("categoryId"), getCategory);
router.patch(
  "/:categoryId",
  authMiddleware,
  upload.single("icon"),
  (req, res, next) => {
    if (req.file && req.body.icon === undefined) req.body.icon = null;
    next();
  },
  validateIdParam("categoryId"),
  validateRequest(updateCategorySchema),
  updateCategory,
);
router.delete("/:categoryId", authMiddleware, validateIdParam("categoryId"), deleteCategory);

export default router;
