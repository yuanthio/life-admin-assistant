// life-admin-assistant/backend/src/services/task.ts
import { prisma } from "../prisma/client";
import { generateRemindersForTask } from "./reminder";

export interface CreateTaskData {
  title: string;
  description?: string;
  dueDate?: Date;
  frequency?: string;
  priority?: string;
  templateId?: number;
  serviceType?: string;  // Tambah ini
  serviceUrl?: string;   // Tambah ini
}

export async function createTask(userId: number, data: CreateTaskData) {
  const task = await prisma.task.create({
    data: {
      ...data,
      userId
    }
  });

  // Generate reminders otomatis jika ada dueDate
  if (data.dueDate) {
    setTimeout(async () => {
      try {
        await generateRemindersForTask(task.id);
        console.log(`Reminders generated for task ${task.id} with due date ${data.dueDate}`);
      } catch (error) {
        console.error(`Failed to generate reminders for task ${task.id}:`, error);
      }
    }, 100);
  }

  return task;
}

export async function getUserTasks(userId: number, options: {
  completed?: boolean;
  priority?: string;
  templateId?: number;
} = {}) {
  const where: any = { userId };
  
  if (options.completed !== undefined) {
    where.completed = options.completed;
  }
  
  if (options.priority) {
    where.priority = options.priority;
  }
  
  if (options.templateId) {
    where.templateId = options.templateId;
  }

  return await prisma.task.findMany({
    where,
    include: {
      template: {
        select: {
          id: true,
          name: true,
          description: true
        }
      }
    },
    orderBy: [
      { dueDate: 'asc' },
      { priority: 'desc' },
      { createdAt: 'desc' }
    ]
  });
}

export async function updateTask(taskId: number, userId: number, data: Partial<CreateTaskData>) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId }
  });

  if (!task) {
    throw new Error("Task not found or unauthorized");
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data
  });

  // Regenerate reminders jika dueDate berubah
  if (data.dueDate && data.dueDate !== task.dueDate) {
    await generateRemindersForTask(taskId);
  }

  return updatedTask;
}

export async function toggleTaskComplete(taskId: number, userId: number) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId }
  });

  if (!task) {
    throw new Error("Task not found or unauthorized");
  }

  return await prisma.task.update({
    where: { id: taskId },
    data: { completed: !task.completed }
  });
}

export async function deleteTask(taskId: number, userId: number) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId }
  });

  if (!task) {
    throw new Error("Task not found or unauthorized");
  }

  return await prisma.task.delete({
    where: { id: taskId }
  });
}