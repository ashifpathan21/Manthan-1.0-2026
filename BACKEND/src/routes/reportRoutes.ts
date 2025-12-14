import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { createReport, deleteReport, getReportsByJob } from "../controllers/reportController.js";

const router = express.Router();

router.post('/', authMiddleware, createReport);
router.get('/:jobId', authMiddleware, getReportsByJob);
router.delete('/:id', authMiddleware, deleteReport);

export default router 