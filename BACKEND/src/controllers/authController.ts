import type { Request, Response } from "express"
import UserModel from "../models/user.js"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import { sealUser } from "../middlewares/authMiddleware.js";
import { config } from "dotenv"
config()

const JWT_PASS = process.env.JWT_PASS
if (!JWT_PASS) {
    throw new Error("JWT_PASS is not defined");
}

export const signUp = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Missing credentials" });
        }

        const existingUser = await UserModel.findOne({ username });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Username already exists",
            });
        }

        const hashedPass = await bcrypt.hash(password, 10);

        const user = await UserModel.create({
            username,
            password: hashedPass,
        });

        const token = jwt.sign(
            { id: user._id.toString() },
            JWT_PASS,
            { expiresIn: "7d" }
        );

        return res.status(201).json({
            success: true,
            token,
            data: sealUser(user),
        });
    } catch (error) {
        return res.status(500).json({ success: false });
    }
};


export const logIn = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        const user = await UserModel.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user._id.toString() },
            JWT_PASS,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            success: true,
            token,
            data: sealUser(user),
        });
    } catch {
        return res.status(500).json({ success: false });
    }
};


export const getUser = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await UserModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json({
            success: true,
            data: sealUser(user),
        });
    } catch {
        return res.status(500).json({ success: false });
    }
};
