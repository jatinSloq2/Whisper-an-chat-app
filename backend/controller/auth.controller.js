import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../config/cloudinary.js";
import User from "../models/userModel.js";
import { sendEmailOtp } from "../utils/emailService.js";
import { otpStore } from "../utils/otpStore.js";

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
        let { email, emailOTP, phoneOTP } = req.body;

        email = email.trim();
        emailOTP = emailOTP.trim().toString();
        phoneOTP = phoneOTP.trim().toString();

        const entry = otpStore[email];

        if (!entry) {
            return res.status(400).json({ message: "Signup request not found or expired" });
        }

        if (Date.now() > entry.expiresAt) {
            console.warn("⏳ OTP expired for:", email);
            delete otpStore[email];
            return res.status(400).json({ message: "OTP expired" });
        }

        if (entry.emailOTP.toString() !== emailOTP || entry.phoneOTP.toString() !== phoneOTP) {
            console.warn("❌ Invalid OTPs provided");
            return res.status(400).json({ message: "Invalid OTPs provided" });
        }

        const newUser = User.create({ email, phoneNo: entry.phoneNo, password: entry.password, });
        delete otpStore[email];

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
        console.error("🔥 OTP verification error:", error);
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
            secure: true,
            sameSite: "None",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
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
                color: user.color || "",
                settings: user.settings,
                language: user.language

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
        if (!req.file || !req.file.path) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const imageUrl = req.file.path;
        const publicId = req.file.filename;
        const updatedUser = await User.findByIdAndUpdate(
            req.userId,
            {
                image: imageUrl,
                imagePublicId: publicId,
            },
            { new: true, runValidators: true }
        );
        return res.status(200).json({
            image: updatedUser.image,
        });
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
        if (user.imagePublicId) {
            try {
                await cloudinary.uploader.destroy(user.imagePublicId);
            } catch (err) {
                console.warn("Cloudinary deletion failed:", err.message);
            }
        }
        user.image = "uploads/profiles/profile-picture.png";
        user.imagePublicId = "";

        await user.save();

        return res.status(200).json({
            message: "Image removed successfully",
            image: user.image,
        });
    } catch (error) {
        console.error("Error removing profile image:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
export const logout = (req, res) => {
    try {
        res.clearCookie("jwt", {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            path: '/',
        });
        return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const updateSettings = async (req, res) => {
    const userId = req.userId;
    const { settings, language } = req.body;

    if (!settings || typeof settings !== "object") {
        return res.status(400).json({ success: false, message: "Invalid settings data." });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const original = {
            sound: user.settings?.sound,
            desktopNotifications: user.settings?.desktopNotifications,
            theme: user.settings?.theme,
            language: user.language,
        };

        let isChanged = false;

        // Detect and update changed settings
        if (settings.sound !== undefined && settings.sound !== original.sound) {
            user.settings.sound = settings.sound;
            isChanged = true;
        }

        if (
            settings.desktopNotifications !== undefined &&
            settings.desktopNotifications !== original.desktopNotifications
        ) {
            user.settings.desktopNotifications = settings.desktopNotifications;
            isChanged = true;
        }

        if (settings.theme && settings.theme !== original.theme) {
            user.settings.theme = settings.theme;
            isChanged = true;
        }

        if (language && language !== original.language) {
            user.language = language;
            isChanged = true;
        }

        if (!isChanged) {
            return res.status(200).json({
                success: true,
                message: "No changes made to settings.",
                updatedSettings: {
                    settings: user.settings,
                    language: user.language,
                },
            });
        }
        user.markModified("settings");
        await user.save();
        return res.status(200).json({
            success: true,
            message: "Settings updated successfully.",
            updatedSettings: {
                settings: user.settings,
                language: user.language,
            },
        });
    } catch (error) {
        console.error("🔥 Error updating settings:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

export const allUsers = async (req, res) => {
  try {
    const users = await User.find().select("_id phoneNo email");
    res.status(200).json({ allUsers: users });
  } catch (error) {
    console.error("❌ Error fetching users:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


export const allContacts = async (req, res) => {
  try {
    const userId = req.user.id;
    const allContacts = await Contact.find({ owner: userId }).populate({
      path: "linkedUser",
      select: "-password",
    });
    res.status(200).json({ contacts: allContacts });
  } catch (error) {
    console.error("❌ Error fetching contacts:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
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