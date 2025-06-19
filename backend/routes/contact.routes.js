import {Router} from "express"
import { verifyToken } from '../middlewares/authMiddleware.js';
import { searchContacts } from "../controller/contacts.controller.js";

const contactRouter = Router()

contactRouter.post("/search", verifyToken, searchContacts)

export default contactRouter