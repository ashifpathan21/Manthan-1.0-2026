import express from "express"
import multer from "multer";
import { deleteResume, uploadResume } from "../controllers/resumeController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";


const upload = multer({ dest: 'uploads/' })
const router = express.Router();

router.post('/upload/:id', upload.single("file"), authMiddleware, uploadResume);
router.delete("/:id", authMiddleware, deleteResume)


export default router