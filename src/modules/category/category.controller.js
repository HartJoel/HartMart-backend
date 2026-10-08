import CategoryService from "./category.service.js";
import asyncHandler from "../../shared/utils/asyncHandler.js";

const createCategory = asyncHandler(async (req, res) => {
  const category = await CategoryService.createCategory(req.body, req.file);

  res.status(201).json({
    success: true,
    message: "Category created successfully.",
    data: category,
  });
});

const getCategories = asyncHandler(async (req, res) => {
  const categories = await CategoryService.list();

  res.status(200).json({
    success: true,
    message: "Categories retrieved successfully.",
    data: categories,
  });
});

const getCategory = asyncHandler(async (req, res) => {
  const data = await CategoryService.getCategory(req.params.categoryId);

  res.status(200).json({
    success: true,
    message: "Category retrieved successfully.",
    data,
  });
});

const updateCategory = asyncHandler(async (req, res) => {
  const data = await CategoryService.update(req.params.categoryId, req.body, req.file);

  res.status(200).json({
    success: true,
    message: "Category updated successfully.",
    data,
  });
});

const deleteCategory = asyncHandler(async (req, res) => {
  await CategoryService.delete(req.params.categoryId);

  res.status(204).send();
});

export {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
};
