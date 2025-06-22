import express from 'express';
import { getUserInfo, login,updateProfile, addProfileImage, removeProfileImage, logout, signupRequest, verifyAndSignup } from '../controller/auth.controller.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import multer from 'multer';

const authRouter = express.Router();
export const upload = multer({ dest: 'uploads/profiles/' });


authRouter.post("/signup-request", signupRequest);
authRouter.post("/verify-otp", verifyAndSignup);
authRouter.post("/login", login);
authRouter.get("/user-info", verifyToken, getUserInfo);
authRouter.put("/update-user-info", verifyToken, updateProfile);
authRouter.put("/upload-profile-image", verifyToken, upload.single("profileImage"), addProfileImage)
authRouter.delete("/remove-profile-image", verifyToken, removeProfileImage);
authRouter.post("/logout",logout)

export default authRouter;

// authRouter.post('/signup', signup);