import mongoose from "mongoose";

const applicantSchema = new mongoose.Schema({
    resume: {
        type: mongoose.Types.ObjectId,
        ref: "Resume",
        required: true
    },
    verdict: { type: String },
    score: { type: Number },
    jobProfile: {
        type: mongoose.Types.ObjectId,
        ref: "Job",
        required: true
    },
    status: {
        type: String,
        enum: ["PENDING", "UNVERIFIED", "PROCESSING", "VERIFIED", "FAILED"],
        default: "PENDING"
    },
    name: {
        type: String,
    },
    location: {
        type: String
    },
    skills: [{
        type: String
    }],
    experience: [{
        title: { type: String, required: true },
        description: { type: String, required: true },
        company: { type: String, required: true },
        duration: { type: Number, required: true },
        project: {
            title: { type: String },
            description: { type: String },
            link: { type: String }
        },
    }],
    qualifications: [{
        institute: { type: String },
        description: { type: String },
        course: { type: String },
        marks: { type: Number },

    }],
    projects: [{
        title: { type: String },
        description: { type: String },
        link: { type: String }
    }],
    certificates: [{
        title: String,
        link: String
    }],
    social: {
        linkedin: String,
        email: String,
        Phone: String,
        github: String,
        leetcode: String,
        codolio: String,
        codeforces: String,
        codechef: String,
        gfg: String,
        otherLinks: [{ type: String }]
    },
    failureReason: String,
    authentication: [{ type: Object }],
    createdFor:{
       type: mongoose.Types.ObjectId,
        ref:"Report",
        required: true
    },
    createdAt: { type: Date, dafault: Date.now },
    createdBy: {
        type: mongoose.Types.ObjectId,
        ref:"User",
        required: true
    }
})

export default mongoose.model("Applicant", applicantSchema)