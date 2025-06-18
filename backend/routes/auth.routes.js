import express from 'express';
import { getUserInfo, login, signup, updateProfile } from '../controller/auth.controller.js';
import { get } from 'mongoose';
import { verifyToken } from '../middlewares/authMiddleware.js';

const authRouter = express.Router();

authRouter.post('/signup', signup);
authRouter.post("/login", login);
authRouter.get("/user-info", verifyToken, getUserInfo);
authRouter.put("/update-user-info", verifyToken, updateProfile);

export default authRouter;
