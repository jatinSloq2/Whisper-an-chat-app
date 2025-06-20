import {Router} from "express"
import { verifyToken } from '../middlewares/authMiddleware.js';
import { getMessages } from "../controller/messages.controller.js"

const msgRouter = Router()

msgRouter.post("/get-messages", verifyToken , getMessages)

export default msgRouter