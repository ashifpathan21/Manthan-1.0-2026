import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { getById, projectAnalysis, verifyApplicantById } from "../controllers/applicantController.js";
const router = express.Router();

router.post('/:id', authMiddleware, verifyApplicantById)
router.get('/:id', authMiddleware, getById)
router.post('/project/analyse', authMiddleware, projectAnalysis)


export default router 