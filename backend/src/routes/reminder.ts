// life-admin-assistant/backend/src/routes/reminder.ts
import express from "express";
import { 
  handleGetReminders,
  handleGetTaskReminders,
  handleMarkReminderAsRead,
  handleCreateReminder,
  handleGetDashboardReminders
} from "../controllers/reminder";
import { authenticate } from "../middlewares/auth";

const router = express.Router();

router.get("/", authenticate, handleGetReminders);
router.get("/dashboard", authenticate, handleGetDashboardReminders);
router.get("/task/:taskId", authenticate, handleGetTaskReminders);
router.post("/", authenticate, handleCreateReminder);
router.patch("/:id/read", authenticate, handleMarkReminderAsRead);

export default router;