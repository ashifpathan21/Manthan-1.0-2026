import type { Request, Response } from "express";
import ResumeModel from "../models/resume.js";
import FolderModel from "../models/folder.js";
import { deleteFromCloudinary } from "../utils/upload.js";
import { processPendingResumes } from "./automationController.js";
import { isValidObjectId } from "../middlewares/authMiddleware.js";



/* --------------------------------------------------
   UPLOAD RESUME
-------------------------------------------------- */
export const uploadResume = async (req: Request, res: Response) => {
    try {
        const { id: folderId } = req.params;
        const file = req.file;
        const userId = req.user?.id;

        if (!userId || !isValidObjectId(userId)) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!folderId || !isValidObjectId(folderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid folder id",
            });
        }

        if (!file) {
            return res.status(400).json({
                success: false,
                message: "No resume file uploaded",
            });
        }

        // Ownership enforced at query level
        const folder = await FolderModel.findOne({
            _id: folderId,
            user: userId,
        });

        if (!folder) {
            return res.status(404).json({
                success: false,
                message: "Folder not found or access denied",
            });
        }

        const resume = await ResumeModel.create({
            folderId: folder._id,
            localPath: file.path,
            originalName: file.originalname,
            status: "PENDING",
        });

        folder.totalFiles.push(resume._id);
        await folder.save();

        res.status(201).json({
            success: true,
            message: "Resume uploaded",
            data: resume,
        });

        // Fire-and-forget automation trigger
        const pending = await ResumeModel.findOne({ status: "PENDING" });
        if (pending) {
            processPendingResumes().catch(err =>
                console.error("AUTOMATION_TRIGGER_FAILED:", err)
            );
        }
    } catch (error) {
        console.error("UPLOAD_RESUME_ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/* --------------------------------------------------
   DELETE RESUME
-------------------------------------------------- */
export const deleteResume = async (req: Request, res: Response) => {
    try {
        const { id: resumeId } = req.params;
        const userId = req.user?.id;

        if (!userId || !isValidObjectId(userId)) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!resumeId || !isValidObjectId(resumeId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid resume id",
            });
        }

        const resume = await ResumeModel.findById(resumeId);
        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found",
            });
        }

        // Ensure resume belongs to user's folder
        const folder = await FolderModel.findOne({
            _id: resume.folderId,
            user: userId,
        });

        if (!folder) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to delete this resume",
            });
        }

        const publicId = resume.cloudinary?.publicId;
        if (publicId) {
            try {
                await deleteFromCloudinary(publicId);
            } catch (err) {
                console.error(
                    `CLOUDINARY_DELETE_FAILED [resume=${resume._id}]`,
                    err
                );
            }
        }

        await ResumeModel.findByIdAndDelete(resume._id);

        folder.totalFiles = folder.totalFiles.filter(
            id => id.toString() !== resume._id.toString()
        );
        folder.processedFiles = folder.processedFiles.filter(
            id => id.toString() !== resume._id.toString()
        );
        await folder.save();

        return res.status(200).json({
            success: true,
            message: "Resume deleted successfully",
        });
    } catch (error) {
        console.error("DELETE_RESUME_ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete resume",
        });
    }
};
