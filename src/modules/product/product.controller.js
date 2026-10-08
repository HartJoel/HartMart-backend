import ProductService from "./product.service.js";
import asyncHandler from "../../shared/utils/asyncHandler.js";

const createProduct = asyncHandler(async (req, res) => {
  const product = await ProductService.createProduct(
    req.user.id,
    req.body,
    req.file,
    {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    },
  );

  return res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: product,
  });
});

const getAllProducts = asyncHandler(async (req, res) => {
  const products = await ProductService.getAllProducts(req.validatedQuery ?? req.query);
  return res.status(200).json({
    success: true,
    message: "Products retrieved successfully.",
    data: products,
    pagination: products.pagination,
  });
});

const getVendorProducts = asyncHandler(async (req, res) => {
  const vendorProducts = await ProductService.getVendorProduct(
    req.user.id,
    req.validatedQuery ?? req.query,
  );

  return res.status(200).json({
    success: true,
    message: "Vendor products retrieved successfully.",
    data: vendorProducts,
  });
});

const updateStock = asyncHandler(async (req, res) => {
  const productId = req.params.productId;

  const data = await ProductService.updateStock(
    productId,
    req.user.id,
    req.body,
  );

  return res.status(200).json({
    success: true,
    message: "Product stock updated successfully.",
    data: data,
  });
});

const getLowStock = asyncHandler(async (req, res) => {
  const data = await ProductService.getLowStockProducts(req.user.id, req.validatedQuery ?? req.query);

  return res.status(200).json({
    success: true,
    message: "Low-stock products retrieved successfully.",
    data: data,
  });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await ProductService.getProductById(req.params.productId);
  return res.status(200).json({
    success: true,
    message: "Product retrieved successfully.",
    data: product,
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const {
    name,
    description,
    basePrice,
    discountPrice,
    totalStock,
    availableStock,
    reservedStock,
    reorderLevel,
    images,
    weight,
    dimensions,
    attributes,
    categoryId,
    categorySlug,
    slug,
  } = req.body;

  const updatedProduct = await ProductService.updateProduct(id, userId, {
    name,
    description,
    basePrice,
    discountPrice,
    totalStock,
    availableStock,
    reservedStock,
    reorderLevel,
    images,
    weight,
    dimensions,
    attributes,
    categoryId,
    categorySlug,
    slug,
  }, req.uploadedImages ?? [], { ipAddress: req.ip, userAgent: req.get("user-agent") });

  return res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: updatedProduct,
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  await ProductService.deleteProduct(productId, userId);

  return res.status(204).send();
});

export {
  createProduct,
  getAllProducts,
  getVendorProducts,
  updateStock,
  getLowStock,
  getProductById,
  updateProduct,
  deleteProduct,
};
