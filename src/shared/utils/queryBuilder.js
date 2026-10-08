export default class QueryBuilder {
  constructor(model, query, options = {}) {
    this.model = model;
    this.query = query || {};

    this.where = {};
    this.orderBy = {};
    this.skip = 0;
    this.take = 10;

    this.page = 1;
    this.limit = 10;
    this.total = 0;

    // Optional soft delete check (defaults to checking if model supports soft delete)
    this.supportsSoftDelete = options.supportsSoftDelete ?? false;
    this.includeDeleted = options.withDeleted ?? false;

    if (this.supportsSoftDelete && !this.includeDeleted) {
      this.where.deletedAt = null;
    }
  }

  search(fields = []) {
    if (this.query.search && fields.length > 0) {
      this.where.OR = fields.map((field) => ({
        [field]: {
          contains: this.query.search,
          mode: "insensitive",
        },
      }));
    }
    return this;
  }

  filter() {
    // 1. Exclude non-where query params from raw filtering
    const excluded = [
      "search",
      "page",
      "limit",
      "sort",
      "startDate",
      "endDate",
      "withDeleted",
    ];

    const filteredQuery = { ...this.query };
    excluded.forEach((key) => delete filteredQuery[key]);

    // Clean up any undefined parameters
    Object.keys(filteredQuery).forEach((key) => {
      if (filteredQuery[key] === undefined || filteredQuery[key] === "undefined") {
        delete filteredQuery[key];
      }
    });

    // 2. Map date ranges to `createdAt`
    const { startDate, endDate } = this.query;
    if (startDate || endDate) {
      this.where.createdAt = {
        ...(this.where.createdAt || {}),
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    // 3. Merge remaining field filters
    this.where = {
      ...this.where,
      ...filteredQuery,
    };

    if (this.supportsSoftDelete && !this.includeDeleted) {
      this.where.deletedAt = null;
    }

    return this;
  }

  sort() {
    if (this.query.sort) {
      const sortBy = this.query.sort;

      if (sortBy.startsWith("-")) {
        this.orderBy = { [sortBy.slice(1)]: "desc" };
      } else {
        this.orderBy = { [sortBy]: "asc" };
      }
    } else {
      this.orderBy = { createdAt: "desc" };
    }

    return this;
  }

  paginate() {
    this.page = Number(this.query.page) || 1;
    this.limit = Number(this.query.limit) || 10;

    this.skip = (this.page - 1) * this.limit;
    this.take = this.limit;

    return this;
  }

  async exec(includeOptions = {}) {
    // Count total matching records
    this.total = await this.model.count({
      where: this.where,
    });

    // Fetch data with pagination, sorting, and optional includes
    const data = await this.model.findMany({
      where: this.where,
      orderBy: this.orderBy,
      skip: this.skip,
      take: this.take,
      ...includeOptions,
    });

    const pages = Math.ceil(this.total / this.limit) || 1;

    return {
      data,
      pagination: {
        page: this.page,
        limit: this.limit,
        total: this.total,
        pages,
      },
    };
  }
}
