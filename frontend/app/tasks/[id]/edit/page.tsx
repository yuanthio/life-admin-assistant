// life-admin-assistant/frontend/app/tasks/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { taskApi } from '@/lib/api/profile';
import { templateApi } from '@/lib/api/template';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  TagIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface EditTaskForm {
  title: string;
  description: string;
  dueDate: string;
  frequency: string;
  priority: string;
  templateId: number | undefined;
  serviceUrl: string;
}

export default function EditTaskPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<EditTaskForm>({
    title: '',
    description: '',
    dueDate: '',
    frequency: '',
    priority: 'medium',
    templateId: undefined,
    serviceUrl: ''
  });

  const taskId = params.id ? parseInt(params.id as string) : null;

  useEffect(() => {
    if (user && taskId) {
      fetchTaskData();
      fetchTemplates();
    }
  }, [user, taskId]);

  const fetchTemplates = async () => {
    try {
      const response = await templateApi.getUserTemplates();
      setTemplates(response.templates);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      toast.error('Failed to load templates', {
        description: 'Could not load template data'
      });
    }
  };

  const fetchTaskData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const tasksRes = await taskApi.getTasks({});
      const taskData = tasksRes.tasks.find((t: any) => t.id === taskId);
      
      if (!taskData) {
        throw new Error('Task not found');
      }
      
      setFormData({
        title: taskData.title,
        description: taskData.description || '',
        dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString().split('T')[0] : '',
        frequency: taskData.frequency || '',
        priority: taskData.priority || 'medium',
        templateId: taskData.templateId,
        serviceUrl: taskData.serviceUrl || ''
      });
      
    } catch (err: any) {
      console.error('Failed to fetch task data:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load task data';
      setError(errorMessage);
      toast.error('Failed to load task', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'templateId') {
      const numValue = value === '' ? undefined : parseInt(value, 10);
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(numValue as number) ? undefined : numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId) return;

    setError('');
    setSaving(true);

    try {
      if (!formData.title.trim()) {
        throw new Error('Task title is required');
      }

      if (!formData.templateId) {
        throw new Error('Template is required');
      }

      const taskData: any = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        templateId: formData.templateId
      };

      if (formData.dueDate) {
        taskData.dueDate = new Date(formData.dueDate).toISOString();
      }

      if (formData.frequency) {
        taskData.frequency = formData.frequency;
      }

      if (formData.serviceUrl) {
        taskData.serviceUrl = formData.serviceUrl;
      }

      await toast.promise(
        taskApi.updateTask(taskId, taskData),
        {
          loading: 'Saving changes...',
          success: () => {
            setTimeout(() => {
              router.push(`/tasks`);
            }, 1500);
            return 'Task updated successfully!';
          },
          error: (err: any) => {
            return err.message || err.response?.data?.message || 'Failed to update task';
          },
        }
      );
      
    } catch (err: any) {
      console.error('Error updating task:', err);
      const errorMessage = err.message || err.response?.data?.message || 'Failed to update task';
      setError(errorMessage);
      toast.error('Failed to update task', {
        description: errorMessage
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center">
              <Link
                href={`/tasks`}
                className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 mr-4"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Tasks
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Edit Task
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Update task information and details
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </div>
                  <button
                    onClick={() => setError('')}
                    className="text-red-800 dark:text-red-300 hover:text-red-900 dark:hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Task Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter task title"
                  disabled={saving}
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter task description (optional)"
                  disabled={saving}
                />
              </div>

              {/* Service URL */}
              <div>
                <label htmlFor="serviceUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Service URL (Optional)
                </label>
                <input
                  type="url"
                  id="serviceUrl"
                  name="serviceUrl"
                  value={formData.serviceUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                  placeholder="https://example.com"
                  disabled={saving}
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Link to official service website (PLN, BPJS, SIM, etc.)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Template/Category */}
                <div>
                  <label htmlFor="templateId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <TagIcon className="h-4 w-4 mr-2" />
                    Template/Category *
                  </label>
                  <select
                    id="templateId"
                    name="templateId"
                    value={formData.templateId || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                    disabled={saving}
                  >
                    <option value="">Select a template/category</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority *
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                    disabled={saving}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                {/* Frequency */}
                <div>
                  <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Frequency
                  </label>
                  <select
                    id="frequency"
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                    disabled={saving}
                  >
                    <option value="">Select frequency</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    How often this task repeats
                  </p>
                </div>

                {/* Due Date */}
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <CalendarDaysIcon className="h-4 w-4 mr-2" />
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                    disabled={saving}
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Reminders will be updated automatically
                  </p>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => router.push(`/tasks`)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              ℹ️ Editing Task Information
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <span className="text-blue-500 mr-3">📅</span>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Due Date Changes</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    If you change the due date, the system will automatically update reminders.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-green-500 mr-3">🔄</span>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Service Links</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Updating service URLs may trigger checklist regeneration with new steps.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-purple-500 mr-3">⚡</span>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Template Changes</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Changing the template will re-categorize this task but won't affect the checklist.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}