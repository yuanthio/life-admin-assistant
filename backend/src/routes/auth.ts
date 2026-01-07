// life-admin-assistant/backend/src/routes/auth.ts
import express from "express";
import { handleRegister, handleLogin, handleGetMe } from "../controllers/auth";
import { authenticate } from "../middlewares/auth";

const router = express.Router();

router.post("/register", handleRegister);
router.post("/login", handleLogin);
router.get("/me", authenticate, handleGetMe);

export default router;