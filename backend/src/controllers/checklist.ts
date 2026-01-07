// life-admin-assistant/backend/src/controllers/checklist.ts
import { Request, Response } from "express";
import {
  generateChecklistForTask,
  getTaskChecklist,
  createChecklistItem,
  updateChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  reorderChecklistItems,
  getTaskProgress,
  ChecklistItemData
} from "../services/checklist";
import { prisma } from "../prisma/client";

export async function handleGenerateChecklist(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const taskId = parseInt(req.params.taskId);
    const { useAI = true } = req.body;

    const result = await generateChecklistForTask(taskId, userId, useAI);
    
    res.json({
      message: "Checklist generated successfully",
      ...result
    });
  } catch (err: any) {
    console.error("Generate checklist error:", err);
    res.status(400).json({ message: err.message });
  }
}

export async function handleGetTaskChecklist(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const taskId = parseInt(req.params.taskId);

    const result = await getTaskChecklist(taskId, userId);
    
    res.json({
      ...result
    });
  } catch (err: any) {
    console.error("Get checklist error:", err);
    res.status(400).json({ message: err.message });
  }
}

export async function handleCreateChecklistItem(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const taskId = parseInt(req.params.taskId);
    const data: ChecklistItemData = req.body;

    const item = await createChecklistItem(taskId, userId, data);
    
    res.status(201).json({
      message: "Checklist item created",
      item
    });
  } catch (err: any) {
    console.error("Create checklist item error:", err);
    res.status(400).json({ message: err.message });
  }
}

export async function handleUpdateChecklistItem(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const itemId = parseInt(req.params.itemId);
    const data = req.body;

    const item = await updateChecklistItem(itemId, userId, data);
    
    res.json({
      message: "Checklist item updated",
      item
    });
  } catch (err: any) {
    console.error("Update checklist item error:", err);
    res.status(400).json({ message: err.message });
  }
}

export async function handleToggleChecklistItem(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const itemId = parseInt(req.params.itemId);

    const item = await toggleChecklistItem(itemId, userId);
    
    res.json({
      message: "Checklist item toggled",
      item
    });
  } catch (err: any) {
    console.error("Toggle checklist item error:", err);
    res.status(400).json({ message: err.message });
  }
}

export async function handleDeleteChecklistItem(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const itemId = parseInt(req.params.itemId);

    await deleteChecklistItem(itemId, userId);
    
    res.json({
      message: "Checklist item deleted"
    });
  } catch (err: any) {
    console.error("Delete checklist item error:", err);
    res.status(400).json({ message: err.message });
  }
}

export async function handleReorderChecklistItems(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const taskId = parseInt(req.params.taskId);
    const { itemIds } = req.body;

    if (!Array.isArray(itemIds)) {
      res.status(400).json({ message: "itemIds must be an array" });
      return;
    }

    const items = await reorderChecklistItems(taskId, userId, itemIds);
    
    res.json({
      message: "Checklist items reordered",
      items
    });
  } catch (err: any) {
    console.error("Reorder checklist items error:", err);
    res.status(400).json({ message: err.message });
  }
}

export async function handleGetTaskProgress(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const taskId = parseInt(req.params.taskId);

    const progress = await getTaskProgress(taskId, userId);
    
    res.json({
      progress,
      taskId
    });
  } catch (err: any) {
    console.error("Get task progress error:", err);
    res.status(400).json({ message: err.message });
  }
}

export async function handleGetServiceLinks(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const taskId = parseInt(req.params.taskId);

    // Verifikasi task milik user
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
      include: {
        checklistItems: {
          where: {
            link: { not: null }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!task) {
      res.status(404).json({ message: "Task not found or unauthorized" });
      return;
    }

    const serviceLinks = task.checklistItems
      .filter(item => item.link)
      .map(item => ({
        id: item.id,
        description: item.description,
        link: item.link,
        serviceName: item.description.includes('PLN') ? 'PLN' :
                    item.description.includes('BPJS') ? 'BPJS' :
                    item.description.includes('SIM') ? 'SIM' : 'Layanan'
      }));

    res.json({
      taskId,
      taskTitle: task.title,
      serviceType: task.serviceType,
      serviceUrl: task.serviceUrl,
      links: serviceLinks,
      totalLinks: serviceLinks.length
    });
  } catch (err: any) {
    console.error("Get service links error:", err);
    res.status(400).json({ message: err.message });
  }
}

export async function handleSuggestServices(req: Request, res: Response) {
  try {
    const { taskTitle, taskDescription } = req.body;

    if (!taskTitle) {
      res.status(400).json({ message: "Task title is required" });
      return;
    }

    const commonServices = [
      {
        name: "PLN",
        description: "Listrik",
        url: "https://www.pln.co.id",
        icon: "⚡"
      },
      {
        name: "BPJS Kesehatan",
        description: "Kesehatan",
        url: "https://www.bpjs-kesehatan.go.id",
        icon: "🏥"
      },
      {
        name: "SIM Online",
        description: "Surat Izin Mengemudi",
        url: "https://sim.korlantas.polri.go.id",
        icon: "🚗"
      },
      {
        name: "PDAM",
        description: "Air Bersih",
        url: "https://pdam.co.id",
        icon: "💧"
      },
      {
        name: "Indihome",
        description: "Internet & TV",
        url: "https://www.indihome.co.id",
        icon: "📺"
      },
      {
        name: "SAMSAT",
        description: "Pajak Kendaraan",
        url: "https://samsat.korlantas.polri.go.id",
        icon: "📋"
      },
      {
        name: "Dukcapil",
        description: "KTP & Administrasi",
        url: "https://www.dukcapil.kemendagri.go.id",
        icon: "🪪"
      },
      {
        name: "Imigrasi",
        description: "Paspor & Visa",
        url: "https://www.imigrasi.go.id",
        icon: "🛂"
      }
    ];

    // Filter berdasarkan keyword di task title
    const title = taskTitle.toLowerCase();
    const suggested = commonServices.filter(service => 
      title.includes(service.name.toLowerCase().split(' ')[0]) ||
      title.includes(service.description.toLowerCase())
    );

    res.json({
      suggestions: suggested.length > 0 ? suggested : commonServices.slice(0, 4),
      total: commonServices.length
    });
  } catch (err: any) {
    console.error("Suggest services error:", err);
    res.status(400).json({ message: err.message });
  }
}