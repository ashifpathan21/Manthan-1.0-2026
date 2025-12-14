import type { Request, Response } from "express";
import ReportModel from "../models/report.js";
import JobModel from "../models/job.js";
import FolderModel from "../models/folder.js";
import { isValidObjectId } from "../middlewares/authMiddleware.js";

/* --------------------------------------------------
   CREATE / SEND REPORT
-------------------------------------------------- */
export const createReport = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { jobId, folderId } = req.body;

        if (!userId || !isValidObjectId(userId)) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        if (!jobId || !folderId ||
            !isValidObjectId(jobId) ||
            !isValidObjectId(folderId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid job or folder id"
            });
        }

        const job = await JobModel.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        const folder = await FolderModel.findOne({
            _id: folderId,
            user: userId
        });

        if (!folder) {
            return res.status(403).json({
                success: false,
                message: "Folder not found or access denied"
            });
        }

        // 🚫 Prevent duplicate reports
        const existing = await ReportModel.findOne({
            jobProfile: jobId,
            folder: folderId,
            user: userId
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Report already exists for this job and folder"
            });
        }

        const report = await ReportModel.create({
            jobProfile: jobId,
            folder: folderId,
            user: userId,
            status: "PENDING"
        });

        job.reports.push(report._id);
        await job.save();

        res.status(201).json({
            success: true,
            message: "Report submitted successfully",
            data: report
        });

    } catch (error) {
        console.error("CREATE_REPORT_ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create report"
        });
    }
};

/* --------------------------------------------------
   GET DONE REPORTS BY JOB ID
-------------------------------------------------- */
export const getDoneReportsByJob = async (req: Request, res: Response) => {
    try {
        const { jobId } = req.params;
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

        // 🔒 Only job owner can see reports
        const job = await JobModel.findOne({
            _id: jobId,
            createdBy: userId
        });

        if (!job) {
            return res.status(403).json({
                success: false,
                message: "Access denied or job not found"
            });
        }

        const reports = await ReportModel.find({
            jobProfile: jobId,
            status: "DONE"
        })
            .populate("folder")
            .populate("user")
            .populate("results")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: reports
        });

    } catch (error) {
        console.error("GET_DONE_REPORTS_ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch reports"
        });
    }
};
