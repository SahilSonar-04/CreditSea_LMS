import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";

const router = Router();

// Placeholder routes to prove the auth + role middleware chain works end-to-end.
// Real module logic (Sales/Sanction/Disbursement/Collection) gets built later
// these stay in place as a live RBAC smoke test, and get replaced route-by-route.

router.get("/sales", authMiddleware, roleMiddleware("sales", "admin"), (_req, res) => {
  res.status(200).json({ message: "Sales module placeholder — Phase 3 builds this out" });
});

router.get("/sanction", authMiddleware, roleMiddleware("sanction", "admin"), (_req, res) => {
  res.status(200).json({ message: "Sanction module placeholder — Phase 3 builds this out" });
});

router.get("/disbursement", authMiddleware, roleMiddleware("disbursement", "admin"), (_req, res) => {
  res.status(200).json({ message: "Disbursement module placeholder — Phase 3 builds this out" });
});

router.get("/collection", authMiddleware, roleMiddleware("collection", "admin"), (_req, res) => {
  res.status(200).json({ message: "Collection module placeholder — Phase 3 builds this out" });
});

export default router;
