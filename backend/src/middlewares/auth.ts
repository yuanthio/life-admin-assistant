// life-admin-assistant/backend/src/middlewares/auth.ts
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const decoded = verifyToken(token);
    (req as any).user = decoded as any;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
    return;
  }
}
