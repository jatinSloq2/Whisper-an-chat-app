import {Router} from "express"
import { verifyToken } from '../middlewares/authMiddleware.js';
import { getMessages, uploadFile } from "../controller/messages.controller.js"
import multer from "multer"

const msgRouter = Router()
export const upload = multer({dest : "uploads/files"})

msgRouter.post("/get-messages", verifyToken , getMessages)
msgRouter.post("/upload-file", verifyToken, upload.single("file"), uploadFile)

export default msgRouter