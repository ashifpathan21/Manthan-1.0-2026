import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { createJob, deleteJob, getUserJobs, updateJob } from "../controllers/jobController.js";

const router = express.Router()


router.post('/', authMiddleware, createJob);
router.put('/:id', authMiddleware, updateJob);
router.get('/', authMiddleware, getUserJobs);
router.delete('/:id', authMiddleware, deleteJob);

export default router ;