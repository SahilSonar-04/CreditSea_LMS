import express, { Express, Request, Response } from "express";
import cors from "cors";
import path from "path";
import onboardingRoutes from "./routes/onboarding.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import applicationRoutes from "./routes/application.routes";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "creditsea-lms-server" });
});

app.use("/api/onboarding", onboardingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/applications", applicationRoutes);

export default app;