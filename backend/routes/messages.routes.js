import {Router} from "express"
import { verifyToken } from '../middlewares/authMiddleware.js';
import { getMessages, uploadFile } from "../controller/messages.controller.js"
import uploadMessage from "../config/cloudinaryUploadMessage.js"

const msgRouter = Router()

msgRouter.post("/get-messages", verifyToken , getMessages)
msgRouter.post("/upload-file", verifyToken, uploadMessage.single("file"), uploadFile)

export default msgRouter