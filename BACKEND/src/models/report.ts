import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
    folder: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Folder"
    },
    user: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "User"
    },
    jobProfile: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Job"
    },
    priority: {
        skills: { type: Number, required: true },
        experience: { type: Number, required: true },
        location: { type: Number, required: true },
        qualifications: { type: Number, required: true },
        projects: { type: Number, required: true }
    },
    priorityHash: {
        type: String,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ["PENDING", "DONE", "FAILED" , "PROCESSING"],
        default: "PENDING"
    },
    results: [{
        type: mongoose.Types.ObjectId,
        ref: "Applicant"
    }]
})


export default mongoose.model("Report", reportSchema)