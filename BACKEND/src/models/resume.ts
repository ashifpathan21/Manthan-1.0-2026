import mongoose from "mongoose";

const ResumeSchema = new mongoose.Schema({
    folderId: { type: mongoose.Types.ObjectId, ref: "Folder" },
    originalName: String,
    localPath: String,
    status: {
        type: String,
        enum: ["PENDING", "PROCESSING", "DONE", "FAILED"],
        default: "PENDING"
    },
    retries: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    errorReason: String,
    cloudinary: {
        url: String,
        publicId: String
    },
    extracted: {
        text: String,
        links: Object,
        metadata: Object
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});


export default mongoose.model("Resume", ResumeSchema);