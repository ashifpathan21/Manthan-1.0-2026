import express from "express"
import multer from "multer";
import { uploadResume } from "../controllers/resumeController.js";


const upload = multer({ dest: 'uploads/' })
const router = express.Router();

router.post('/upload/:id', upload.single("file"), uploadResume);




export default router