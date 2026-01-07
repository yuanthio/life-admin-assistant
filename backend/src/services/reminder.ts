// life-admin-assistant/backend/src/services/reminder.ts
import { prisma } from "../prisma/client";
import { format, addDays, isSameDay, differenceInDays, parseISO } from "date-fns";
import { id } from "date-fns/locale";

export interface ReminderConfig {
  daysBefore: number;
  type: string;
  message: string;
}

export const reminderConfigs: ReminderConfig[] = [
  {
    daysBefore: 30,
    type: '30_days',
    message: 'Tugas akan jatuh tempo dalam 30 hari'
  },
  {
    daysBefore: 7,
    type: '7_days',
    message: 'Tugas akan jatuh tempo dalam 7 hari'
  },
  {
    daysBefore: 1,
    type: '1_day',
    message: 'Tugas akan jatuh tempo besok'
  },
  {
    daysBefore: 0,
    type: 'due_today',
    message: 'Tugas jatuh tempo hari ini'
  },
  {
    daysBefore: -1,
    type: 'overdue',
    message: 'Tugas sudah melewati batas waktu'
  }
];

export async function generateRemindersForTask(taskId: number) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { user: true }
  });

  if (!task || !task.dueDate || task.completed) {
    return [];
  }

  const dueDate = new Date(task.dueDate);
  const today = new Date();
  
  // Hapus reminder lama untuk task ini
  await prisma.reminder.deleteMany({
    where: { taskId }
  });

  const reminders = [];

  // Urutkan config dari yang terdekat ke terjauh (overdue -> due today -> upcoming)
  const sortedConfigs = [...reminderConfigs].sort((a, b) => b.daysBefore - a.daysBefore);
  
  let reminderCreated = false;

  for (const config of sortedConfigs) {
    const reminderDate = addDays(dueDate, -config.daysBefore);
    
    // Jika sudah ada reminder yang dibuat, skip yang lain
    if (reminderCreated) continue;
    
    let shouldCreateReminder = false;
    
    if (config.daysBefore > 0) {
      // Reminder sebelum due date (30, 7, 1 hari sebelum)
      shouldCreateReminder = reminderDate >= today;
    } else if (config.daysBefore === 0) {
      // Due today
      shouldCreateReminder = dueDate >= today;
    } else {
      // Overdue - hanya buat jika due date sudah lewat
      shouldCreateReminder = dueDate < today;
    }
    
    if (shouldCreateReminder) {
      const reminderMessage = config.daysBefore < 0 
        ? `${config.message}: ${task.title}. Jatuh tempo pada ${format(dueDate, 'dd/MM/yyyy', { locale: id })}`
        : `${config.message}: ${task.title}`;
      
      const reminder = await prisma.reminder.create({
        data: {
          taskId,
          userId: task.userId,
          type: config.type,
          message: reminderMessage,
          dueDate,
          sent: false
        }
      });
      reminders.push(reminder);
      reminderCreated = true; // Set flag bahwa reminder sudah dibuat untuk task ini
    }
  }

  return reminders;
}

export async function generateRemindersForUser(userId: number) {
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      completed: false,
      dueDate: { not: null }
    }
  });

  const allReminders = [];
  
  for (const task of tasks) {
    const reminders = await generateRemindersForTask(task.id);
    allReminders.push(...reminders);
  }

  return allReminders;
}

export async function getPendingReminders(userId: number) {
  const today = new Date();
  
  return await prisma.reminder.findMany({
    where: {
      userId,
      sent: false,
      OR: [
        // Overdue
        {
          dueDate: { lt: today }
        },
        // Due today
        {
          dueDate: { 
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
          }
        },
        // Upcoming
        {
          dueDate: { gte: today }
        }
      ]
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          description: true,
          dueDate: true,
          priority: true
        }
      }
    },
    orderBy: [
      { dueDate: 'asc' },
      { createdAt: 'asc' }
    ]
  });
}

export async function getOverdueTasks(userId: number) {
  const today = new Date();
  
  return await prisma.task.findMany({
    where: {
      userId,
      completed: false,
      dueDate: { lt: today }
    },
    include: {
      template: {
        select: {
          id: true,
          name: true,
        }
      }
    },
    orderBy: { dueDate: 'asc' }
  });
}

export async function getDueTodayTasks(userId: number) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  return await prisma.task.findMany({
    where: {
      userId,
      completed: false,
      dueDate: {
        gte: startOfDay,
        lt: endOfDay
      }
    },
    include: {
      template: {
        select: {
          id: true,
          name: true,
        }
      }
    },
    orderBy: { priority: 'desc' }
  });
}

export async function getUpcomingTasks(userId: number, days: number = 7) {
  const today = new Date();
  const futureDate = addDays(today, days);
  
  return await prisma.task.findMany({
    where: {
      userId,
      completed: false,
      dueDate: {
        gte: today,
        lte: futureDate
      }
    },
    include: {
      template: {
        select: {
          id: true,
          name: true,
        }
      }
    },
    orderBy: [
      { dueDate: 'asc' },
      { priority: 'desc' }
    ]
  });
}

