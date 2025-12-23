import type { Request, Response } from "express";
import FolderModel from "../models/folder.js";
import ResumeModal from "../models/resume.js";
import { deleteFromCloudinary } from "../utils/upload.js";
import { isValidObjectId } from "../middlewares/authMiddleware.js";



/* --------------------------------------------------
   CREATE FOLDER
-------------------------------------------------- */
export const createFolder = async (req: Request, res: Response) => {
    try {
        const { title } = req.body;
        const userId = req.user?.id;

        if (!userId || !isValidObjectId(userId)) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (typeof title !== "string" || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Title is required",
            });
        }

        const folder = await FolderModel.create({
            title: title.trim(),
            user: userId,
        });

        return res.status(201).json({
            success: true,
            message: "Folder created",
            data: folder,
        });
    } catch (error) {
        console.error("CREATE_FOLDER_ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/* --------------------------------------------------
   UPDATE FOLDER
-------------------------------------------------- */
export const updateFolder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        const userId = req.user?.id;

        if (!userId || !isValidObjectId(userId)) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!id || !isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid folder id",
            });
        }

        if (typeof title !== "string" || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Title is required",
            });
        }

        const folder = await FolderModel.findOne({
            _id: id,
            user: userId,
        });

        if (!folder) {
            return res.status(404).json({
                success: false,
                message: "Folder not found or access denied",
            });
        }

        folder.title = title.trim();
        await folder.save();

        return res.status(200).json({
            success: true,
            message: "Folder updated",
            data: folder,
        });
    } catch (error) {
        console.error("UPDATE_FOLDER_ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/* --------------------------------------------------
   DELETE FOLDER
-------------------------------------------------- */
export const deleteFolder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId || !isValidObjectId(userId)) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!id || !isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid folder id",
            });
        }

        const folder = await FolderModel.findOne({
            _id: id,
            user: userId,
        });

        if (!folder) {
            return res.status(404).json({
                success: false,
                message: "Folder not found or access denied",
            });
        }

        const resumes = await ResumeModal.find({ folderId: folder._id });

        for (const resume of resumes) {
            const publicId = resume.cloudinary?.publicId;
            if (!publicId) continue;

            try {
                await deleteFromCloudinary(publicId);
            } catch (err) {
                console.error(
                    `CLOUDINARY_DELETE_FAILED [resume=${resume._id}]`,
                    err
                );
            }
        }

        await ResumeModal.deleteMany({ folderId: folder._id });
        await FolderModel.findByIdAndDelete(folder._id);

        return res.status(200).json({
            success: true,
            message: "Folder deleted successfully",
        });
    } catch (error) {
        console.error("DELETE_FOLDER_ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete folder",
        });
    }
};

/* --------------------------------------------------
   GET USER FOLDERS
-------------------------------------------------- */
export const getFolder = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId || !isValidObjectId(userId)) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const folders = await FolderModel.find({ user: userId })
            .populate("totalFiles processedFiles")
            .exec();

        return res.status(200).json({
            success: true,
            message: "Folders fetched successfully",
            data: folders,
        });
    } catch (error) {
        console.error("GET_FOLDER_ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const getFolderById = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params

        if (!userId || !isValidObjectId(userId) || !id || !isValidObjectId(id)) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const folder = await FolderModel.findOne({ user: userId, _id: id })
            .populate("totalFiles processedFiles")
            .exec();

        return res.status(200).json({
            success: true,
            message: "Folders fetched successfully",
            data: folder,
        });
    } catch (error) {
        console.error("GET_FOLDER_ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
