import express from "express"
import "./models/index.js"
import AuthRoutes from "./routes/authRoutes.js"
import FolderRoutes from "./routes/folderRoutes.js"
import ResumeRoutes from "./routes/resumeRoutes.js"
import JobRoutes from "./routes/jobRoutes.js"
import ReportRoutes from "./routes/reportRoutes.js"
import { config } from "dotenv"
import { connectDB } from "./utils/db.js";
import { processPendingResumes } from "./controllers/automationController.js"

config();
connectDB();
processPendingResumes()

const app = express();

//middlewares
app.use(express.json());

//routes
app.use("/api/v1/auth", AuthRoutes)
app.use("/api/v1/folder", FolderRoutes)
app.use("/api/v1/resume", ResumeRoutes)
app.use("/api/v1/job", JobRoutes)
app.use("/api/v1/report", ReportRoutes)

const PORT = process.env.PORT ?? 4000;

app.listen(PORT, () => {
    console.log(`Server is Running on https://localhost:${PORT}`);
})