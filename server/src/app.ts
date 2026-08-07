import express, { Express, Request, Response } from "express";
import cors from "cors";
import onboardingRoutes from "./routes/onboarding.routes";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "creditsea-lms-server" });
});

app.use("/api/onboarding", onboardingRoutes);

export default app;
