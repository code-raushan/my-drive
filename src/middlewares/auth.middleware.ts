import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import jwskClient from 'jwks-rsa';
import config from '../config';

const client = jwskClient({
  jwksUri: config.COGNITO_TOKEN_SIGNING_URL
});

const isLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { header } = jwt.decode(token, { complete: true }) as any;
    const key = client.getSigningKey(header.kid);
    const signingKey = (await key).getPublicKey();
    const decoded: jwt.JwtPayload = jwt.verify(token, signingKey, { algorithms: ['RS256'] }) as jwt.JwtPayload;
    req.user = {
      id: decoded['custom:userId']
    };
    next();
  } catch (error) {
    console.error('Error in isLoggedIn:', error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export default isLoggedIn;