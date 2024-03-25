import { Router } from 'express';
import { health, helloWorld } from '../controllers/health.controller';
import { sendOTP, verifyOTP } from '../controllers/user.controller';
import isLoggedIn from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asynchandler';
import fileRouter from './file.route';
import folderRouter from './folder.route';

const v1Router = Router();

v1Router.get('/', asyncHandler(helloWorld));
v1Router.get('/health', isLoggedIn, asyncHandler(health));
v1Router.post('/send-otp', asyncHandler(sendOTP));
v1Router.post('/verify-otp', asyncHandler(verifyOTP));
v1Router.use('/files', fileRouter);
v1Router.use('/folders', folderRouter);

export default v1Router;