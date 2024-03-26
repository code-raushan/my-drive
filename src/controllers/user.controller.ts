import { NextFunction, Request, Response } from "express";
import authService from "../services/auth.service";

export const sendOTP = async (req: Request, res: Response, next: NextFunction) => {
  const phoneNumber = req.body.phoneNumber;

  const response = await authService.sendOtp(phoneNumber);

  next(response);
};

export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
  const phoneNumber = req.body.phoneNumber;
  const code = req.body.code;
  const session = req.body.session;


  const response = await authService.verifyOtp(phoneNumber, code, session);

  next(response);
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  const refreshToken = req.body.refreshToken as string;

  const response = await authService.refreshToken(refreshToken);

  next(response);
};