import express, { ErrorRequestHandler, Express, Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import onboardingRoutes from "./routes/onboarding.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import applicationRoutes from "./routes/application.routes";
import uploadRoutes from "./routes/upload.routes";
import userRoutes from "./routes/user.routes";

const app: Express = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "creditsea-lms-server" });
});

app.use("/api/onboarding", onboardingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/users", userRoutes);

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({ message: "Salary slip must be 5MB or smaller" });
    return;
  }

  if (error instanceof Error && error.message === "Only PDF, JPG, and PNG files are allowed") {
    res.status(400).json({ message: error.message });
    return;
  }

  console.error("[server] Unhandled request error:", error);
  res.status(500).json({ message: "Internal server error" });
};

app.use(errorHandler);

export default app;
