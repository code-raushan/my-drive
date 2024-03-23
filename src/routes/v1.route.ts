import { Router } from 'express';
import { health, helloWorld } from '../controllers/health.controller';
import { sendOTP, verifyOTP } from '../controllers/user.controller';
import isLoggedIn from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asynchandler';
import fileRouter from './file.route';

const v1Router = Router();

v1Router.get('/', asyncHandler(helloWorld));
v1Router.get('/health', isLoggedIn, asyncHandler(health));
v1Router.post('/send-otp', asyncHandler(sendOTP));
v1Router.post('/verify-otp', asyncHandler(verifyOTP));
v1Router.use('/upload', fileRouter);

export default v1Router;