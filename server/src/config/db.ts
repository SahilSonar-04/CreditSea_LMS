import mongoose from "mongoose";
import { env } from "./env";

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.mongoUri);
    console.log("[db] MongoDB connected");
  } catch (error) {
    console.error("[db] MongoDB connection failed:", error);
    process.exit(1);
  }
}
