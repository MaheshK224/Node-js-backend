import { Router } from 'express';

import { validate } from '../../../../middlewares/validate.js';

import { productController } from './product.controller.js';
import {
  createProductSchema,
  listProductsQuerySchema,
  productIdParamsSchema,
  updateProductSchema,
} from './product.schema.js';

export const productRouter = Router();

productRouter.get('/', validate({ query: listProductsQuerySchema }), productController.list);
productRouter.get('/:id', validate({ params: productIdParamsSchema }), productController.getById);
productRouter.post('/', validate({ body: createProductSchema }), productController.create);
productRouter.patch(
  '/:id',
  validate({ params: productIdParamsSchema, body: updateProductSchema }),
  productController.update,
);
productRouter.delete('/:id', validate({ params: productIdParamsSchema }), productController.remove);
