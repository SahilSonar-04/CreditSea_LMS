import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { getSalarySlip } from "../controllers/upload.controller";

const router = Router();

router.get("/:id", authMiddleware, getSalarySlip);

export default router;