import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
export const sendEmailOtp = async (to, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
      },
    });

    const mailOptions = {
      from: `"Chat App" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Your Email OTP",
      html: `<p>Your verification OTP is: <strong>${otp}</strong></p>`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email OTP sent to", to);
  } catch (err) {
    console.error("Failed to send email OTP:", err);
    throw new Error("Failed to send email");
  }
};