export async function markReminderAsSent(reminderId: number) {
  return await prisma.reminder.update({
    where: { id: reminderId },
    data: {
      sent: true,
      sentAt: new Date()
    }
  });
}

export async function createReminderManually(userId: number, data: {
  taskId?: number;
  type: string;
  message: string;
  dueDate: Date;
}) {
  return await prisma.reminder.create({
    data: {
      ...data,
      userId
    }
  });
}

export async function checkAndCreateOverdueReminders() {
  const today = new Date();
  const overdueTasks = await prisma.task.findMany({
    where: {
      completed: false,
      dueDate: { lt: today },
      lastRemindedAt: null // Hanya tugas yang belum pernah diingatkan
    },
    include: { user: true }
  });

  const createdReminders = [];

  for (const task of overdueTasks) {
    // Cek apakah sudah ada reminder overdue untuk task ini
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        taskId: task.id,
        type: 'overdue'
      }
    });

    if (!existingReminder) {
      const reminder = await prisma.reminder.create({
        data: {
          taskId: task.id,
          userId: task.userId,
          type: 'overdue',
          message: `⚠️ Tugas terlambat: ${task.title}. Jatuh tempo pada ${format(task.dueDate!, 'dd MMM yyyy', { locale: id })}`,
          dueDate: task.dueDate!,
          sent: false
        }
      });

      // Update lastRemindedAt pada task
      await prisma.task.update({
        where: { id: task.id },
        data: { lastRemindedAt: new Date() }
      });

      createdReminders.push(reminder);
    }
  }

  return createdReminders;
}

// Fungsi baru: Ambil hanya reminder terdekat untuk setiap task
export async function getNearestReminders(userId: number) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  // Ambil semua reminder yang belum dibaca
  const allReminders = await prisma.reminder.findMany({
    where: {
      userId,
      sent: false
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          description: true,
          dueDate: true,
          priority: true,
          completed: true
        }
      }
    },
    orderBy: [
      { dueDate: 'asc' },
      { createdAt: 'asc' }
    ]
  });
  
  // Filter untuk mendapatkan hanya reminder terdekat untuk setiap task
  const taskMap = new Map<number, any>();
  
  for (const reminder of allReminders) {
    if (!reminder.taskId) continue;
    
    const existingReminder = taskMap.get(reminder.taskId);
    const dueDate = new Date(reminder.dueDate);
    
    // Prioritaskan reminder berdasarkan urutan: overdue -> due today -> upcoming
    const getPriority = (rem: any) => {
      const due = new Date(rem.dueDate);
      if (due < startOfDay) return 0; // overdue
      if (due < endOfDay) return 1; // due today
      return 2; // upcoming
    };
    
    if (!existingReminder) {
      taskMap.set(reminder.taskId, reminder);
    } else {
      const existingPriority = getPriority(existingReminder);
      const newPriority = getPriority(reminder);
      
      // Jika reminder baru memiliki prioritas lebih tinggi, ganti
      if (newPriority < existingPriority) {
        taskMap.set(reminder.taskId, reminder);
      } 
      // Jika prioritas sama, ambil yang tanggalnya lebih dekat
      else if (newPriority === existingPriority) {
        const existingDue = new Date(existingReminder.dueDate);
        if (dueDate < existingDue) {
          taskMap.set(reminder.taskId, reminder);
        }
      }
    }
  }
  
  const nearestReminders = Array.from(taskMap.values());
  
  // Kategorikan reminder
  const categorizedReminders = nearestReminders.reduce((acc, reminder) => {
    const dueDate = new Date(reminder.dueDate);
    
    if (dueDate < startOfDay) {
      acc.overdue.push(reminder);
    } else if (dueDate >= startOfDay && dueDate < endOfDay) {
      acc.due_today.push(reminder);
    } else if (dueDate >= today) {
      acc.upcoming.push(reminder);
    }
    
    return acc;
  }, {
    overdue: [] as any[],
    due_today: [] as any[],
    upcoming: [] as any[]
  });

  // Ambil 5 reminder terdekat untuk notifikasi
  const recentReminders = nearestReminders
    .sort((a, b) => {
      // Urutkan berdasarkan: overdue -> due today -> upcoming (terdekat)
      const getPriority = (reminder: any) => {
        const dueDate = new Date(reminder.dueDate);
        if (dueDate < startOfDay) return 0; // overdue
        if (dueDate < endOfDay) return 1; // due today
        return 2; // upcoming
      };
      
      const priorityA = getPriority(a);
      const priorityB = getPriority(b);
      
      if (priorityA !== priorityB) return priorityA - priorityB;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 5)
    .map(reminder => ({
      ...reminder,
      formattedDate: format(new Date(reminder.dueDate), 'dd/MM/yyyy', { locale: id }),
      daysLeft: Math.ceil((new Date(reminder.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }));

  return {
    groupedReminders: categorizedReminders,
    recentReminders,
    counts: {
      total: nearestReminders.length,
      overdue: categorizedReminders.overdue.length,
      dueToday: categorizedReminders.due_today.length,
      upcoming: categorizedReminders.upcoming.length
    }
  };
}