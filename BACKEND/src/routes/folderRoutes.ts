import express from "express";
import { createFolder, deleteFolder, getFolder, updateFolder } from "../controllers/folderController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createFolder)
router.put("/:id", authMiddleware, updateFolder)
router.delete("/:id", authMiddleware, deleteFolder)
router.get("/", authMiddleware, getFolder)

export default router;