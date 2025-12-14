import express from "express"
import ResumeRoutes from "./routes/resumeRoutes.js"
import FolderRoutes from "./routes/folderRoutes.js"
import AuthRoutes from "./routes/authRoutes.js"
import { config } from "dotenv"
import { connectDB } from "./utils/db.js";

config();
connectDB();





const app = express();

//middlewares
app.use(express.json());

//routes
app.use("/api/v1/auth", AuthRoutes)
app.use("/api/v1/folder", FolderRoutes)
app.use("/api/v1/resume", ResumeRoutes)

const PORT = process.env.PORT ?? 4000;

app.listen(PORT, () => {
    console.log(`Server is Running on https://localhost:${PORT}`);
})