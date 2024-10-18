import express from 'express';
import { addAutoPay, deleteAutoPay, getAutoPayByPaymentId, getAutoPayByUserId, updateAutoPay } from '../controllers/auto-pay-controller';
import { PATH_ADD_AUTO_PAY, PATH_DELETE_AUTO_PAY, PATH_EDIT_AUTO_PAY, PATH_GET_AUTO_PAY, PATH_GET_AUTO_PAY_BY_ID } from '../common/constants/routes';

const autoPayRouter = express.Router();

autoPayRouter.get(PATH_GET_AUTO_PAY, getAutoPayByUserId);
autoPayRouter.get(PATH_GET_AUTO_PAY_BY_ID, getAutoPayByPaymentId);
autoPayRouter.post(PATH_ADD_AUTO_PAY, addAutoPay);
autoPayRouter.post(PATH_EDIT_AUTO_PAY, updateAutoPay);
autoPayRouter.delete(PATH_DELETE_AUTO_PAY, deleteAutoPay);

export default autoPayRouter;