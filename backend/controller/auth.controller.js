import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { compare } from "bcryptjs";

const maxAge = 3 * 24 * 60 * 60; // 3 days in seconds
const createToken = (email, userId) => {
    return jwt.sign({ email, userId }, process.env.JWT_SECRET_KEY, {
        expiresIn: maxAge
    });
}

export const signup = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const newUser = await User.create({ email, password });
        const token = createToken(newUser.email, newUser._id);
        res.cookie("jwt", token, {
            httpOnly: true,
            maxAge: maxAge * 1000,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });
        res.status(201).json({
            message: "User created successfully",
            user: {
                email: newUser.email,
                id: newUser.id,
                firstName: newUser.firstName || "",
                lastName: newUser.lastName || "",
                image: newUser.image || "",
                profileSetup: newUser.profileSetup || false

            }
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Internal server error" });

    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email" });
        }
        const isMatch = await compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }
        const token = createToken(user.email, user._id);
        res.cookie("jwt", token, {
            httpOnly: true,
            maxAge: maxAge * 1000,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });
        res.status(200).json({
            message: "Login successful",
            user: {
                email: user.email,
                id: user.id,
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                image: user.image || "",
                profileSetup: user.profileSetup || false,
                color: user.color || ""

            }
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }
}

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
            profileSetup : true
        }, { new: true , runValidators: true });
        res.status(200).json({
            message: "Profile updated successfully",
            user: userData
        });

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }
}