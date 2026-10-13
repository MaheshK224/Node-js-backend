import type { Request, Response } from 'express';

import { sendCreated, sendNoContent, sendSuccess } from '../../../../utils/apiResponse.js';

import type {
  CategoryIdParams,
  CreateCategoryInput,
  ListCategoriesQuery,
  UpdateCategoryInput,
} from './category.schema.js';
import { categoryService } from './category.service.js';

/**
 * Controller = HTTP layer only: read the (already validated) request, call the service,
 * send the response. No business logic and no database code here.
 *
 * Errors are simply thrown; Express 5 forwards them to the error handler.
 * Arrow functions are used so the handlers can be passed to the router without losing `this`.
 */
export const categoryController = {
  list: async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as ListCategoriesQuery;
    const { items, pagination } = await categoryService.list(query);
    sendSuccess(res, items, { pagination });
  },

  getById: async (req: Request<CategoryIdParams>, res: Response): Promise<void> => {
    const category = await categoryService.getById(req.params.id);
    sendSuccess(res, category);
  },

  create: async (
    req: Request<unknown, unknown, CreateCategoryInput>,
    res: Response,
  ): Promise<void> => {
    const category = await categoryService.create(req.body);
    sendCreated(res, category);
  },

  update: async (
    req: Request<CategoryIdParams, unknown, UpdateCategoryInput>,
    res: Response,
  ): Promise<void> => {
    const category = await categoryService.update(req.params.id, req.body);
    sendSuccess(res, category);
  },

  remove: async (req: Request<CategoryIdParams>, res: Response): Promise<void> => {
    await categoryService.delete(req.params.id);
    sendNoContent(res);
  },
};
