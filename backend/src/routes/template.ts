// life-admin-assistant/backend/src/routes/template.ts
import express from "express";
import {
  handleGetTemplates,
  handleGetTemplateById,
  handleCreateTemplate,
  handleUpdateTemplate,
  handleDeleteTemplate,
  handleActivateTemplate,
  handleApplyTemplate,
  handleGetUserTemplates  // Tambahkan ini
} from "../controllers/template";
import { authenticate } from "../middlewares/auth";

const router = express.Router();

router.get("/", authenticate, handleGetTemplates);
router.get("/user", authenticate, handleGetUserTemplates);  // Tambahkan route baru
router.get("/:id", authenticate, handleGetTemplateById);
router.post("/", authenticate, handleCreateTemplate);
router.put("/:id", authenticate, handleUpdateTemplate);
router.delete("/:id", authenticate, handleDeleteTemplate);
router.patch("/:id/toggle", authenticate, handleActivateTemplate);
router.post("/:id/apply", authenticate, handleApplyTemplate);

export default router;