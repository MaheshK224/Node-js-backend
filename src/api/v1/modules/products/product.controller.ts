import type { Request, Response } from 'express';

import { sendCreated, sendNoContent, sendSuccess } from '../../../../utils/apiResponse.js';

import type {
  CreateProductInput,
  ListProductsQuery,
  ProductIdParams,
  UpdateProductInput,
} from './product.schema.js';
import { productService } from './product.service.js';

export const productController = {
  list: async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as ListProductsQuery;
    const { items, pagination } = await productService.list(query);
    sendSuccess(res, items, { pagination });
  },

  getById: async (req: Request<ProductIdParams>, res: Response): Promise<void> => {
    const product = await productService.getById(req.params.id);
    sendSuccess(res, product);
  },

  create: async (
    req: Request<unknown, unknown, CreateProductInput>,
    res: Response,
  ): Promise<void> => {
    const product = await productService.create(req.body);
    sendCreated(res, product);
  },

  update: async (
    req: Request<ProductIdParams, unknown, UpdateProductInput>,
    res: Response,
  ): Promise<void> => {
    const product = await productService.update(req.params.id, req.body);
    sendSuccess(res, product);
  },

  remove: async (req: Request<ProductIdParams>, res: Response): Promise<void> => {
    await productService.delete(req.params.id);
    sendNoContent(res);
  },
};
