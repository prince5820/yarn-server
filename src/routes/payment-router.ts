import express from 'express';
import { PATH_ANALYZE_PAYMENT, PATH_CREATE_PAYMENT, PATH_DELETE_PAYMENT, PATH_GENERATE_PAYMENT_PDF, PATH_GET_PAYMENT_BY_USER_ID, PATH_UPDATE_PAYMENT } from '../common/constants/routes';
import { analyzePayment, createPayment, deletePayment, downloadPdfPaymentData, getPaymentsByUserId, updatePayment } from '../controllers/payment-controller';

const paymentRouter = express.Router();

paymentRouter.get(PATH_GET_PAYMENT_BY_USER_ID, getPaymentsByUserId);
paymentRouter.post(PATH_CREATE_PAYMENT, createPayment);
paymentRouter.put(PATH_UPDATE_PAYMENT, updatePayment);
paymentRouter.delete(PATH_DELETE_PAYMENT, deletePayment);
paymentRouter.post(PATH_ANALYZE_PAYMENT, analyzePayment);
paymentRouter.post(PATH_GENERATE_PAYMENT_PDF, downloadPdfPaymentData);

export default paymentRouter;