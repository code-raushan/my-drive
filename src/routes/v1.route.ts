import { Router } from 'express';
import { health, helloWorld } from '../controllers/health.controller';
import { sendOTP, verifyOTP } from '../controllers/user.controller';
import { asyncHandler } from '../utils/asynchandler';

const v1Router = Router();

v1Router.get('/', asyncHandler(helloWorld));
v1Router.get('/health', asyncHandler(health));
v1Router.post('/send-otp', asyncHandler(sendOTP));
v1Router.post('/verify-otp', asyncHandler(verifyOTP));

export default v1Router;