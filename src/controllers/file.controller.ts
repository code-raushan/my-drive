import { NextFunction, Request, Response } from 'express';

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;

}