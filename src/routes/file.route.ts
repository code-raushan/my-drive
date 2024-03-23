import { Router } from "express";
import { uploadFile } from "../controllers/file.controller";
import { asyncHandler } from "../utils/asynchandler";
import { upload } from "../utils/multer.util";

const fileRouter = Router();

fileRouter.post('/', upload.single('file'), asyncHandler(uploadFile));

export default fileRouter;