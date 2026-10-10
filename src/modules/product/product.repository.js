import { prisma } from "../../config/db.js";
import QueryBuilder from "../../shared/utils/queryBuilder.js";

class ProductRepository {
  static async findBySku(sku) {
    return prisma.product.findUnique({
      where: { sku, deletedAt: null },
    });
  }

  static async create(data) {
    return prisma.product.create({
      data,
    });
  }

  static async findBySlug(slug) {
    return prisma.category.findUnique({
      where: { slug },
    });
  }

  static async findbyId(id) {
    return prisma.product.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  static async findByIdIncludingDeleted(id) {
    return prisma.product.findUnique({ where: { id } });
  }

  static async getProducts(query, categoryIds) {
    const builder = new QueryBuilder(prisma.product, query, { supportsSoftDelete: true })
      .search(["name", "description"])
      .filter();

    if (categoryIds) builder.where.categoryId = { in: categoryIds };

    return builder.sort().paginate().exec();
  }

  static async updateProduct(id, data) {
    return prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,

        basePrice: data.basePrice,
        discountPrice: data.discountPrice,

        totalStock: data.totalStock,
        availableStock: data.availableStock,
        reservedStock: data.reservedStock,
        reorderLevel: data.reorderLevel,

        images: data.images,

        weight: data.weight,
        dimensions: data.dimensions,

        attributes: data.attributes,

        categoryId: data.categoryId,
        slug: data.slug,
      },
    });
  }

  static async findVendorProducts(vendorId, query) {
    return new QueryBuilder(prisma.product, { ...query, vendorId }, { supportsSoftDelete: true })
      .search(["name", "description"])
      .filter()
      .sort()
      .paginate()
      .exec();
  }

  static async updateStock(productId, data) {
    return prisma.product.update({
      where: { id: productId },
      data: {
        totalStock: data.totalStock,
        reservedStock: data.reservedStock,
        availableStock: data.totalStock - data.reservedStock,
      },
    });
  }

  static async getLowStockProducts(vendorId, query) {
    const result = await new QueryBuilder(prisma.product, { ...query, vendorId }, { supportsSoftDelete: true })
      .filter()
      .sort()
      .paginate()
      .exec();

    result.data = result.data.filter(
      (product) => product.availableStock <= product.reorderLevel,
    );

    return result;
  }

  static async softDeleteProduct(productId) {
    return prisma.product.updateMany({
      where: { id: productId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  static async restoreProduct(productId) {
    return prisma.product.update({
      where: { id: productId },
      data: {
        deletedAt: null,
      },
    });
  }
}

export default ProductRepository;
