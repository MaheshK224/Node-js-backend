import { describe, expect, it } from 'vitest';

import {
  buildPaginationMeta,
  paginationQuerySchema,
  sortQuerySchema,
  toSkipTake,
} from '../../src/utils/pagination.js';

describe('pagination utils', () => {
  it('applies defaults and converts strings to numbers', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, limit: 10 });
    expect(paginationQuerySchema.parse({ page: '3', limit: '25' })).toEqual({ page: 3, limit: 25 });
  });

  it('rejects a limit above the maximum', () => {
    expect(paginationQuerySchema.safeParse({ limit: '1000' }).success).toBe(false);
  });

  it('converts page/limit to skip/take', () => {
    expect(toSkipTake({ page: 3, limit: 20 })).toEqual({ skip: 40, take: 20 });
  });

  it('builds pagination meta', () => {
    expect(buildPaginationMeta({ page: 2, limit: 10 }, 25)).toEqual({
      page: 2,
      limit: 10,
      totalItems: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: true,
    });
  });

  it('parses sort with "-" prefix as descending', () => {
    const schema = sortQuerySchema(['name', 'price'], 'name');
    expect(schema.parse(undefined)).toEqual({ name: 'asc' });
    expect(schema.parse('-price')).toEqual({ price: 'desc' });
    expect(schema.safeParse('password').success).toBe(false);
  });
});
