import { Request, Response } from "express";
import path from "path";
import { Application } from "../models/Application";

const UPLOAD_DIR = path.join(__dirname, "../../uploads");

const STAFF_VIEW_ROLES = new Set(["admin", "sanction"]);

export async function getSalarySlip(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const rawFilename = req.params.filename;
    const filename = typeof rawFilename === "string" ? rawFilename : null;

    if (!filename || filename !== path.basename(filename)) {
      res.status(400).json({ message: "Invalid file name" });
      return;
    }

    const application = await Application.findOne({ salarySlipUrl: `/uploads/${filename}` });
    if (!application) {
      res.status(404).json({ message: "File not found" });
      return;
    }

    const isOwner = application.borrowerId.toString() === req.user.userId;
    const isPermittedStaff = STAFF_VIEW_ROLES.has(req.user.role);

    if (!isOwner && !isPermittedStaff) {
      res.status(403).json({ message: "You do not have access to this file" });
      return;
    }

    res.sendFile(path.join(UPLOAD_DIR, filename), (error) => {
      if (error && !res.headersSent) {
        res.status(404).json({ message: "File not found" });
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve file", error: (error as Error).message });
  }
}
