import type { Category, Prisma } from '../../../../generated/prisma/client.js';
import { AppError } from '../../../../utils/AppError.js';
import {
  buildPaginationMeta,
  toSkipTake,
  type PaginationMeta,
} from '../../../../utils/pagination.js';

import { categoryRepository, type CategoryRepository } from './category.repository.js';
import type {
  CreateCategoryInput,
  ListCategoriesQuery,
  UpdateCategoryInput,
} from './category.schema.js';

/**
 * Service = business rules. It knows nothing about HTTP (no req/res here),
 * which makes it easy to unit test and to reuse (e.g. from a background job).
 *
 * The repository is injected through the constructor so tests can pass a fake one.
 */
export class CategoryService {
  constructor(private readonly repository: CategoryRepository = categoryRepository) {}

  async list(
    query: ListCategoriesQuery,
  ): Promise<{ items: Category[]; pagination: PaginationMeta }> {
    const where: Prisma.CategoryWhereInput = query.search
      ? { name: { contains: query.search, mode: 'insensitive' } }
      : {};

    const [items, total] = await this.repository.findMany({
      where,
      orderBy: query.sort,
      ...toSkipTake(query),
    });

    return { items, pagination: buildPaginationMeta(query, total) };
  }

  async getById(id: string): Promise<Category> {
    const category = await this.repository.findById(id);
    if (!category) {
      throw AppError.notFound('Category not found');
    }
    return category;
  }

  create(input: CreateCategoryInput): Promise<Category> {
    // Duplicate names are rejected by the unique index -> P2002 -> 409 in the error handler.
    return this.repository.create(input);
  }

  async update(id: string, input: UpdateCategoryInput): Promise<Category> {
    await this.getById(id);
    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);

    const productCount = await this.repository.countActiveProducts(id);
    if (productCount > 0) {
      throw AppError.conflict(
        `Category has ${productCount} product(s). Move or delete them before deleting the category.`,
      );
    }

    await this.repository.delete(id);
  }
}

export const categoryService = new CategoryService();
