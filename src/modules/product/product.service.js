import ProductRepository from "./product.repository.js";
import slugify from "slugify";
import crypto from "crypto";
import VendorRepository from "../vendor/vendor.repository.js";
import CategoryRepository from "../category/category.repository.js";
import { prisma } from "../../config/db.js";
import { uploadProductToCloudinary } from "../../shared/utils/uploadToCloudinary.js";
import AppError from "../../shared/utils/AppError.js";
import EventService from "../../events/eventService.js";
import EventTypes from "../../events/eventTypes.js";
import logger from "../../shared/utils/logger.js";
import { cacheTtl, getOrSetCache, invalidateCache } from "../../shared/utils/cache.js";

class ProductService {
  static async createProduct(vendorUserId, data, file, context = {}) {
    const vendor = await VendorRepository.findUserId(vendorUserId);

    if (!vendor) {
      throw new AppError("A vendor account is required to create products.", 403);
    }

    const category = await CategoryRepository.findBySlug(data.categorySlug);

    if (!category) {
      throw new AppError("The selected product category was not found.", 404);
    }

    let imageData = null;

    if (file) {
      const uploadedImage = await uploadProductToCloudinary(file.buffer);

      imageData = {
        url: uploadedImage.secure_url,
        publicId: uploadedImage.public_id,
      };
    }

    const sku = `SKU-${crypto.randomBytes(4).toString("hex")}`;

    const baseSlug = slugify(data.name, {
      lower: true,
      strict: true,
    });

    const slug = `${baseSlug}-${crypto.randomBytes(2).toString("hex")}`;

    const product = await ProductRepository.create({
      vendorId: vendor.id,
      name: data.name,
      description: data.description,
      categoryId: category.id,
      sku,
      slug,
      basePrice: Number(data.basePrice),
      discountPrice: Number(data.discountPrice),
      totalStock: Number(data.totalStock),
      availableStock: Number(data.totalStock),
      reorderLevel: Number(data.reorderLevel),
      weight: data.weight ? Number(data.weight) : null,
      images: imageData ? [imageData] : [],
      dimensions: data.dimensions,
      attributes: data.attributes,
    });
    await invalidateCache("products.detail");
    await invalidateCache("products.list");
    await invalidateCache("categories");

    EventService.emit(EventTypes.PRODUCT_CREATED, { userId: vendorUserId, vendorId: vendor.id, product, ...context });
    logger.info("Product created", { productId: product.id, vendorId: vendor.id, userId: vendorUserId, categoryId: product.categoryId, price: Number(product.basePrice) });

    return product;
  }

