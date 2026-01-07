// life-admin-assistant/backend/src/controllers/template.ts
import { Request, Response } from "express";
import { prisma } from "../prisma/client";

export async function handleGetUserTemplates(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    
    const templates = await prisma.template.findMany({
      where: {
        userId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({ templates });
  } catch (err: any) {
    console.error("Get user templates error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function handleGetTemplates(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const { isActive } = req.query;

    const where: any = { userId };
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const templates = await prisma.template.findMany({
      where,
      include: {
        tasks: {
          where: { completed: false },
          orderBy: { dueDate: 'asc' },
          take: 5
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ templates });
  } catch (err: any) {
    console.error("Get templates error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function handleGetTemplateById(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const templateId = parseInt(req.params.id);

    const template = await prisma.template.findFirst({
      where: {
        id: templateId,
        userId
      },
      include: {
        tasks: {
          orderBy: [
            { completed: 'asc' },
            { dueDate: 'asc' }
          ]
        }
      }
    });

    if (!template) {
      res.status(404).json({ message: "Template not found" });
      return;
    }

    res.json({ template });
  } catch (err: any) {
    console.error("Get template error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function handleCreateTemplate(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const { name, description, tasks } = req.body;

    if (!name) {
      res.status(400).json({ message: "Template name is required" });
      return;
    }

    const template = await prisma.template.create({
      data: {
        name,
        description: description || '',
        userId,
        isActive: true,
        tasks: tasks ? {
          create: tasks.map((task: any) => ({
            title: task.title,
            description: task.description || '',
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            frequency: task.frequency || null,
            priority: task.priority || 'medium',
            userId
          }))
        } : undefined
      },
      include: {
        tasks: true
      }
    });

    res.status(201).json({ message: "Template created", template });
  } catch (err: any) {
    console.error("Create template error:", err);
    res.status(400).json({ message: err.message });
  }
}

export async function handleUpdateTemplate(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const templateId = parseInt(req.params.id);
    const { name, description, isActive, tasks } = req.body;

    // Verify template belongs to user
    const existingTemplate = await prisma.template.findFirst({
      where: { id: templateId, userId }
    });

    if (!existingTemplate) {
      res.status(404).json({ message: "Template not found" });
      return;
    }

    // Update template data
    const template = await prisma.template.update({
      where: { id: templateId },
      data: {
        name,
        description,
        isActive
      }
    });

    // Jika ada tasks, update tasks yang ada
    if (tasks && Array.isArray(tasks)) {
      // Hapus tasks lama yang terkait dengan template ini
      await prisma.task.deleteMany({
        where: {
          templateId,
          userId
        }
      });

      // Buat tasks baru
      for (const taskData of tasks) {
        await prisma.task.create({
          data: {
            title: taskData.title,
            description: taskData.description || '',
            dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
            frequency: taskData.frequency || null,
            priority: taskData.priority || 'medium',
            userId,
            templateId
          }
        });
      }
    }

    res.json({ 
      message: "Template updated successfully", 
      template: {
        ...template,
        tasks: tasks || []
      }
    });
  } catch (err: any) {
    console.error("Update template error:", err);
    res.status(400).json({ message: err.message });
  }
}

export async function handleDeleteTemplate(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const templateId = parseInt(req.params.id);

    // Verify template belongs to user
    const template = await prisma.template.findFirst({
      where: { id: templateId, userId }
    });

    if (!template) {
      res.status(404).json({ message: "Template not found" });
      return;
    }

    await prisma.template.delete({
      where: { id: templateId }
    });

    res.json({ message: "Template deleted" });
  } catch (err: any) {
    console.error("Delete template error:", err);
    res.status(400).json({ message: err.message });
  }
}

export async function handleActivateTemplate(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const templateId = parseInt(req.params.id);

    // Verify template belongs to user
    const template = await prisma.template.findFirst({
      where: { id: templateId, userId }
    });

    if (!template) {
      res.status(404).json({ message: "Template not found" });
      return;
    }

    const updatedTemplate = await prisma.template.update({
      where: { id: templateId },
      data: { isActive: !template.isActive }
    });

    res.json({ 
      message: `Template ${updatedTemplate.isActive ? 'activated' : 'deactivated'}`, 
      template: updatedTemplate 
    });
  } catch (err: any) {
    console.error("Toggle template error:", err);
    res.status(400).json({ message: err.message });
  }
}

export async function handleApplyTemplate(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const templateId = parseInt(req.params.id);

    // Verify template belongs to user
    const template = await prisma.template.findFirst({
      where: { id: templateId, userId },
      include: { tasks: true }
    });

    if (!template) {
      res.status(404).json({ message: "Template not found" });
      return;
    }

    if (!template.isActive) {
      res.status(400).json({ message: "Cannot apply inactive template" });
      return;
    }

    // Create tasks from template
    const createdTasks = [];
    for (const task of template.tasks) {
      const newTask = await prisma.task.create({
        data: {
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          frequency: task.frequency,
          priority: task.priority,
          userId,
          templateId: template.id
        }
      });
      createdTasks.push(newTask);
    }

    res.json({ 
      message: "Template applied successfully", 
      tasks: createdTasks 
    });
  } catch (err: any) {
    console.error("Apply template error:", err);
    res.status(400).json({ message: err.message });
  }
}