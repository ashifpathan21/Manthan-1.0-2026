import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { projectAnalysis, verifyApplicantById } from "../controllers/applicantController.js";
const router = express.Router();

router.post('/:id', authMiddleware, verifyApplicantById)
router.post('/project/analyse', authMiddleware, projectAnalysis)


export default router 