import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import {
  getSalesLeads,
  getSanctionQueue,
  getSanctionHistory,
  approveApplication,
  rejectApplication,
  getDisbursementQueue,
  getDisbursementHistory,
  disburseApplication,
  getCollectionQueue,
  getCollectionHistory,
  recordPayment,
} from "../controllers/dashboard.controller";

const router = Router();

router.get("/sales", authMiddleware, roleMiddleware("sales", "admin"), getSalesLeads);

router.get("/sanction", authMiddleware, roleMiddleware("sanction", "admin"), getSanctionQueue);
router.patch("/sanction/:id/approve", authMiddleware, roleMiddleware("sanction", "admin"), approveApplication);
router.patch("/sanction/:id/reject", authMiddleware, roleMiddleware("sanction", "admin"), rejectApplication);

router.get("/disbursement", authMiddleware, roleMiddleware("disbursement", "admin"), getDisbursementQueue);
router.patch(
  "/disbursement/:id/disburse",
  authMiddleware,
  roleMiddleware("disbursement", "admin"),
  disburseApplication
);

router.get("/collection", authMiddleware, roleMiddleware("collection", "admin"), getCollectionQueue);
router.post(
  "/collection/:loanId/payment",
  authMiddleware,
  roleMiddleware("collection", "admin"),
  recordPayment
);

router.get("/sanction/history", authMiddleware, roleMiddleware("sanction", "admin"), getSanctionHistory);
router.get("/disbursement/history", authMiddleware, roleMiddleware("disbursement", "admin"), getDisbursementHistory);
router.get("/collection/history", authMiddleware, roleMiddleware("collection", "admin"), getCollectionHistory);

export default router;
