import jwt, { type JwtPayload } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import UserModel from "../models/user.js";
import { config } from "dotenv"
config()

if (!process.env.JWT_PASS) {
    throw new Error("JWT_PASS is not defined");
}
const JWT_PASS = process.env.JWT_PASS;

export const sealUser = (user: {
    password: string
}) => {
    user.password = "";
    return user;
}

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Token missing" });
    }

    try {
        const decoded = jwt.verify(token, JWT_PASS);

        if (typeof decoded !== "object" || !("id" in decoded)) {
            return res.status(401).json({ message: "Invalid token payload" });
        }

        const user = await UserModel.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        req.user = { id: user._id.toString() };
        next();

    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: "Token expired" });
        }

        return res.status(401).json({ message: "Invalid token" });
    }
};
