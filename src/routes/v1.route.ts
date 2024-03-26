import { Router } from "express";
import { health, helloWorld } from "../controllers/health.controller";
import isLoggedIn from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asynchandler";
import authRouter from "./auth.route";
import fileRouter from "./file.route";
import folderRouter from "./folder.route";

const v1Router = Router();

v1Router.get("/", asyncHandler(helloWorld));
v1Router.get("/health", isLoggedIn, asyncHandler(health));
v1Router.use("/files", fileRouter);
v1Router.use("/folders", folderRouter);
v1Router.use("/auth", authRouter);

export default v1Router;