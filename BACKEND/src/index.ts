import { config } from "dotenv"
config();
import express, { type NextFunction, type Request, type Response } from "express"
import "./models/index.js"
import AuthRoutes from "./routes/authRoutes.js"
import FolderRoutes from "./routes/folderRoutes.js"
import ResumeRoutes from "./routes/resumeRoutes.js"
import JobRoutes from "./routes/jobRoutes.js"
import ReportRoutes from "./routes/reportRoutes.js"
import ApplicantRoutes from "./routes/applicantRoutes.js"
import { connectDB } from "./utils/db.js";
import { processPendingResumes } from "./controllers/automationController.js"
import cors from "cors";


await connectDB();
processPendingResumes()

const app = express();

if (!process.env.CLIENT_URL) {
    throw new Error("CLIENT_URL is not defined in environment variables");
}
app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on("finish", () => {
        const time = Date.now() - start;
        console.log(
            `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${time}ms)`
        );
    });

    next();
});
//middlewares
app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_URL,
}));

//routes
app.use("/api/v1/auth", AuthRoutes)
app.use("/api/v1/folder", FolderRoutes)
app.use("/api/v1/resume", ResumeRoutes)
app.use("/api/v1/job", JobRoutes)
app.use("/api/v1/report", ReportRoutes)
app.use("/api/v1/applicant", ApplicantRoutes)


const PORT = process.env.PORT ?? 4000;

app.listen(PORT, () => {
    console.log(`Server is Running on https://localhost:${PORT}`);
})