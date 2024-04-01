import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import config from "../config";
import logger from "../utils/logger";

const isLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded: jwt.JwtPayload = jwt.verify(token, config.CLIENT_JWT_SECRET) as jwt.JwtPayload;
    req.user = {
      id: decoded["userId"]
    };

    next();
  } catch (error) {
    logger.error(`Error in isLoggedIn - ${error}`);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export default isLoggedIn;