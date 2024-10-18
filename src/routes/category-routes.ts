import express from 'express';
import { createCategory, deleteCategory, getCategoriesByUserId, updateCategory } from '../controllers/category-controller';
import { PATH_CREATE_CATEGORY, PATH_DELETE_CATEGORY, PATH_GET_CATEGORY_BY_USER_ID, PATH_UPDATE_CATEGORY } from '../common/constants/routes';

const categoryRouter = express.Router();

categoryRouter.get(PATH_GET_CATEGORY_BY_USER_ID, getCategoriesByUserId);
categoryRouter.post(PATH_CREATE_CATEGORY, createCategory);
categoryRouter.put(PATH_UPDATE_CATEGORY, updateCategory);
categoryRouter.delete(PATH_DELETE_CATEGORY, deleteCategory);

export default categoryRouter;