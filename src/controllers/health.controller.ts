import { NextFunction, Request, Response } from 'express';
import os from 'os';
import config from '../config';
//@ts-ignore
import { default as pjson } from '../../package.json';
import { NotFoundError } from '../errors/not-found.error';
import redisClient from '../services/cache';

const instanceRandomID = Math.random().toString();

export const notFound = () => {
  throw new NotFoundError('Route not found');
};

export const helloWorld = (req: Request, res: Response, next: NextFunction) => {
  let all = {};
  if (req.query.all) {
    all = { ...all, totalmem: os.totalmem() / 1000000000, freemem: os.freemem() / 1000000000 };
  }
  next({
    message: 'Hello from Your-Own-Drive-System',
    env: config.NODE_ENV,
    instance: instanceRandomID,
    version: pjson.version,
    all
  });
};

export const health = async (req: Request, res: Response, next: NextFunction) => {
  const key = 'healthCheck';
  await redisClient.setEx(key, 100, 'ok');
  // const cached = await redisClient.get(key);
  await redisClient.del(key);
  next({
    // redis: cached,
    status: 'working'
  });
};

