import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    skillRequired: [{
        type: String
    }],
    experienceRequired: {
        type: Number
    },
    location: {
        type: String,
        required: true
    },
    vacancies: {
        type: Number,
        required: true
    },
    reports: [{
        type: mongoose.Types.ObjectId,
        ref: "Report"
    }],
    createdBy: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    createedAt: {
        type: Date,
        default:  Date.now 
    }
})

export default mongoose.model("Job", jobSchema)