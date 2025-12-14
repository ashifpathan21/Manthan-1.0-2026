import mongoose, { Mongoose } from "mongoose";
import { exit } from "process";
import { config } from "dotenv"
config()


const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    throw new Error("MONGO_URI is not defined ")
}
export const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected To Database");

    } catch (error) {
        throw new Error("Error Connecting Database")
        exit(0);
    }
}