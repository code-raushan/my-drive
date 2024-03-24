import { NextFunction, Request, Response } from 'express';
import fileService from '../services/file.service';

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
    const userId = '97e3c12a-e0f0-4195-b0bc-cc6c3e9ab632' || req.user.id;
    const file = req.file as Express.Multer.File;

    const response = await fileService.uploadFile({ userId, file });

    next(response)
}

export const getFileInfo = async (req: Request, res: Response, next: NextFunction) => {
    const userId = '97e3c12a-e0f0-4195-b0bc-cc6c3e9ab632' || req.user.id;
    const fileId = req.params.fileId;

    const response = await fileService.getFileInfo({ ownerId: userId, fileId });

    next(response);
}

export const listAllFiles = async (req: Request, res: Response, next: NextFunction) => {
    const userId = '97e3c12a-e0f0-4195-b0bc-cc6c3e9ab632' || req.user.id;

    const response = await fileService.listAllFiles(userId);

    next(response);
}

export const deleteFile = async (req: Request, res: Response, next: NextFunction) => {
    const userId = '97e3c12a-e0f0-4195-b0bc-cc6c3e9ab632' || req.user.id;
    const fileId = req.params.fileId;

    const response = await fileService.deleteFile({ ownerId: userId, fileId });

    next(response);
}