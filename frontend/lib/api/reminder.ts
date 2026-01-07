// life-admin-assistant/frontend/lib/api/reminder.ts
import { api } from './axios';

export interface Reminder {
  id: number;
  taskId?: number;
  type: string;
  message: string;
  sent: boolean;
  sentAt?: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  task?: {
    id: number;
    title: string;
    description: string;
    dueDate: string;
    category: string;
    priority: string;
    completed?: boolean; // Tambahkan ini
  };
}

export interface ReminderData {
  reminders: Reminder[];
  overdue: any[];
  dueToday: any[];
  upcoming: any[];
  stats: {
    totalReminders: number;
    totalOverdue: number;
    totalDueToday: number;
    totalUpcoming: number;
  };
}

export interface DashboardReminders {
  groupedReminders: {
    overdue: Reminder[];
    due_today: Reminder[];
    upcoming: Reminder[];
  };
  recentReminders: (Reminder & {
    formattedDate: string;
    daysLeft: number;
  })[];
  counts: {
    total: number;
    overdue: number;
    dueToday: number;
    upcoming: number;
  };
}

export const reminderApi = {
  getReminders: async (): Promise<ReminderData> => {
    const response = await api.get('/reminders');
    return response.data;
  },

  getDashboardReminders: async (): Promise<DashboardReminders> => {
    const response = await api.get('/reminders/dashboard');
    return response.data;
  },

  getTaskReminders: async (taskId: number): Promise<{ reminders: Reminder[] }> => {
    const response = await api.get(`/reminders/task/${taskId}`);
    return response.data;
  },

  markAsRead: async (reminderId: number): Promise<{ message: string; reminder: Reminder }> => {
    const response = await api.patch(`/reminders/${reminderId}/read`);
    return response.data;
  },

  createReminder: async (data: {
    taskId?: number;
    type: string;
    message: string;
    dueDate: string;
  }): Promise<{ message: string; reminder: Reminder }> => {
    const response = await api.post('/reminders', data);
    return response.data;
  },
};