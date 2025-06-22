import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

export const sendSmsOtp = async (phone, otp) => {
  try {
    const message = await client.messages.create({
      body: `Your signup OTP is ${otp}`,
      from: process.env.TWILIO_PHONE,
      to: phone, // MUST be in international format like +91xxxxxxxxxx
    });

    console.log("✅ SMS OTP sent:", message.sid);
  } catch (err) {
    console.error("❌ Failed to send SMS OTP:", err?.message || err);
    throw new Error("Failed to send SMS");
  }
};