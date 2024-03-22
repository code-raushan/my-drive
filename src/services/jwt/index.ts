import jwt from 'jsonwebtoken';
import config from '../../config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const signJWT = (data: any, time: string): string => {
  return jwt.sign(data, config.CLIENT_JWT_SECRET, {
    expiresIn: time
  });
};

export const verifyJWT = async (token: string, secret: string) => {
  return jwt.verify(token, secret);
};