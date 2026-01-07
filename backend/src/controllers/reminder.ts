// life-admin-assistant/backend/src/controllers/reminder.ts
import { Request, Response } from "express";
import {
  getPendingReminders,
  getOverdueTasks,
  getDueTodayTasks,
  getUpcomingTasks,
  markReminderAsSent,
  createReminderManually,
  checkAndCreateOverdueReminders,
  getNearestReminders // Tambahkan ini
} from "../services/reminder";
import { format, addDays } from "date-fns";
import { id } from "date-fns/locale";
import { prisma } from "../prisma/client";

export async function handleGetReminders(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    
    // Check for overdue tasks and create reminders if needed
    await checkAndCreateOverdueReminders();
    
    const reminders = await getPendingReminders(userId);
    const overdue = await getOverdueTasks(userId);
    const dueToday = await getDueTodayTasks(userId);
    const upcoming = await getUpcomingTasks(userId, 7);

    res.json({
      reminders,
      overdue,
      dueToday,
      upcoming,
      stats: {
        totalReminders: reminders.length,
        totalOverdue: overdue.length,
        totalDueToday: dueToday.length,
        totalUpcoming: upcoming.length
      }
    });
  } catch (err: any) {
    console.error("Get reminders error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function handleGetTaskReminders(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const taskId = parseInt(req.params.taskId);

    const reminders = await prisma.reminder.findMany({
      where: {
        userId,
        taskId
      },
      orderBy: { dueDate: 'asc' }
    });

    res.json({ reminders });
  } catch (err: any) {
    console.error("Get task reminders error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function handleMarkReminderAsRead(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const reminderId = parseInt(req.params.id);

    // Verify reminder belongs to user
    const reminder = await prisma.reminder.findFirst({
      where: { id: reminderId, userId }
    });

    if (!reminder) {
      res.status(404).json({ message: "Reminder not found" });
      return;
    }

    const updated = await markReminderAsSent(reminderId);
    res.json({ message: "Reminder marked as read", reminder: updated });
  } catch (err: any) {
    console.error("Mark reminder error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function handleCreateReminder(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const { taskId, type, message, dueDate } = req.body;

    const reminder = await createReminderManually(userId, {
      taskId,
      type,
      message,
      dueDate: new Date(dueDate)
    });

    res.status(201).json({ message: "Reminder created", reminder });
  } catch (err: any) {
    console.error("Create reminder error:", err);
    res.status(400).json({ message: err.message });
  }
}

export async function handleGetDashboardReminders(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    
    // Gunakan fungsi baru yang hanya mengambil reminder terdekat
    const result = await getNearestReminders(userId);
    
    res.json(result);
  } catch (err: any) {
    console.error("Get dashboard reminders error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}