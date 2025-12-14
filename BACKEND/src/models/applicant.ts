import mongoose from "mongoose";

const applicantSchema = new mongoose.Schema({
    resume: {
        type: mongoose.Types.ObjectId,
        ref: "Resume",
        required: true
    },
    jobProfile: {
        type: mongoose.Types.ObjectId,
        ref: "Job",
        required: true
    },
    name: {
        type: String,
        required: true
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
        otherLinks: [{ type: String }]
    }
})

export default mongoose.model("Applicant", applicantSchema)