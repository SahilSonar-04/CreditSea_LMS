import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { uploadSalarySlip } from "../middleware/upload.middleware";
import {
  createOrGetDraft,
  updatePersonalDetails,
  uploadSlip,
  applyLoan,
  getMyApplications,
} from "../controllers/application.controller";

const router = Router();

router.use(authMiddleware, roleMiddleware("borrower"));

router.post("/", createOrGetDraft);
router.get("/me", getMyApplications);
router.patch("/:id/personal-details", updatePersonalDetails);
router.post("/:id/upload-slip", uploadSalarySlip, uploadSlip);
router.patch("/:id/apply", applyLoan);

export default router;
