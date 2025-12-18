// controllers/resumeAutomation.controller.ts
import Resume from "../models/resume.js";
import Applicant from "../models/applicant.js";
import { promises as fs } from "fs";
import { extractHyperlinks, extractTextAndMetadata } from "../utils/extract.js";
import { uploadToCloudinary } from "../utils/upload.js";
import FolderModel from "../models/folder.js"


const SLEEP = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function processPendingResumes() {
    while (true) {
        let resume = null;

        try {
            // 🔒 ATOMIC LOCK (critical)
            resume = await Resume.findOneAndUpdate(
                { status: "PENDING" },
                { status: "PROCESSING" },
                { new: true }
            );

            // No work → sleep & exit loop
            if (!resume) {
                await SLEEP(2000);
                break;
            }

            console.log("Processing resume:", resume._id.toString());

            // EXTRACT (guarded)
            const { text, metadata, textLinks } =
                await extractTextAndMetadata(resume.localPath);

            const annotationLinks =
                await extractHyperlinks(resume.localPath);

            // UPLOAD (guarded)
            const uploadResult = await uploadToCloudinary(resume.localPath);

            if (!uploadResult.success) {
                throw new Error(uploadResult.error);
            }

            // SAVE RESULT
            resume.extracted = {
                text,
                links: [...new Set([...annotationLinks, ...textLinks])],
                metadata
            };

            // Safe now
            resume.cloudinary = {
                url: uploadResult.url,
                publicId: uploadResult.publicId
            };



            resume.status = "DONE";
            const folderId = resume.folderId;
            await FolderModel.findByIdAndUpdate(
                folderId,
                {
                    $addToSet: { processedFiles: resume._id }
                },
                { new: true }
            );

            await resume.save();

            // DELETE LOCAL FILE (non-fatal)
            fs.unlink(resume.localPath).catch(() => { });
        } catch (err: any) {
            if (!resume) {
                console.error("Worker error before lock:", err);
                await SLEEP(3000);
                continue;
            }

            resume.retries += 1;
            resume.errorReason = err.message || "Unknown error";

            resume.status =
                resume.retries >= resume.maxRetries
                    ? "FAILED"
                    : "PENDING";

            try {
                await resume.save();
            } catch (dbErr) {
                console.error("Failed to save error state:", dbErr);
            }
        }

        // Yield to event loop (VERY important)
        await SLEEP(300);
    }
}

