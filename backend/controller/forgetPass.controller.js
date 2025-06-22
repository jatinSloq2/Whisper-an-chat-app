import User from "../models/userModel.js";
import { sendEmailOtp } from "../utils/emailService.js";

const forgotOtpStore = {}

export const requestOTPPass = async (req, res) => {
    const { identifier } = req.body;
    if (!identifier) {
        return res.status(400).json({ message: "Identifier is required" });
    }
    try {
        const user = await User.findOne({
            $or: [{ email: identifier }, { phoneNo: identifier }],
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000;
        forgotOtpStore[identifier] = {
            otp,
            expiresAt,
            userId: user._id,
        };
        if (identifier.includes("@")) {
            await sendEmailOtp(identifier, otp);
        } else {
            //   await sendSmsOtp(`+91${identifier}`, otp); 
        }
        return res.status(200).json({
            message: `OTP sent to ${identifier.includes("@") ? "email" : "phone"}  and that is ${otp}`,
            // ⚠️ REMOVE OTP BEFORE DEPLOYMENT
            otp,
        });
    } catch (error) {
        console.error("requestOTPPass error:", error);
        return res.status(500).json({ message: "Failed to send OTP" });
    }
};
export const verifyPassOTP = async (req, res) => {
    const { identifier, otppass } = req.body;

    try {
        if (!identifier || !otppass) {
            console.log("❌ Missing identifier or OTP");
            return res.status(400).json({ message: "Identifier and OTP are required" });
        }

        const stored = forgotOtpStore[identifier];
        if (!stored) {
            console.log("❌ No stored OTP found");
            return res.status(400).json({ message: "No OTP request found for this identifier" });
        }

        const { otp, expiresAt } = stored;

        if (Date.now() > expiresAt) {
            console.log("❌ OTP expired");
            delete forgotOtpStore[identifier];
            return res.status(410).json({ message: "OTP has expired. Please request a new one." });
        }

        if (otp.toString().trim() !== otppass.toString().trim()) {
            console.log("❌ OTP did not match");
            return res.status(400).json({ message: "Invalid OTP" });
        }
        return res.status(200).json({ message: "OTP verified successfully" });
    } catch (error) {
        console.error("Error verifying OTP:", error);
        return res.status(500).json({ message: "Server error while verifying OTP" });
    }
};
export const resetPass = async (req, res) => {
  const { identifier, password } = req.body;
  try {
    if (!password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const stored = forgotOtpStore[identifier];
    if (!stored) {
      return res.status(400).json({
        message: "No OTP verification found. Please verify OTP before resetting password.",
      });
    }
    const user = await User.findOne({ $or: [{ email: identifier }, { phoneNo: identifier }], });
    if (!user) return res.status(404).json({ message: "User not found" });
    // const hashedPassword = await bcryptjs.hash(password, 10);
    user.password = password;
    await user.save();
    delete forgotOtpStore[identifier];
    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ message: "Server error while resetting password" });
  }
};