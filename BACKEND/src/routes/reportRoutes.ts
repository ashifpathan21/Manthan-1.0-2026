import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { createReport, deleteReport, getReports, getReportsById } from "../controllers/reportController.js";

const router = express.Router();

router.post('/', authMiddleware, createReport);
router.get('/:id', authMiddleware, getReportsById);
router.get('/' , authMiddleware , getReports)
router.delete('/:id', authMiddleware, deleteReport);

export default router 