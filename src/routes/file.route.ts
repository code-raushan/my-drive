import { Router } from "express";
import { deleteFile, getFileInfo, listAllFiles, listFilesOfFolder, uploadFile } from "../controllers/file.controller";
import { asyncHandler } from "../utils/asynchandler";
import { upload } from "../utils/multer.util";

const fileRouter = Router();

fileRouter.post("/upload", upload.single("file"), asyncHandler(uploadFile));
fileRouter.get("/list", asyncHandler(listAllFiles));
fileRouter.get("/list/:folderId", asyncHandler(listFilesOfFolder));
fileRouter.get("/:fileId", asyncHandler(getFileInfo));
fileRouter.delete("/:fileId", asyncHandler(deleteFile));

export default fileRouter;