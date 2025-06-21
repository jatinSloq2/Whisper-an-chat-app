import {Router} from "express"
import { verifyToken } from '../middlewares/authMiddleware.js';
import { addContact, getAllContacts, getContactsDmList, searchContacts } from "../controller/contacts.controller.js";

const contactRouter = Router()

contactRouter.post("/search", verifyToken, searchContacts);
contactRouter.get("/get-contacts-for-dm-list" ,verifyToken, getContactsDmList)
contactRouter.get("/get-all-contacts", verifyToken , getAllContacts)
contactRouter.post("/add-new-contact", verifyToken , addContact)

export default contactRouter