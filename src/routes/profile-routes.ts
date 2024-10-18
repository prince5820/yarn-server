import express from 'express'
import { getUserById, updateUser } from '../controllers/profile-controller';
import { PATH_GET_USER_BY_ID, PATH_UPDATE_USER } from '../common/constants/routes';

const profileRouter = express.Router()

profileRouter.get(PATH_GET_USER_BY_ID, getUserById)
profileRouter.put(PATH_UPDATE_USER, updateUser)

export default profileRouter;