import type { Request, Response } from "express";
import JobModel from "../models/job.js";
import ReportModel from "../models/report.js"; // assumed
import { isValidObjectId } from "../middlewares/authMiddleware.js";

/* --------------------------------------------------
   CREATE JOB
-------------------------------------------------- */
export const createJob = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId || !isValidObjectId(userId)) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const {
            title,
            description,
            skillRequired,
            experienceRequired,
            location,
            vacancies
        } = req.body;

        if (!title || !location || !vacancies) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const job = await JobModel.create({
            title,
            description,
            skillRequired,
            experienceRequired,
            location,
            vacancies,
            createdBy: userId
        });

        return res.status(201).json({
            success: true,
            message: "Job created successfully",
            data: job
        });

    } catch (error) {
        console.error("CREATE_JOB_ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create job"
        });
    }
};

/* --------------------------------------------------
   UPDATE JOB
-------------------------------------------------- */
export const updateJob = async (req: Request, res: Response) => {
    try {
        const { id: jobId } = req.params;
        const userId = req.user?.id;

        if (!userId || !isValidObjectId(userId)) {
            return res.status(401).json({ success: false });
        }

        if (!jobId || !isValidObjectId(jobId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid job id"
            });
        }

        const job = await JobModel.findOne({
            _id: jobId,
            createdBy: userId
        });

        if (!job) {
            return res.status(403).json({
                success: false,
                message: "Job not found or access denied"
            });
        }

        Object.assign(job, req.body);
        await job.save();

        return res.status(200).json({
            success: true,
            message: "Job updated",
            data: job
        });

    } catch (error) {
        console.error("UPDATE_JOB_ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update job"
        });
    }
};

/* --------------------------------------------------
   DELETE JOB (WITH REPORT CLEANUP)
-------------------------------------------------- */
export const deleteJob = async (req: Request, res: Response) => {
    try {
        const { id: jobId } = req.params;
        const userId = req.user?.id;

        if (!userId || !isValidObjectId(userId)) {
            return res.status(401).json({ success: false });
        }

        if (!jobId || !isValidObjectId(jobId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid job id"
            });
        }

        const job = await JobModel.findOne({
            _id: jobId,
            createdBy: userId
        });

        if (!job) {
            return res.status(403).json({
                success: false,
                message: "Job not found or access denied"
            });
        }

        // delete associated reports
        if (job.reports?.length) {
            await ReportModel.deleteMany({
                jobProfile: job._id
            });
        }

        await JobModel.findByIdAndDelete(job._id);

        return res.status(200).json({
            success: true,
            message: "Job and related reports deleted"
        });

    } catch (error) {
        console.error("DELETE_JOB_ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete job"
        });
    }
};

/* --------------------------------------------------
   GET USER JOBS
-------------------------------------------------- */
export const getUserJobs = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId || !isValidObjectId(userId)) {
            return res.status(401).json({ success: false });
        }

        const jobs = await JobModel.find({
            createdBy: userId
        })
            .populate("reports")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: jobs
        });

    } catch (error) {
        console.error("GET_USER_JOBS_ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch jobs"
        });
    }
};
