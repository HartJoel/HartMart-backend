import { prisma } from "../../config/db.js";
import QueryBuilder from "../../shared/utils/queryBuilder.js";

class UserRepository {
  static async findById(id) {
    return prisma.user.findUnique({
      where: { id, deletedAt: null },
    });
  }

  static async updateUser(id, name, avatarData) {
    return prisma.user.update({
      where: { id },
      data: {
        name: name,
        avatar: avatarData,
      },
    });
  }

  static async upadateRole(userId) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        role: "VENDOR",
      },
    });
  }

  static async findAll(query) {
    return new QueryBuilder(prisma.user, query, { supportsSoftDelete: true })
      .search(["name"])
      .filter()
      .sort()
      .paginate()
      .exec();
  }
}

export default UserRepository;
