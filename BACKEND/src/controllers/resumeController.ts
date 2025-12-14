import ResumeModel from "../models/resume.js";
import FolderModel from "../models/folder.js"
import type { Request, Response } from "express";
import mongoose from "mongoose";


export const uploadResume = async (
    req: Request,
    res: Response,
) => {
    const { id } = req.params;
    const file = req.file;

    try {
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid folder id"
            });
        }

        if (!file) {
            return res.status(400).json({
                success: false,
                message: "No resume file uploaded"
            });
        }

        const folder = await FolderModel.findById(id);
        if (!folder) {
            return res.status(404).json({
                success: false,
                message: `No Folder Exist of id ${id}`
            });
        }

        const resume = await ResumeModel.create({
            folderId: new mongoose.Types.ObjectId(id),
            localPath: file.path,
            originalName: file.originalname,
        });

        folder.totalFiles.push(resume._id);
        await folder.save();
        res.status(201).json({
            success: true,
            data: resume,
            message: "Resume Uploaded",
            folder
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error
        })
    }
};
