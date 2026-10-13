import { prisma } from '../../../../db/prisma.js';
import type { Prisma } from '../../../../generated/prisma/client.js';

/**
 * What every product query returns: deletedAt is hidden and the category name is included,
 * so the React app can show it without a second request.
 */
const productSelect = {
  omit: { deletedAt: true },
  include: { category: { select: { id: true, name: true } } },
} as const;

export type ProductWithCategory = Prisma.ProductGetPayload<typeof productSelect>;

/** Soft delete: every read must exclude deleted rows. */
const notDeleted = { deletedAt: null } satisfies Prisma.ProductWhereInput;

export class ProductRepository {
  async findMany(params: {
    where: Prisma.ProductWhereInput;
    orderBy: Prisma.ProductOrderByWithRelationInput;
    skip: number;
    take: number;
  }): Promise<[ProductWithCategory[], number]> {
    const where = { ...params.where, ...notDeleted };
    return prisma.$transaction([
      prisma.product.findMany({ ...productSelect, ...params, where }),
      prisma.product.count({ where }),
    ]);
  }

  findById(id: string): Promise<ProductWithCategory | null> {
    return prisma.product.findFirst({ ...productSelect, where: { id, ...notDeleted } });
  }

  create(data: Prisma.ProductUncheckedCreateInput): Promise<ProductWithCategory> {
    return prisma.product.create({ ...productSelect, data });
  }

  /** Throws Prisma P2025 (-> 404) if the product does not exist or is deleted. */
  update(id: string, data: Prisma.ProductUncheckedUpdateInput): Promise<ProductWithCategory> {
    return prisma.product.update({ ...productSelect, where: { id, ...notDeleted }, data });
  }

  /** Returns false if nothing was deleted (not found / already deleted). */
  async softDelete(id: string): Promise<boolean> {
    const result = await prisma.product.updateMany({
      where: { id, ...notDeleted },
      data: { deletedAt: new Date() },
    });
    return result.count > 0;
  }
}

export const productRepository = new ProductRepository();
