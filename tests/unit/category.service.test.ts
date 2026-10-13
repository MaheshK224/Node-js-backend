import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CategoryService } from '../../src/api/v1/modules/categories/category.service.js';
import type { Category } from '../../src/generated/prisma/client.js';
import { AppError } from '../../src/utils/AppError.js';

/**
 * Unit test: the service is tested with a FAKE repository, so no database is needed.
 * This is why the repository is injected through the constructor.
 */
const category: Category = {
  id: '0b6f7c1e-4d2a-4f53-9a3e-2f1d6c8b9a10',
  name: 'Electronics',
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createFakeRepository() {
  return {
    findMany: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    countActiveProducts: vi.fn(),
  };
}

describe('CategoryService', () => {
  let repository: ReturnType<typeof createFakeRepository>;
  let service: CategoryService;

  beforeEach(() => {
    repository = createFakeRepository();
    service = new CategoryService(repository);
  });

  it('getById returns the category when it exists', async () => {
    repository.findById.mockResolvedValue(category);
    await expect(service.getById(category.id)).resolves.toEqual(category);
  });

  it('getById throws 404 when the category does not exist', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.getById(category.id)).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });

  it('delete refuses when the category still has products', async () => {
    repository.findById.mockResolvedValue(category);
    repository.countActiveProducts.mockResolvedValue(3);

    await expect(service.delete(category.id)).rejects.toBeInstanceOf(AppError);
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('delete removes an empty category', async () => {
    repository.findById.mockResolvedValue(category);
    repository.countActiveProducts.mockResolvedValue(0);

    await service.delete(category.id);
    expect(repository.delete).toHaveBeenCalledWith(category.id);
  });

  it('list returns items with pagination meta', async () => {
    repository.findMany.mockResolvedValue([[category], 1]);

    const result = await service.list({ page: 1, limit: 10, sort: { name: 'asc' } });

    expect(result.items).toEqual([category]);
    expect(result.pagination.totalItems).toBe(1);
    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10, orderBy: { name: 'asc' } }),
    );
  });
});
