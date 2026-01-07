// life-admin-assistant/frontend/lib/api/template.ts
import { api } from "./axios";

export interface Template {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
  tasks?: Array<{
    id: number;
    title: string;
    description: string;
    dueDate: string;
    completed: boolean;
    frequency: string;
    priority: string;
    templateId: number;
  }>;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  tasks?: Array<{
    title: string;
    description?: string;
    dueDate?: string;
    frequency?: string;
    priority?: string;
  }>;
}

export interface UpdateTemplateData {
  name: string;
  description?: string;
  isActive?: boolean;
  tasks?: Array<{
    title: string;
    description?: string;
    dueDate?: string;
    frequency?: string;
    priority?: string;
  }>;
}

export interface TemplateTask {
  title: string;
  description?: string;
  dueDate?: string;
  frequency?: string;
  priority?: string;
}

export const templateApi = {
  getTemplates: async (params?: {
    isActive?: boolean;
  }): Promise<{ templates: Template[] }> => {
    const response = await api.get("/templates", { params });
    return response.data;
  },

  getUserTemplates: async (): Promise<{ templates: Template[] }> => {
    const response = await api.get("/templates/user");
    return response.data;
  },

  getTemplate: async (templateId: number): Promise<{ template: Template }> => {
    const response = await api.get(`/templates/${templateId}`);
    return response.data;
  },

  createTemplate: async (
    data: CreateTemplateData
  ): Promise<{ message: string; template: Template }> => {
    const response = await api.post("/templates", data);
    return response.data;
  },

  updateTemplate: async (
    templateId: number,
    data: UpdateTemplateData
  ): Promise<{ message: string; template: Template }> => {
    const response = await api.put(`/templates/${templateId}`, data);
    return response.data;
  },

  deleteTemplate: async (templateId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/templates/${templateId}`);
    return response.data;
  },

  toggleTemplate: async (
    templateId: number
  ): Promise<{ message: string; template: Template }> => {
    const response = await api.patch(`/templates/${templateId}/toggle`);
    return response.data;
  },

  applyTemplate: async (
    templateId: number
  ): Promise<{ message: string; tasks: any[] }> => {
    const response = await api.post(`/templates/${templateId}/apply`);
    return response.data;
  },
};