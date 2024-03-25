import { NextFunction, Request, Response } from 'express';
import folderService from '../services/folder.service';

export const createFolder = async (req: Request, res: Response, next: NextFunction) => {
    const ownerId = '97e3c12a-e0f0-4195-b0bc-cc6c3e9ab632' || req.user.id;
    const folderName = req.body.folderName as string;

    const response = await folderService.createFolder({ ownerId, folderName });

    next(response);
}

export const listSubFolders = async (req: Request, res: Response, next: NextFunction) => {
    const ownerId = '97e3c12a-e0f0-4195-b0bc-cc6c3e9ab632' || req.user.id;
    const folderId = req.params.folderId;

    const response = await folderService.listSubFolders({ ownerId, folderId });

    next(response);
}

export const listAllFolders = async (req: Request, res: Response, next: NextFunction) => {
    const ownerId = '97e3c12a-e0f0-4195-b0bc-cc6c3e9ab632' || req.user.id;

    const response = await folderService.listAllFolders(ownerId);

    next(response);
}

export const deleteFolder = async (req: Request, res: Response, next: NextFunction) => {
    const ownerId = '97e3c12a-e0f0-4195-b0bc-cc6c3e9ab632' || req.user.id;
    const folderId = req.params.folderId;

    const response = await folderService.deleteFolder({ ownerId, folderId });

    next(response);
}

export const updateFolderName = async (req: Request, res: Response, next: NextFunction) => {
    const ownerId = '97e3c12a-e0f0-4195-b0bc-cc6c3e9ab632' || req.user.id;
    const folderId = req.params.folderId;
    const newFolderName = req.body.newFolderName as string;

    const response = await folderService.updateFolderName({ ownerId, folderId, newFolderName });

    next(response);
}