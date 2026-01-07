// life-admin-assistant/frontend/lib/api/profile.ts
import { api } from './axios';

export interface ProfileData {
  vehicleType?: string;
  hasPassport?: boolean;
  hasDrivingLicense?: boolean;
  hasIdCard?: boolean;
  householdSize?: number;
  houseOwnership?: string;
  billReminders?: boolean;
}

export interface Template {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  profile: any;
  stats: {
    totalPendingTasks: number;
    totalCompletedTasks: number;
    tasksByTemplate: Record<string, number>;
  };
  pendingTasks: Task[];
  completedTasks: Task[];
}

export interface Task {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  frequency: string;
  priority: string;
  templateId: number;
  template?: {
    id: number;
    name: string;
    description: string;
  };
  serviceType?: string; // Tambahkan ini
  serviceUrl?: string;  // Tambahkan ini
  createdAt: string;
  updatedAt: string;
}

export interface UserTemplateStatus {
  hasTemplates: boolean;
  hasProfile: boolean;
  templateCount: number;
  profileCount: number;
  success: boolean;
}

export const profileApi = {
  setupProfile: async (data: ProfileData): Promise<{ 
    message: string; 
    profile: any; 
    templates: Template[] 
  }> => {
    const response = await api.post('/profile/setup', data);
    return response.data;
  },

  getProfile: async (): Promise<{ profile: any }> => {
    const response = await api.get('/profile');
    return response.data;
  },

  getDashboardData: async (): Promise<DashboardData> => {
    const response = await api.get('/profile/dashboard');
    return response.data;
  },

  // TAMBAHKAN FUNCTION BARU INI
  checkUserTemplates: async (): Promise<UserTemplateStatus> => {
    const response = await api.get('/profile/check-templates');
    return response.data;
  },
};

export const taskApi = {
  createTask: async (data: {
    title: string;
    description?: string;
    dueDate?: string;
    frequency?: string;
    priority?: string;
    templateId: number;
    serviceUrl?: string; // Tambahkan ini
    serviceType?: string; // Tambahkan ini
  }): Promise<{ message: string; task: Task }> => {
    console.log('Sending task data:', data);
    const response = await api.post('/tasks', data);
    console.log('Task response:', response.data);
    return response.data;
  },

  getTasks: async (params?: {
    completed?: boolean;
    priority?: string;
    templateId?: number;
  }): Promise<{ tasks: Task[] }> => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  updateTask: async (taskId: number, data: Partial<Task>): Promise<{ message: string; task: Task }> => {
    const response = await api.put(`/tasks/${taskId}`, data);
    return response.data;
  },

  toggleTaskComplete: async (taskId: number): Promise<{ message: string; task: Task }> => {
    const response = await api.patch(`/tasks/${taskId}/toggle`);
    return response.data;
  },

  deleteTask: async (taskId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },
};