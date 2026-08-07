import { Request, Response } from "express";
import { Types } from "mongoose";
import { Application, EMPLOYMENT_MODES, EmploymentMode } from "../models/Application";
import { runBre } from "../utils/bre.util";
import {
  calculateSimpleInterest,
  calculateTotalRepayment,
  MIN_LOAN_AMOUNT,
  MAX_LOAN_AMOUNT,
  MIN_TENURE_DAYS,
  MAX_TENURE_DAYS,
  INTEREST_RATE,
} from "../utils/loanMath.util";
import { generateLoanRefNumber } from "../utils/refNumber.util";

function getRouteParam(param: string | string[] | undefined): string | null {
  return typeof param === "string" ? param : null;
}

async function findOwnedApplication(applicationId: string, borrowerId: string) {
  if (!Types.ObjectId.isValid(applicationId)) return null;
  return Application.findOne({ _id: applicationId, borrowerId });
}

function assertEditableDraft(application: { status: string }, res: Response): boolean {
  if (application.status !== "DRAFT") {
    res.status(400).json({
      message: `This application can no longer be edited (current status: ${application.status})`,
    });
    return false;
  }
  return true;
}

export async function createOrGetDraft(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const borrowerId = req.user.userId;

    const existingApplication = await Application.findOne({ borrowerId }).sort({ createdAt: -1 });
    if (existingApplication) {
      res.status(200).json({ application: existingApplication });
      return;
    }

    let application;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const loanRefNumber = await generateLoanRefNumber();

      try {
        application = await Application.create({
          loanRefNumber,
          borrowerId,
          status: "DRAFT",
          breStatus: "pending",
          breReasons: [],
          interestRate: INTEREST_RATE,
          statusHistory: [
            { status: "DRAFT", changedBy: new Types.ObjectId(borrowerId), changedAt: new Date(), note: "Application created" },
          ],
        });
        break;
      } catch (error) {
        // A concurrent draft may have claimed this reference number; generate the next one and retry.
        if ((error as { code?: number }).code !== 11000 || attempt === 2) {
          throw error;
        }
      }
    }

    if (!application) {
      throw new Error("Unable to allocate a loan reference number");
    }

    res.status(201).json({ application });
  } catch (error) {
    res.status(500).json({ message: "Failed to create application", error: (error as Error).message });
  }
}

export async function updatePersonalDetails(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const applicationId = getRouteParam(req.params.id);
    if (!applicationId) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    const application = await findOwnedApplication(applicationId, req.user.userId);
    if (!application) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    if (!assertEditableDraft(application, res)) return;

    const { fullName, pan, dob, monthlySalary, employmentMode } = req.body;

    if (!fullName || !pan || !dob || monthlySalary === undefined || !employmentMode) {
      res.status(400).json({
        message: "fullName, pan, dob, monthlySalary and employmentMode are required",
      });
      return;
    }

    if (!EMPLOYMENT_MODES.includes(employmentMode)) {
      res.status(400).json({ message: `employmentMode must be one of: ${EMPLOYMENT_MODES.join(", ")}` });
      return;
    }

    const parsedDob = new Date(dob);
    if (Number.isNaN(parsedDob.getTime())) {
      res.status(400).json({ message: "dob must be a valid date" });
      return;
    }

    const parsedSalary = Number(monthlySalary);
    if (!Number.isFinite(parsedSalary) || parsedSalary < 0) {
      res.status(400).json({ message: "monthlySalary must be a non-negative number" });
      return;
    }

    const bre = runBre({
      dob: parsedDob,
      monthlySalary: parsedSalary,
      pan: String(pan).toUpperCase(),
      employmentMode: employmentMode as EmploymentMode,
    });

    application.fullName = fullName;
    application.pan = String(pan).toUpperCase();
    application.dob = parsedDob;
    application.monthlySalary = parsedSalary;
    application.employmentMode = employmentMode;
    application.breStatus = bre.passed ? "passed" : "failed";
    application.breReasons = bre.reasons;
    application.statusHistory.push({
      status: application.status,
      changedBy: new Types.ObjectId(req.user.userId),
      changedAt: new Date(),
      note: bre.passed ? "BRE passed" : `BRE failed: ${bre.reasons.join("; ")}`,
    });

    await application.save();

    if (!bre.passed) {
      res.status(400).json({
        message: "Application does not meet eligibility criteria",
        breReasons: bre.reasons,
        application,
      });
      return;
    }

    res.status(200).json({ application });
  } catch (error) {
    res.status(500).json({ message: "Failed to update personal details", error: (error as Error).message });
  }
}

export async function uploadSlip(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const applicationId = getRouteParam(req.params.id);
    if (!applicationId) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    const application = await findOwnedApplication(applicationId, req.user.userId);
    if (!application) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    if (!assertEditableDraft(application, res)) return;

    if (application.breStatus !== "passed") {
      res.status(400).json({ message: "Personal details must pass eligibility checks before uploading a salary slip" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "salarySlip file is required (PDF, JPG or PNG, max 5MB)" });
      return;
    }

    application.salarySlipUrl = `/uploads/${req.file.filename}`;
    application.statusHistory.push({
      status: application.status,
      changedBy: new Types.ObjectId(req.user.userId),
      changedAt: new Date(),
      note: "Salary slip uploaded",
    });

    await application.save();

    res.status(200).json({ application });
  } catch (error) {
    res.status(500).json({ message: "Failed to upload salary slip", error: (error as Error).message });
  }
}

export async function applyLoan(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const applicationId = getRouteParam(req.params.id);
    if (!applicationId) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    const application = await findOwnedApplication(applicationId, req.user.userId);
    if (!application) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    if (!assertEditableDraft(application, res)) return;

    if (application.breStatus !== "passed") {
      res.status(400).json({ message: "Application does not meet eligibility criteria" });
      return;
    }

    if (!application.salarySlipUrl) {
      res.status(400).json({ message: "Salary slip must be uploaded before applying" });
      return;
    }

    const amount = Number(req.body.loanAmount);
    const tenure = Number(req.body.tenureDays);

    if (!Number.isFinite(amount) || amount < MIN_LOAN_AMOUNT || amount > MAX_LOAN_AMOUNT) {
      res.status(400).json({ message: `loanAmount must be between ${MIN_LOAN_AMOUNT} and ${MAX_LOAN_AMOUNT}` });
      return;
    }

    if (Math.abs(amount * 100 - Math.round(amount * 100)) > Number.EPSILON) {
      res.status(400).json({ message: "loanAmount can have at most two decimal places" });
      return;
    }

    if (!Number.isInteger(tenure) || tenure < MIN_TENURE_DAYS || tenure > MAX_TENURE_DAYS) {
      res.status(400).json({ message: `tenureDays must be between ${MIN_TENURE_DAYS} and ${MAX_TENURE_DAYS}` });
      return;
    }

    const simpleInterest = calculateSimpleInterest(amount, tenure);
    const totalRepayment = calculateTotalRepayment(amount, simpleInterest);

    application.loanAmount = amount;
    application.tenureDays = tenure;
    application.simpleInterest = simpleInterest;
    application.totalRepayment = totalRepayment;
    application.outstandingBalance = totalRepayment;
    application.status = "APPLIED";
    application.statusHistory.push({
      status: "APPLIED",
      changedBy: new Types.ObjectId(req.user.userId),
      changedAt: new Date(),
      note: "Borrower submitted loan application",
    });

    await application.save();

    res.status(200).json({ application });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit application", error: (error as Error).message });
  }
}

export async function getMyApplications(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const applications = await Application.find({ borrowerId: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json({ applications });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch applications", error: (error as Error).message });
  }
}
