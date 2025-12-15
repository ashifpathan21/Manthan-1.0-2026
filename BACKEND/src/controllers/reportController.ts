
import type { Request, Response } from "express";
import ReportModel from "../models/report.js";
import JobModel from "../models/job.js";
import FolderModel from "../models/folder.js";
import ApplicantModel from "../models/applicant.js";
import { isValidObjectId } from "../middlewares/authMiddleware.js";

/* --------------------------------------------------
   HELPER 
-------------------------------------------------- */
type Priority = {
    skills: number;
    experience: number;
    location: number;
    qualifications: number;
    projects: number;
};

export function validatePriority(priority: Partial<Priority>) {
    const requiredFields: (keyof Priority)[] = [
        'skills',
        'experience',
        'location',
        'qualifications',
        'projects'
    ];

    // 1️⃣ Check all fields exist and are valid numbers
    for (const field of requiredFields) {
        const value = priority[field];

        if (value === undefined || value === null) {
            throw new Error(`Priority field '${field}' is required`);
        }

        if (typeof value !== 'number' || Number.isNaN(value)) {
            throw new Error(`Priority field '${field}' must be a valid number`);
        }

        if (value < 0) {
            throw new Error(`Priority field '${field}' cannot be negative`);
        }
    }

    // 2️⃣ Check total = 100
    const total =
        priority.skills! +
        priority.experience! +
        priority.location! +
        priority.qualifications! +
        priority.projects!;

    if (total !== 100) {
        throw new Error(`Priority total must be exactly 100. Received ${total}`);
    }

    return true; // explicitly valid
}


/* --------------------------------------------------
   CREATE / SEND REPORT
-------------------------------------------------- */
export const createReport = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { jobId, folderId, priority } = req.body;

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
        try {
            validatePriority(req.body.priority);
        } catch (err: any) {
            return res.status(400).json({
                success: false,
                message: err.message
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

        // Prevent duplicate reports
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

        // Create the report with status PENDING
        const report = await ReportModel.create({
            jobProfile: jobId,
            folder: folderId,
            user: userId,
            status: "PENDING"
        });

        job.reports.push(report._id);
        await job.save();

        // ✅ Create Applicant documents for each processed file
        const applicants = folder.processedFiles.map(resumeId => ({
            resume: resumeId,
            jobProfile: jobId,
            status: "PENDING",    // PENDING so automation can process later
            createdFor: report._id,
            createdBy: userId
        }));

        const createdApplicants = await ApplicantModel.insertMany(applicants);

        // Optional: push applicants to report.results if needed
        report.results = createdApplicants.map(a => a._id);
        await report.save();

        res.status(201).json({
            success: true,
            message: "Report submitted successfully with applicants",
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
export const getReportsByJob = async (req: Request, res: Response) => {
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
        }).populate("folder")
            .populate("results")
            .sort({ createdAt: -1 });


        return res.status(200).json({
            success: true,
            data: reports
        });

    } catch (error) {
        console.error("GET_REPORTS_ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch reports"
        });
    }
};


/* --------------------------------------------------
   DELETE REPORT
-------------------------------------------------- */
export const deleteReport = async (req: Request, res: Response) => {
    try {
        const { id: reportId } = req.params;
        const userId = req.user?.id;

        if (!userId || !isValidObjectId(userId)) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        if (!reportId || !isValidObjectId(reportId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid report id"
            });
        }

        const report = await ReportModel.findById(reportId);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found"
            });
        }

        // 🔐 Authorization check
        const job = await JobModel.findById(report.jobProfile);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Associated job not found"
            });
        }

        const isJobOwner =
            job.createdBy.toString() === userId.toString();

        const isReportOwner =
            report.user.toString() === userId.toString();

        if (!isJobOwner && !isReportOwner) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to delete this report"
            });
        }

        // 🧹 Remove report reference from Job
        job.reports = job.reports.filter(
            rId => rId.toString() !== report._id.toString()
        );
        await job.save();

        // ❌ Delete report
        await ReportModel.findByIdAndDelete(report._id);

        return res.status(200).json({
            success: true,
            message: "Report deleted successfully"
        });

    } catch (error) {
        console.error("DELETE_REPORT_ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete report"
        });
    }
};