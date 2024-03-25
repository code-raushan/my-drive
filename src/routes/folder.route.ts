import { Router } from "express";
import { createFolder, deleteFolder, listAllFolders, listSubFolders, updateFolderName } from "../controllers/folder.controller";
import { asyncHandler } from "../utils/asynchandler";

const folderRouter = Router();

folderRouter.post('/', asyncHandler(createFolder));
folderRouter.get('/list', asyncHandler(listAllFolders));
folderRouter.get('/list/:folderId', asyncHandler(listSubFolders));
folderRouter.delete('/:folderId', asyncHandler(deleteFolder));
folderRouter.patch('/:folderId', asyncHandler(updateFolderName));

export default folderRouter;