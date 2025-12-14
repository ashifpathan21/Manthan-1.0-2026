import type { Request, Response } from "express"
import FolderModel from "../models/folder.js"
import ResumeModal from "../models/resume.js"
import mongoose from "mongoose";
import { deleteFromCloudinary } from "../utils/upload.js";



export const createFolder = async (req: Request, res: Response) => {
    try {
        const { title } = req.body;
        const id = req.user?.id;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user id"
            });
        }
        if (!title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please Provide a Title"
            })
        }

        const folder = await FolderModel.create({
            title: title,
            user: new mongoose.Types.ObjectId(id)
        })

        return res.status(201).json({
            success: true,
            message: "Folder Created",
            data: folder
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error
        })
    }
}

export const updateFolder = async (req: Request, res: Response) => {
    try {
        const { title } = req.body;
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid folder id"
            });
        }
        if (!title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please Provide a Title"
            })
        }

        const folder = await FolderModel.findOne({ _id: id });
        if (!folder) {
            return res.status(404).json({
                success: false,
                message: "Folder Not Found"
            })
        }

        folder.title = title;
        await folder.save();

        return res.status(201).json({
            success: true,
            message: "Folder Updated",
            data: folder
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error
        })
    }
}


export const deleteFolder = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();

    try {
        const { id } = req.params;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid folder id",
            });
        }



        const folder = await FolderModel.findById(id);
        if (!folder) {
            return res.status(404).json({
                success: false,
                message: "Folder not found",
            });
        }

        const resumes = await ResumeModal.find({ folderId: folder._id });

        for (const resume of resumes) {
            const publicId = resume.cloudinary?.publicId;

            // Only attempt delete if publicId exists
            if (!publicId) continue;

            try {
                await deleteFromCloudinary(publicId);
            } catch (err) {
                // Log and continue — NEVER throw here
                console.error(
                    `Failed to delete Cloudinary file for resume ${resume._id}:`,
                    err
                );
            }
        }

        // After cleanup attempts, remove DB records
        await ResumeModal.deleteMany({ folderId: folder._id });


        await FolderModel.findByIdAndDelete(folder._id);


        return res.status(200).json({
            success: true,
            message: "Folder deleted successfully",
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Failed to delete folder",
            error: error
        });
    }
};

export const getFolder = async (req: Request, res: Response) => {
    try {
        const id = req.user?.id;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Please Provide the token"
            })
        }

        const folders = await FolderModel.find({ user: id }).populate("totalFiles processedFiles").exec();

        return res.status(200).json({
            success: true,
            message: "Folder Fetched Successfully",
            data: folders
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error
        })
    }
}