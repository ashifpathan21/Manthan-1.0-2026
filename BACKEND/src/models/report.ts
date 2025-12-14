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
    status: {
        type: String,
        enum: ["PENDING", "DONE", "FAILED"],
        default: "PENDING"
    },
    results: [{
        type: mongoose.Types.ObjectId,
        ref: "Applicant"
    }]
})


export default mongoose.model("Report", reportSchema)