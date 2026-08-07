import express, { Express, Request, Response } from "express";
import cors from "cors";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "creditsea-lms-server" });
});

export default app;
