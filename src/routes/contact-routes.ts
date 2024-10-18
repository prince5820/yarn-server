import express from 'express';
import { PATH_CREATE_CONTACT, PATH_DELETE_CONTACT, PATH_GET_CONTACT_BY_USER_ID, PATH_UPDATE_CONTACT } from '../common/constants/routes';
import { createContact, deleteContact, editContact, getContactByUserId } from '../controllers/contact-controller';

const contactRouter = express.Router();

contactRouter.get(PATH_GET_CONTACT_BY_USER_ID, getContactByUserId);
contactRouter.post(PATH_CREATE_CONTACT, createContact);
contactRouter.put(PATH_UPDATE_CONTACT, editContact);
contactRouter.delete(PATH_DELETE_CONTACT, deleteContact);

export default contactRouter;