  static async getAllProducts(query) {
    const categoryIds = query.categoryId
      ? await CategoryRepository.findDescendantIds(query.categoryId)
      : undefined;
    const result = await getOrSetCache("products.list", [query], cacheTtl.productList, () => ProductRepository.getProducts(query, categoryIds));

    const products = result.data ?? result;

    return {
      data: products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        basePrice: product.basePrice,
        discountPrice: product.discountPrice,
        currency: product.currency,
        images: product.images,
        averageRating: product.averageRating,
        status: product.status,
        availableStock: product.availableStock,
        vendorId: product.vendorId,
        categoryId: product.categoryId,
      })),
      pagination: result.pagination,
    };
  }

  static async getProductById(id) {
    const product = await getOrSetCache("products.detail", [id], cacheTtl.productDetail, () => ProductRepository.findbyId(id));
    if (!product) {
      throw new AppError("Product not found.", 404);
    }
    return product;
  }

  static async updateProduct(productId, userId, data, files = [], context = {}) {
    const vendor = await VendorRepository.findUserId(userId);

    if (!vendor) {
      throw new AppError("A vendor account is required to update products.", 403);
    }

    const product = await ProductRepository.findbyId(productId);

    if (!product) {
      throw new AppError("Product not found.", 404);
    }

    if (product.vendorId !== vendor.id) {
      throw new AppError("You do not have permission to update this product.", 403);
    }

    let categoryId = undefined;

    if (data.categorySlug) {
      const category = await CategoryRepository.findBySlug(data.categorySlug);

      if (!category) {
        throw new AppError("The selected product category was not found.", 404);
      }

      categoryId = category.id;
    }

    let slug;

    if (data.name) {
      const baseSlug = slugify(data.name, {
        lower: true,
        strict: true,
      });

      slug = `${baseSlug}-${crypto.randomBytes(2).toString("hex")}`;
    }

    const uploadedImages = files.length
      ? await Promise.all(files.map(async (file) => {
          const uploadedImage = await uploadProductToCloudinary(file.buffer);
          return { url: uploadedImage.secure_url, publicId: uploadedImage.public_id };
        }))
      : undefined;

    const updatedData = {
      ...data,
      ...(uploadedImages && { images: uploadedImages }),
      ...(categoryId && { categoryId }),
      ...(slug && { slug }),
    };

    const updatedProduct = await ProductRepository.updateProduct(productId, updatedData);
    await invalidateCache("products.detail");
    await invalidateCache("products.list");
    await invalidateCache("categories");
    EventService.emit(EventTypes.PRODUCT_UPDATED, { userId, vendorId: vendor.id, product: updatedProduct, ...context });
    logger.info("Product updated", { productId, vendorId: vendor.id, userId, changedFields: Object.keys(data) });
    return updatedProduct;
  }

  static async getVendorProduct(userId, query) {
    const vendor = await VendorRepository.findUserId(userId);
    if (!vendor) {
      throw new AppError("A vendor account is required to view vendor products.", 403);
    }
    return ProductRepository.findVendorProducts(vendor.id, query);
  }

  static async getLowStockProducts(userId, query) {
    const vendor = await VendorRepository.findUserId(userId);

    if (!vendor) throw new AppError("A vendor account is required to view low-stock products.", 403);

    return ProductRepository.getLowStockProducts(vendor.id, query);
  }

  static async updateStock(productId, userId, data) {
    const vendor = await VendorRepository.findUserId(userId);

    if (!vendor) throw new AppError("A vendor account is required to update stock.", 403);

    const product = await ProductRepository.findbyId(productId);
    if (!product) throw new AppError("Product not found.", 404);

    if (product.vendorId !== vendor.id) {
      throw new AppError("You do not have permission to update this product's stock.", 403);
    }

    if (data.reservedStock > data.totalStock) {
      throw new AppError("Reserved stock cannot exceed total stock.", 400);
    }

    const updatedProduct = await ProductRepository.updateStock(productId, data);
    await invalidateCache("products.detail");
    await invalidateCache("products.list");
    await invalidateCache("categories");
    EventService.emit(EventTypes.PRODUCT_STOCK_UPDATED, { userId, vendorId: vendor.id, product: updatedProduct, metadata: { totalStock: data.totalStock, reservedStock: data.reservedStock } });
    logger.info("Product stock updated", { productId, vendorId: vendor.id, userId, totalStock: updatedProduct.totalStock, availableStock: updatedProduct.availableStock });
    return updatedProduct;
  }

  static async deleteProduct(productId, userId) {
    const vendor = await VendorRepository.findUserId(userId);

    if (!vendor) {
      throw new AppError("A vendor account is required to delete products.", 403);
    }

    const product = await ProductRepository.findByIdIncludingDeleted(productId);

    if (!product) {
      throw new AppError("Product not found.", 404);
    }

    if (product.vendorId !== vendor.id) {
      throw new AppError("You do not have permission to delete this product.", 403);
    }

    if (product.deletedAt) {
      throw new AppError("Product has already been deleted.", 409);
    }

    const deleted = await ProductRepository.softDeleteProduct(productId);
    if (deleted.count === 0) {
      throw new AppError("Product has already been deleted.", 409);
    }
    await invalidateCache("products.detail");
    await invalidateCache("products.list");
    await invalidateCache("categories");
    EventService.emit(EventTypes.PRODUCT_DELETED, { userId, vendorId: vendor.id, product });
    logger.info("Product deleted", { productId, vendorId: vendor.id, userId });
    return { id: productId, deletedAt: new Date() };
  }
}

export default ProductService;
