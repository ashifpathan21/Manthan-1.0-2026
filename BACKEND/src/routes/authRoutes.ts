import express from "express"
import { getUser, logIn, signUp } from "../controllers/authController.js";

const router = express.Router();


router.post("/signup", signUp);
router.post("/login", logIn);
router.get("/", getUser);


export default router;