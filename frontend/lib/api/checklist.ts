// life-admin-assistant/frontend/lib/api/checklist.ts
import { api } from './axios';

export interface ChecklistItem {
  id: number;
  taskId: number;
  userId: number;
  description: string;
  completed: boolean;
  order: number;
  link?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceLink {
  id: number;
  description: string;
  link: string;
  serviceName: string;
}

export interface ChecklistResponse {
  task: any;
  checklistItems: ChecklistItem[];
  progress: number;
}

export interface GenerateChecklistResponse {
  task: any;
  checklistItems: ChecklistItem[];
  generatedByAI: boolean;
}

export interface ServiceLinksResponse {
  taskId: number;
  taskTitle: string;
  serviceType: string;
  serviceUrl?: string;
  links: ServiceLink[];
  totalLinks: number;
}

export interface ServiceSuggestion {
  name: string;
  description: string;
  url: string;
  icon: string;
}

export const checklistApi = {
  // Generate checklist untuk task
  generateChecklist: async (taskId: number, useAI: boolean = true): Promise<GenerateChecklistResponse> => {
    const response = await api.post(`/checklist/tasks/${taskId}/generate`, { useAI });
    return response.data;
  },

  // Get checklist untuk task
  getTaskChecklist: async (taskId: number): Promise<ChecklistResponse> => {
    const response = await api.get(`/checklist/tasks/${taskId}`);
    return response.data;
  },

  // Get task progress
  getTaskProgress: async (taskId: number): Promise<{ progress: number; taskId: number }> => {
    const response = await api.get(`/checklist/tasks/${taskId}/progress`);
    return response.data;
  },

  // Get service links untuk task
  getServiceLinks: async (taskId: number): Promise<ServiceLinksResponse> => {
    const response = await api.get(`/checklist/tasks/${taskId}/links`);
    return response.data;
  },

  // Suggest services berdasarkan task
  suggestServices: async (taskTitle: string, taskDescription?: string): Promise<{ suggestions: ServiceSuggestion[]; total: number }> => {
    const response = await api.post('/checklist/suggest-services', {
      taskTitle,
      taskDescription
    });
    return response.data;
  },

  // Create checklist item
  createChecklistItem: async (taskId: number, data: {
    description: string;
    link?: string;
    completed?: boolean;
    notes?: string;
  }): Promise<{ message: string; item: ChecklistItem }> => {
    const response = await api.post(`/checklist/tasks/${taskId}/items`, data);
    return response.data;
  },

  // Update checklist item
  updateChecklistItem: async (itemId: number, data: Partial<ChecklistItem>): Promise<{ message: string; item: ChecklistItem }> => {
    const response = await api.put(`/checklist/items/${itemId}`, data);
    return response.data;
  },

  // Toggle checklist item
  toggleChecklistItem: async (itemId: number): Promise<{ message: string; item: ChecklistItem }> => {
    const response = await api.patch(`/checklist/items/${itemId}/toggle`);
    return response.data;
  },

  // Delete checklist item
  deleteChecklistItem: async (itemId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/checklist/items/${itemId}`);
    return response.data;
  },

  // Reorder checklist items
  reorderChecklistItems: async (taskId: number, itemIds: number[]): Promise<{ message: string; items: ChecklistItem[] }> => {
    const response = await api.put(`/checklist/tasks/${taskId}/reorder`, { itemIds });
    return response.data;
  }
};