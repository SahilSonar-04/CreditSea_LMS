import { Request, Response, NextFunction } from "express";
import { UserRole } from "../models/User";

export function roleMiddleware(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: "You do not have access to this resource" });
      return;
    }

    next();
  };
}