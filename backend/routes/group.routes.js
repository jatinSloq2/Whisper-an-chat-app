import { Router } from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { createGroup, getUserGroups } from "../controller/group.controller.js";

const groupRouter = Router()

groupRouter.post("/create-group", verifyToken, createGroup)
groupRouter.get("/get-user-groups", verifyToken, getUserGroups)

export default groupRouter