import type { Prisma } from '../../../../generated/prisma/client.js';
import { AppError } from '../../../../utils/AppError.js';
import {
  buildPaginationMeta,
  toSkipTake,
  type PaginationMeta,
} from '../../../../utils/pagination.js';
import { categoryRepository, type CategoryRepository } from '../categories/category.repository.js';

import {
  productRepository,
  type ProductRepository,
  type ProductWithCategory,
} from './product.repository.js';
import type {
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from './product.schema.js';

export class ProductService {
  constructor(
    private readonly repository: ProductRepository = productRepository,
    private readonly categories: CategoryRepository = categoryRepository,
  ) {}

  async list(
    query: ListProductsQuery,
  ): Promise<{ items: ProductWithCategory[]; pagination: PaginationMeta }> {
    const [items, total] = await this.repository.findMany({
      where: this.buildWhere(query),
      orderBy: query.sort,
      ...toSkipTake(query),
    });

    return { items, pagination: buildPaginationMeta(query, total) };
  }

  async getById(id: string): Promise<ProductWithCategory> {
    const product = await this.repository.findById(id);
    if (!product) {
      throw AppError.notFound('Product not found');
    }
    return product;
  }

  async create(input: CreateProductInput): Promise<ProductWithCategory> {
    await this.ensureCategoryExists(input.categoryId);
    return this.repository.create(input);
  }

  async update(id: string, input: UpdateProductInput): Promise<ProductWithCategory> {
    if (input.categoryId) {
      await this.ensureCategoryExists(input.categoryId);
    }
    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.softDelete(id);
    if (!deleted) {
      throw AppError.notFound('Product not found');
    }
  }

  /** Turns query-string filters into a Prisma `where` clause. */
  private buildWhere(query: ListProductsQuery): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = { gte: query.minPrice, lte: query.maxPrice };
    }

    return where;
  }

  private async ensureCategoryExists(categoryId: string): Promise<void> {
    const category = await this.categories.findById(categoryId);
    if (!category) {
      throw AppError.badRequest('Category does not exist', [
        { path: 'categoryId', message: 'Category not found' },
      ]);
    }
  }
}

export const productService = new ProductService();
