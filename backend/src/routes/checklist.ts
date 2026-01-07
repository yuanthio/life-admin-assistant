// life-admin-assistant/backend/src/routes/checklist.ts
import express from "express";
import {
  handleGenerateChecklist,
  handleGetTaskChecklist,
  handleCreateChecklistItem,
  handleUpdateChecklistItem,
  handleToggleChecklistItem,
  handleDeleteChecklistItem,
  handleReorderChecklistItems,
  handleGetTaskProgress,
  handleGetServiceLinks,
  handleSuggestServices
} from "../controllers/checklist";
import { authenticate } from "../middlewares/auth";

const router = express.Router();

// Generate checklist untuk task
router.post("/tasks/:taskId/generate", authenticate, handleGenerateChecklist);

// Get checklist untuk task
router.get("/tasks/:taskId", authenticate, handleGetTaskChecklist);

// Progress task
router.get("/tasks/:taskId/progress", authenticate, handleGetTaskProgress);

// Service links untuk task
router.get("/tasks/:taskId/links", authenticate, handleGetServiceLinks);

// Suggest services berdasarkan task
router.post("/suggest-services", authenticate, handleSuggestServices);

// Checklist items CRUD
router.post("/tasks/:taskId/items", authenticate, handleCreateChecklistItem);
router.put("/items/:itemId", authenticate, handleUpdateChecklistItem);
router.patch("/items/:itemId/toggle", authenticate, handleToggleChecklistItem);
router.delete("/items/:itemId", authenticate, handleDeleteChecklistItem);

// Reorder checklist items
router.put("/tasks/:taskId/reorder", authenticate, handleReorderChecklistItems);

export default router;