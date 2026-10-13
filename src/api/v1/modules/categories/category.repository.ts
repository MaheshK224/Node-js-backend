import { prisma } from '../../../../db/prisma.js';
import type { Category, Prisma } from '../../../../generated/prisma/client.js';

/**
 * Repository = the ONLY layer that talks to the database.
 * If you ever replace Prisma (or write raw SQL), only this file changes.
 */
export class CategoryRepository {
  async findMany(params: {
    where: Prisma.CategoryWhereInput;
    orderBy: Prisma.CategoryOrderByWithRelationInput;
    skip: number;
    take: number;
  }): Promise<[Category[], number]> {
    // Run both queries in one transaction so the count matches the page.
    return prisma.$transaction([
      prisma.category.findMany(params),
      prisma.category.count({ where: params.where }),
    ]);
  }

  findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { id } });
  }

  create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return prisma.category.create({ data });
  }

  update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return prisma.category.update({ where: { id }, data });
  }

  delete(id: string): Promise<Category> {
    return prisma.category.delete({ where: { id } });
  }

  countActiveProducts(categoryId: string): Promise<number> {
    return prisma.product.count({ where: { categoryId, deletedAt: null } });
  }
}

export const categoryRepository = new CategoryRepository();
