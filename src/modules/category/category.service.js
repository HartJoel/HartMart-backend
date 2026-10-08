import slugify from "slugify";
import CategoryRepository from "./category.repository.js";
import AppError from "../../shared/utils/AppError.js";
import logger from "../../shared/utils/logger.js";
import {
  cacheTtl,
  getOrSetCache,
  invalidateCache,
} from "../../shared/utils/cache.js";

class CategoryService {
  static async createCategory(data) {
    const slug = slugify(data.name, {
      lower: true,
      strict: true,
    });

    // Optional: validate parent category
    if (data.parentId) {
      const parent = await CategoryRepository.findById(data.parentId);

      if (!parent) {
        throw new AppError("Parent category not found", 404);
      }
    }

    const category = await CategoryRepository.create({
      name: data.name,
      slug,
      description: data.description,
      icon: data.icon,
      parentId: data.parentId || null,
    });
    await invalidateCache("categories");
    logger.info("Category created", {
      categoryId: category.id,
      slug: category.slug,
      parentId: category.parentId,
    });
    return category;
  }

  static async getCategory(id) {
    const category = await getOrSetCache(
      "categories",
      ["detail", id],
      cacheTtl.categoryDetail,
      () => CategoryRepository.findById(id),
    );
    if (!category) {
      throw new AppError("Category not found.", 404);
    }

    logger.info("Category retrieved", {
      categoryId: id,
      found: Boolean(category),
    });
    return category;
  }

  static async list() {
    const categories = await getOrSetCache(
      "categories",
      ["list"],
      cacheTtl.categoryList,
      () => CategoryRepository.listCategories(),
    );
    logger.info("Categories retrieved", { categoryCount: categories.length });
    return categories;
  }

  static async update(id, data) {
    let slug;

    if (data.name) {
      slug = slugify(data.name, {
        lower: true,
        strict: true,
      });
    }

    const category = await CategoryRepository.update(id, {
      ...data,
      ...(slug && { slug }),
    });
    await invalidateCache("categories");
    logger.info("Category updated", { categoryId: id });
    return category;
  }

  static async delete(id) {
    const result = await CategoryRepository.deleteById(id);
    if (result.count === 0) {
      throw new AppError("Category not found.", 404);
    }
    await invalidateCache("categories");
    logger.info("Category deleted", { categoryId: id });
    return result;
  }
}

export default CategoryService;
