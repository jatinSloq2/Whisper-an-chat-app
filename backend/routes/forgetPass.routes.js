import { Router } from "express";
import { requestOTPPass, resetPass, verifyPassOTP } from "../controller/forgetPass.controller.js";

const forgetPassRouter = Router()

forgetPassRouter.post("/request-reset-otp", requestOTPPass)
forgetPassRouter.post("/verify-reset-otp", verifyPassOTP)
forgetPassRouter.post("/reset-password", resetPass)

export default forgetPassRouter