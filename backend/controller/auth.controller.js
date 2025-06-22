import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { otpStore } from "../utils/otpStore.js";
import bcryptjs from "bcryptjs";
import { renameSync, unlinkSync } from "fs";
import { sendEmailOtp } from "../utils/emailService.js";
import { sendSmsOtp } from "../utils/smsService.js"

const maxAge = 3 * 24 * 60 * 60;
export const createToken = (user) => {
    return jwt.sign(
        {
            userId: user._id,
            email: user.email,
            phoneNo: user.phoneNo,
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "3d" }
    );
};

export const signupRequest = async (req, res) => {
    try {
        let { email, phoneNo, password } = req.body;
        if (!phoneNo) return res.status(400).json({ message: "Phone number is required" });
        if (!email) return res.status(400).json({ message: "Email is required" });
        if (!password) return res.status(400).json({ message: "Password is required" });
        phoneNo = phoneNo.trim();
        if (!/^\d{10}$/.test(phoneNo)) {
            return res.status(400).json({ message: "Invalid phone number format" });
        }
        const existingUserEmail = await User.findOne({ email });
        if (existingUserEmail) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const existingUserPhone = await User.findOne({ phoneNo });
        if (existingUserPhone) {
            return res.status(400).json({ message: "Phone number already exists" });
        }
        const emailOTP = Math.floor(100000 + Math.random() * 900000).toString();
        const phoneOTP = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000;

        otpStore[email] = {
            phoneNo,
            password,
            emailOTP,
            phoneOTP,
            expiresAt,
        };
        const fullPhoneNo = `+91${phoneNo}`;
        await sendEmailOtp(email, emailOTP);
        //  ⚠️ TODO: REMOVE OTPs FROM RESPONSE BEFORE DEPLOYMENT
        // await sendSmsOtp(fullPhoneNo, phoneOTP);
        return res.status(200).json({ message: `OTP sent to email and phone emailOTP :${emailOTP} PhoneOTP:${phoneOTP} ` });
    } catch (error) {
        console.error("Signup request error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const verifyAndSignup = async (req, res) => {
    try {
        const { email, emailOTP, phoneOTP } = req.body;
        const entry = otpStore[email];

        if (!entry) {
            return res.status(400).json({ message: "Signup request not found or expired" });
        }

        if (Date.now() > entry.expiresAt) {
            delete otpStore[email];
            return res.status(400).json({ message: "OTP expired" });
        }

        if (entry.emailOTP !== emailOTP || entry.phoneOTP !== phoneOTP) {
            return res.status(400).json({ message: "Invalid OTPs provided" });
        }

        const newUser = new User({
            email,
            phoneNo: entry.phoneNo,
            password: entry.password,
        });

        await newUser.save();
        delete otpStore[email];

        const token = generateJwtToken(newUser.id);
        const maxAge = 3 * 24 * 60 * 60;

        res.cookie("jwt", token, {
            httpOnly: true,
            maxAge: maxAge * 1000,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        return res.status(201).json({
            message: "User created successfully",
            user: {
                id: newUser.id,
                email: newUser.email,
                phoneNo: newUser.phoneNo,
                firstName: newUser.firstName || "",
                lastName: newUser.lastName || "",
                image: newUser.image || "",
                profileSetup: newUser.profileSetup || false,
            },
        });
    } catch (error) {
        console.error("OTP verification error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: "Email or phone and password are required" });
        }
        const user = await User.findOne({
            $or: [{ email: identifier }, { phoneNo: identifier }],
        });

        if (!user) {
            return res.status(404).json({ message: "Ohh! you are not registred yet" });
        }

        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        const token = createToken(user);

        res.cookie("jwt", token, {
            httpOnly: true,
            maxAge: maxAge * 1000,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        res.status(200).json({
            message: "Login successful",
            user: {
                email: user.email,
                phoneNo: user.phoneNo,
                id: user.id,
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                image: user.image || "",
                profileSetup: user.profileSetup || false,
                color: user.color || "",
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
export const getUserInfo = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
            message: "Login successful",
            user: {
                email: user.email,
                phoneNo: user.phoneNo,
                id: user.id,
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                image: user.image || "",
                profileSetup: user.profileSetup || false,
                color: user.color || ""

            }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}
export const updateProfile = async (req, res) => {
    console.log("User ID:", req.userId);
    try {
        const userId = req.userId;
        const { firstName, lastName, color } = req.body;
        if (!firstName || !lastName || color === undefined) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const userData = await User.findByIdAndUpdate(userId, {
            firstName,
            lastName,
            color,
            profileSetup: true
        }, { new: true, runValidators: true });
        res.status(200).json({
            message: "Profile updated successfully",
            user: userData
        });

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }
}
export const addProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const date = new Date();
        const fileName = "uploads/files/" + date.getTime() + "-" + req.file.originalname;
        renameSync(req.file.path, fileName);
        const updatedUser = await User.findByIdAndUpdate(req.userId, {
            image: fileName
        }, { new: true, runValidators: true });

        return res.status(200).json({
            image: updatedUser.image,
        })

    } catch (error) {
        console.error("Error uploading profile image:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
export const removeProfileImage = async (req, res) => {
    const userId = req.userId;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.image) {
            unlinkSync(user.image);
        }
        user.image = null;
        await user.save()
        return res.status(200).json({
            message: "Image removed succesfully"
        })
    } catch (error) {
        console.error("Error removing profile image:", error);
        return res.status(500).json({ message: "Server error" });

    }
}
export const logout = (req, res) => {
    try {
        res.clearCookie("jwt", "", {
            httpOnly: true,
            secure: false,
            sameSite: "Lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });
        return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
















// export const signup = async (req, res) => {
//     try {
//         const { email, phoneNo, password } = req.body;

//         if (!email || !password || !phoneNo) {
//             return res.status(400).json({ message: "Email, phone number, and password are required" });
//         }
//         const existingEmail = await User.findOne({ email });
//         if (existingEmail) {
//             return res.status(400).json({ message: "Email already in use" });
//         }
//         const existingPhone = await User.findOne({ phoneNo });
//         if (existingPhone) {
//             return res.status(400).json({ message: "Phone number already in use" });
//         }
//         const newUser = await User.create({ email, phoneNo, password });
//         const token = createToken(newUser);
//         res.cookie("jwt", token, {
//             httpOnly: true,
//             maxAge: maxAge * 1000,
//             secure: process.env.NODE_ENV === "production",
//             sameSite: "strict"
//         });
//         res.status(201).json({
//             message: "User created successfully",
//             user: {
//                 email: newUser.email,
//                 phoneNo: newUser.phoneNo,
//                 id: newUser.id,
//                 firstName: newUser.firstName || "",
//                 lastName: newUser.lastName || "",
//                 image: newUser.image || "",
//                 profileSetup: newUser.profileSetup || false
//             }
//         });

//     } catch (error) {
//         console.error("Signup error:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// };