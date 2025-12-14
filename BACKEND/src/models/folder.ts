import mongoose from "mongoose";

const FolderSchema = new mongoose.Schema({
    title: String,
    totalFiles: [{
        type: mongoose.Types.ObjectId,
        ref: "Resume"
    }],
    user: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    processedFiles: [{
        type: mongoose.Types.ObjectId,
        ref: "Resume"
    }],
    createdAt: { type: Date, default: Date.now }
});


export default mongoose.model("Folder", FolderSchema)