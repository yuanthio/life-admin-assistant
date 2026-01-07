// life-admin-assistant/backend/src/routes/profile.ts
import express from "express";
import { 
  handleSetupProfile, 
  handleGetProfile, 
  handleGetDashboardData,
  handleCheckUserTemplates // Tambahkan ini
} from "../controllers/profile";
import { authenticate } from "../middlewares/auth";

const router = express.Router();

router.post("/setup", authenticate, handleSetupProfile);
router.get("/", authenticate, handleGetProfile);
router.get("/dashboard", authenticate, handleGetDashboardData);
router.get("/check-templates", authenticate, handleCheckUserTemplates); // Tambahkan route baru

export default router;