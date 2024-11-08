import express from 'express';
import { forgetPassword, signIn, signUp } from '../controllers/user-controller';
import { PATH_FORGET_PASSWORD, PATH_SIGN_IN, PATH_SIGN_UP } from '../common/constants/routes';

const userRouter = express.Router();

userRouter.post(PATH_SIGN_IN, signIn);
userRouter.post(PATH_SIGN_UP, signUp);
userRouter.post(PATH_FORGET_PASSWORD, forgetPassword);

export default userRouter;