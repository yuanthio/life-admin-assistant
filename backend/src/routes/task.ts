// life-admin-assistant/backend/src/routes/task.ts
import express from "express";
import { 
  handleCreateTask, 
  handleGetTasks, 
  handleUpdateTask, 
  handleToggleTaskComplete,
  handleDeleteTask 
} from "../controllers/task";
import { authenticate } from "../middlewares/auth";

const router = express.Router();

router.post("/", authenticate, handleCreateTask);
router.get("/", authenticate, handleGetTasks);
router.put("/:id", authenticate, handleUpdateTask);
router.patch("/:id/toggle", authenticate, handleToggleTaskComplete);
router.delete("/:id", authenticate, handleDeleteTask);

export default router;