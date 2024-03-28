import express from "express";
import v1Router from "./v1.route";

const rootRouter = express.Router();

rootRouter.use("/", v1Router);

export default rootRouter;