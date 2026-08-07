import { Request, Response } from "express";
import { Types } from "mongoose";
import { Application } from "../models/Application";
import { User } from "../models/User";
import { Payment } from "../models/Payment";

function getRouteParam(param: string | string[] | undefined): string | null {
  return typeof param === "string" ? param : null;
}

export async function getSalesLeads(_req: Request, res: Response): Promise<void> {
  try {
    const appliedBorrowerIds = await Application.distinct("borrowerId", {
      status: { $ne: "DRAFT" },
    });

    const leads = await User.find({
      role: "borrower",
      _id: { $nin: appliedBorrowerIds },
    })
      .select("name email phone createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({ leads });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch sales leads", error: (error as Error).message });
  }
}

export async function getSanctionQueue(_req: Request, res: Response): Promise<void> {
  try {
    const applications = await Application.find({ status: "APPLIED" }).sort({ createdAt: 1 });
    res.status(200).json({ applications });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch sanction queue", error: (error as Error).message });
  }
}

export async function approveApplication(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const applicationId = getRouteParam(req.params.id);
    if (!applicationId || !Types.ObjectId.isValid(applicationId)) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    if (application.status !== "APPLIED") {
      res.status(400).json({ message: `Cannot sanction an application with status ${application.status}` });
      return;
    }

    application.status = "SANCTIONED";
    application.sanctionedBy = new Types.ObjectId(req.user.userId);
    application.statusHistory.push({
      status: "SANCTIONED",
      changedBy: new Types.ObjectId(req.user.userId),
      changedAt: new Date(),
      note: "Application sanctioned",
    });

    await application.save();
    res.status(200).json({ application });
  } catch (error) {
    res.status(500).json({ message: "Failed to sanction application", error: (error as Error).message });
  }
}

export async function rejectApplication(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const applicationId = getRouteParam(req.params.id);
    if (!applicationId || !Types.ObjectId.isValid(applicationId)) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    const { reason } = req.body;
    if (!reason || !String(reason).trim()) {
      res.status(400).json({ message: "A rejection reason is required" });
      return;
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    if (application.status !== "APPLIED") {
      res.status(400).json({ message: `Cannot reject an application with status ${application.status}` });
      return;
    }

    application.status = "REJECTED";
    application.rejectionReason = reason;
    application.statusHistory.push({
      status: "REJECTED",
      changedBy: new Types.ObjectId(req.user.userId),
      changedAt: new Date(),
      note: `Application rejected: ${reason}`,
    });

    await application.save();
    res.status(200).json({ application });
  } catch (error) {
    res.status(500).json({ message: "Failed to reject application", error: (error as Error).message });
  }
}

export async function getDisbursementQueue(_req: Request, res: Response): Promise<void> {
  try {
    const applications = await Application.find({ status: "SANCTIONED" }).sort({ createdAt: 1 });
    res.status(200).json({ applications });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch disbursement queue", error: (error as Error).message });
  }
}

export async function disburseApplication(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const applicationId = getRouteParam(req.params.id);
    if (!applicationId || !Types.ObjectId.isValid(applicationId)) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    if (application.status !== "SANCTIONED") {
      res.status(400).json({ message: `Cannot disburse an application with status ${application.status}` });
      return;
    }

    application.status = "DISBURSED";
    application.disbursedAt = new Date();
    application.statusHistory.push({
      status: "DISBURSED",
      changedBy: new Types.ObjectId(req.user.userId),
      changedAt: new Date(),
      note: "Loan disbursed",
    });

    await application.save();
    res.status(200).json({ application });
  } catch (error) {
    res.status(500).json({ message: "Failed to disburse application", error: (error as Error).message });
  }
}

export async function getCollectionQueue(_req: Request, res: Response): Promise<void> {
  try {
    const applications = await Application.find({ status: "DISBURSED" }).sort({ createdAt: 1 });
    res.status(200).json({ applications });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch collection queue", error: (error as Error).message });
  }
}

export async function recordPayment(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const loanId = getRouteParam(req.params.loanId);
    if (!loanId || !Types.ObjectId.isValid(loanId)) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    const application = await Application.findById(loanId);
    if (!application) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    if (application.status !== "DISBURSED") {
      res.status(400).json({ message: `Cannot record a payment for an application with status ${application.status}` });
      return;
    }

    const { utrNumber, amount, date } = req.body;

    if (!utrNumber || !String(utrNumber).trim()) {
      res.status(400).json({ message: "utrNumber is required" });
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json({ message: "amount must be a positive number" });
      return;
    }

    if (Math.abs(parsedAmount * 100 - Math.round(parsedAmount * 100)) > Number.EPSILON) {
      res.status(400).json({ message: "amount can have at most two decimal places" });
      return;
    }

    const paymentDate = date ? new Date(date) : new Date();
    if (Number.isNaN(paymentDate.getTime())) {
      res.status(400).json({ message: "date must be a valid date" });
      return;
    }

    const outstanding = application.outstandingBalance ?? 0;
    if (parsedAmount > outstanding) {
      res.status(400).json({ message: `Payment amount exceeds outstanding balance of ${outstanding}` });
      return;
    }

    const normalizedUtr = String(utrNumber).trim().toUpperCase();

    const existingPayment = await Payment.findOne({ utrNumber: normalizedUtr });
    if (existingPayment) {
      res.status(409).json({ message: "A payment with this UTR number already exists" });
      return;
    }

    let payment;
    try {
      payment = await Payment.create({
        loanId: application._id,
        utrNumber: normalizedUtr,
        amount: parsedAmount,
        date: paymentDate,
        recordedBy: new Types.ObjectId(req.user.userId),
      });
    } catch (createError) {
      if ((createError as { code?: number }).code === 11000) {
        res.status(409).json({ message: "A payment with this UTR number already exists" });
        return;
      }
      throw createError;
    }

    application.outstandingBalance = Math.round((outstanding - parsedAmount) * 100) / 100;
    application.statusHistory.push({
      status: application.status,
      changedBy: new Types.ObjectId(req.user.userId),
      changedAt: new Date(),
      note: `Payment recorded (UTR: ${normalizedUtr}, amount: ${parsedAmount})`,
    });

    if (application.outstandingBalance <= 0) {
      application.status = "CLOSED";
      application.closedAt = new Date();
      application.statusHistory.push({
        status: "CLOSED",
        changedBy: new Types.ObjectId(req.user.userId),
        changedAt: new Date(),
        note: "Outstanding balance fully paid — loan auto-closed",
      });
    }

    await application.save();
    res.status(201).json({ application, payment });
  } catch (error) {
    res.status(500).json({ message: "Failed to record payment", error: (error as Error).message });
  }
}
