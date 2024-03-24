import { Router } from "express";
import { getFileInfo, listAllFiles, uploadFile } from "../controllers/file.controller";
import { asyncHandler } from "../utils/asynchandler";
import { upload } from "../utils/multer.util";

const fileRouter = Router();

fileRouter.post('/upload', upload.single('file'), asyncHandler(uploadFile));
fileRouter.get('/list', asyncHandler(listAllFiles));
fileRouter.get('/:fileId', asyncHandler(getFileInfo));

export default fileRouter;