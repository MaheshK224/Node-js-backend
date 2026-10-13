import { Router } from 'express';

import { validate } from '../../../../middlewares/validate.js';

import { categoryController } from './category.controller.js';
import {
  categoryIdParamsSchema,
  createCategorySchema,
  listCategoriesQuerySchema,
  updateCategorySchema,
} from './category.schema.js';

// When you add auth, put the middleware here, e.g. router.post('/', authenticate, authorize('admin'), ...)
export const categoryRouter = Router();

categoryRouter.get('/', validate({ query: listCategoriesQuerySchema }), categoryController.list);
categoryRouter.get(
  '/:id',
  validate({ params: categoryIdParamsSchema }),
  categoryController.getById,
);
categoryRouter.post('/', validate({ body: createCategorySchema }), categoryController.create);
categoryRouter.patch(
  '/:id',
  validate({ params: categoryIdParamsSchema, body: updateCategorySchema }),
  categoryController.update,
);
categoryRouter.delete(
  '/:id',
  validate({ params: categoryIdParamsSchema }),
  categoryController.remove,
);
