import { Router } from "express";
import { refreshToken, sendOTP, verifyOTP } from "../controllers/user.controller";
import { asyncHandler } from "../utils/asynchandler";


const authRouter = Router();

authRouter.post("/send-otp", asyncHandler(sendOTP));
authRouter.post("/verify-otp", asyncHandler(verifyOTP));
authRouter.post("/refresh-token", asyncHandler(refreshToken));

export default authRouter;