// life-admin-assistant/backend/src/services/checklist.ts
import { prisma } from "../prisma/client";
import { generateChecklistFromTask, detectServiceType, serviceUrls } from "./gemini";

export interface ChecklistItemData {
  description: string;
  link?: string;
  completed?: boolean;
  order?: number;
  notes?: string;
}

export async function generateChecklistForTask(
  taskId: number,
  userId: number,
  useAI: boolean = true
) {
  // Verifikasi task milik user
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    include: { template: true }
  });

  if (!task) {
    throw new Error("Task not found or unauthorized");
  }

  // Hapus checklist items yang ada
  await prisma.checklistItem.deleteMany({
    where: { taskId }
  });

  let checklistSteps: ChecklistItemData[] = [];
  let serviceType = detectServiceType(task.title);
  let serviceUrl = serviceUrls[serviceType] || null;

  // Gunakan AI untuk generate checklist jika diinginkan
  if (useAI) {
    try {
      const aiResult = await generateChecklistFromTask(
        task.title,
        task.description || '',
        task.template?.name || ''
      );
      
      serviceType = aiResult.serviceType;
      serviceUrl = aiResult.mainServiceUrl || serviceUrl;
      
      checklistSteps = aiResult.steps.map((step, index) => ({
        description: step.description,
        link: step.link || undefined,
        order: index + 1,
        completed: false
      }));
    } catch (error) {
      console.error("AI generation failed, using default checklist:", error);
      useAI = false;
    }
  }

  // Jika AI gagal atau tidak digunakan, buat checklist default
  if (!useAI || checklistSteps.length === 0) {
    checklistSteps = [
      { description: "Persiapkan dokumen yang diperlukan", order: 1, completed: false },
      { description: "Isi formulir atau dokumen yang dibutuhkan", order: 2, completed: false },
      { description: "Verifikasi data dan informasi", order: 3, completed: false },
      { description: "Lakukan pembayaran jika diperlukan", order: 4, completed: false },
      { description: "Ambil berkas/tanda terima", order: 5, completed: false },
      { description: "Simpan dokumen dengan baik", order: 6, completed: false }
    ];
  }

  // Update task dengan service type dan URL jika ada
  if (serviceType !== 'lainnya' || serviceUrl) {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        serviceType,
        serviceUrl
      }
    });
  }

  // Simpan checklist items ke database
  const createdItems = [];
  for (const step of checklistSteps) {
    const item = await prisma.checklistItem.create({
      data: {
        taskId,
        userId,
        description: step.description,
        link: step.link,
        order: step.order || 0,
        completed: step.completed || false,
        notes: step.notes
      }
    });
    createdItems.push(item);
  }

  return {
    task: await prisma.task.findUnique({
      where: { id: taskId },
      include: { checklistItems: true }
    }),
    checklistItems: createdItems,
    generatedByAI: useAI
  };
}

export async function getTaskChecklist(taskId: number, userId: number) {
  // Verifikasi task milik user
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId }
  });

  if (!task) {
    throw new Error("Task not found or unauthorized");
  }

  const checklistItems = await prisma.checklistItem.findMany({
    where: { taskId, userId },
    orderBy: { order: 'asc' }
  });

  return {
    task,
    checklistItems,
    progress: checklistItems.length > 0 
      ? (checklistItems.filter(item => item.completed).length / checklistItems.length) * 100
      : 0
  };
}

export async function createChecklistItem(
  taskId: number,
  userId: number,
  data: ChecklistItemData
) {
  // Verifikasi task milik user
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId }
  });

  if (!task) {
    throw new Error("Task not found or unauthorized");
  }

  // Cari order terakhir
  const lastItem = await prisma.checklistItem.findFirst({
    where: { taskId },
    orderBy: { order: 'desc' }
  });

  const order = lastItem ? lastItem.order + 1 : 1;

  return await prisma.checklistItem.create({
    data: {
      taskId,
      userId,
      description: data.description,
      link: data.link,
      order,
      completed: data.completed || false,
      notes: data.notes
    }
  });
}

export async function updateChecklistItem(
  itemId: number,
  userId: number,
  data: Partial<ChecklistItemData>
) {
  // Verifikasi item milik user
  const item = await prisma.checklistItem.findFirst({
    where: { id: itemId, userId }
  });

  if (!item) {
    throw new Error("Checklist item not found or unauthorized");
  }

  return await prisma.checklistItem.update({
    where: { id: itemId },
    data: {
      description: data.description,
      link: data.link,
      completed: data.completed,
      order: data.order,
      notes: data.notes
    }
  });
}

export async function toggleChecklistItem(itemId: number, userId: number) {
  // Verifikasi item milik user
  const item = await prisma.checklistItem.findFirst({
    where: { id: itemId, userId }
  });

  if (!item) {
    throw new Error("Checklist item not found or unauthorized");
  }

  return await prisma.checklistItem.update({
    where: { id: itemId },
    data: { completed: !item.completed }
  });
}

export async function deleteChecklistItem(itemId: number, userId: number) {
  // Verifikasi item milik user
  const item = await prisma.checklistItem.findFirst({
    where: { id: itemId, userId }
  });

  if (!item) {
    throw new Error("Checklist item not found or unauthorized");
  }

  return await prisma.checklistItem.delete({
    where: { id: itemId }
  });
}

export async function reorderChecklistItems(taskId: number, userId: number, itemIds: number[]) {
  // Verifikasi task milik user
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId }
  });

  if (!task) {
    throw new Error("Task not found or unauthorized");
  }

  // Update order untuk semua items
  const updates = [];
  for (let i = 0; i < itemIds.length; i++) {
    const itemId = itemIds[i];
    const item = await prisma.checklistItem.findFirst({
      where: { id: itemId, taskId, userId }
    });

    if (item) {
      const updated = await prisma.checklistItem.update({
        where: { id: itemId },
        data: { order: i + 1 }
      });
      updates.push(updated);
    }
  }

  return updates;
}

export async function getTaskProgress(taskId: number, userId: number) {
  const checklistItems = await prisma.checklistItem.findMany({
    where: { taskId, userId }
  });

  if (checklistItems.length === 0) {
    return 0;
  }

  const completedCount = checklistItems.filter(item => item.completed).length;
  return (completedCount / checklistItems.length) * 100;
}