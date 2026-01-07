// life-admin-assistant/backend/src/controllers/task.ts
import { Request, Response } from "express";
import { 
  createTask, 
  getUserTasks, 
  updateTask, 
  toggleTaskComplete, 
  deleteTask,
  CreateTaskData
} from "../services/task";

export async function handleCreateTask(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const taskData: CreateTaskData = req.body;

    // Validasi templateId
    if (!taskData.templateId) {
      res.status(400).json({ message: "Template is required" });
      return;
    }

    const task = await createTask(userId, taskData);
    res.status(201).json({ message: "Task created", task });
  } catch (err: any) {
    console.error("Create task error:", err);
    res.status(400).json({ message: err.message });
  }
}

export async function handleGetTasks(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const { 
      completed, 
      priority, 
      templateId 
    } = req.query;

    const tasks = await getUserTasks(userId, {
      completed: completed === 'true',
      priority: priority as string,
      templateId: templateId ? parseInt(templateId as string) : undefined
    });

    res.json({ tasks });
  } catch (err: any) {
    console.error("Get tasks error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function handleUpdateTask(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const taskId = parseInt(req.params.id);
    const taskData = req.body;

    const task = await updateTask(taskId, userId, taskData);
    res.json({ message: "Task updated", task });
  } catch (err: any) {
    console.error("Update task error:", err);
    res.status(400).json({ message: err.message });
  }
}

export async function handleToggleTaskComplete(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const taskId = parseInt(req.params.id);

    const task = await toggleTaskComplete(taskId, userId);
    res.json({ message: "Task updated", task });
  } catch (err: any) {
    console.error("Toggle task error:", err);
    res.status(400).json({ message: err.message });
  }
}

export async function handleDeleteTask(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const taskId = parseInt(req.params.id);

    await deleteTask(taskId, userId);
    res.json({ message: "Task deleted" });
  } catch (err: any) {
    console.error("Delete task error:", err);
    res.status(400).json({ message: err.message });
  }
}