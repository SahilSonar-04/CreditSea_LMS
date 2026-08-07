import { Request, Response } from "express";
import { Types } from "mongoose";
import { Application } from "../models/Application";

const STAFF_VIEW_ROLES = new Set(["admin", "sanction"]);

function getRouteParam(param: string | string[] | undefined): string | null {
  return typeof param === "string" ? param : null;
}

export async function getSalarySlip(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const applicationId = getRouteParam(req.params.id);
    if (!applicationId || !Types.ObjectId.isValid(applicationId)) {
      res.status(404).json({ message: "File not found" });
      return;
    }

    const application = await Application.findById(applicationId).select(
      "+salarySlipData +salarySlipMimeType +salarySlipFileName borrowerId"
    );

    if (!application || !application.salarySlipData) {
      res.status(404).json({ message: "File not found" });
      return;
    }

    const isOwner = application.borrowerId.toString() === req.user.userId;
    const isPermittedStaff = STAFF_VIEW_ROLES.has(req.user.role);

    if (!isOwner && !isPermittedStaff) {
      res.status(403).json({ message: "You do not have access to this file" });
      return;
    }

    res.setHeader("Content-Type", application.salarySlipMimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${(application.salarySlipFileName || "salary-slip").replace(/"/g, "")}"`
    );
    res.send(application.salarySlipData);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve file", error: (error as Error).message });
  }
}
