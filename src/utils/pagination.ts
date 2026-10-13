import { z } from 'zod';

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

/** Reusable query params: ?page=2&limit=20 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).meta({ description: 'Page number (1-based)' }),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE)
    .meta({ description: `Items per page (max ${MAX_PAGE_SIZE})` }),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** Converts page/limit into Prisma's skip/take. */
export function toSkipTake({ page, limit }: PaginationQuery): { skip: number; take: number } {
  return { skip: (page - 1) * limit, take: limit };
}

export function buildPaginationMeta(
  { page, limit }: PaginationQuery,
  totalItems: number,
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Builds a zod schema for `?sort=field` (ascending) or `?sort=-field` (descending),
 * limited to the fields you allow. Allow-listing prevents sorting by unindexed/private columns.
 */
export function sortQuerySchema<const T extends readonly [string, ...string[]]>(
  fields: T,
  defaultSort: `${'' | '-'}${T[number]}`,
) {
  const values = fields.flatMap((field) => [field, `-${field}`]);
  return z
    .string()
    .default(defaultSort)
    .refine((value) => values.includes(value), {
      message: `sort must be one of: ${values.join(', ')}`,
    })
    .transform((value) => {
      const desc = value.startsWith('-');
      const field = (desc ? value.slice(1) : value) as T[number];
      return { [field]: desc ? 'desc' : 'asc' } as Partial<Record<T[number], 'asc' | 'desc'>>;
    })
    .meta({
      description: `Sort field, prefix with "-" for descending. Allowed: ${values.join(', ')}`,
    });
}
