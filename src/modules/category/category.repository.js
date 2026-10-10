import { prisma } from "../../config/db.js";

class CategoryRepository {
  static async create(data) {
    return prisma.category.create({
      data,
    });
  }

  static async findBySlug(slug) {
    return prisma.category.findUnique({
      where: { slug, deletedAt: null },
    });
  }

  static async findById(id) {
    return prisma.category.findUnique({
      where: { id, deletedAt: null },
      include: {
        subCategories: { where: { deletedAt: null } },
        products: { where: { deletedAt: null } },
      },
    });
  }

  static async findDescendantIds(id) {
    const ids = [id];
    let parentIds = [id];

    while (parentIds.length > 0) {
      const children = await prisma.category.findMany({
        where: { parentId: { in: parentIds }, deletedAt: null },
        select: { id: true },
      });
      parentIds = children.map(({ id: childId }) => childId);
      ids.push(...parentIds);
    }

    return ids;
  }

  static async listCategories() {
    return prisma.category.findMany({ where: { deletedAt: null } });
  }

  static async update(id, data) {
    return prisma.category.update({
      where: { id, deletedAt: null },
      data,
    });
  }

  static async deleteById(id) {
    return prisma.category.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}

export default CategoryRepository;
