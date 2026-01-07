// life-admin-assistant/frontend/app/templates/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { templateApi, TemplateTask } from '@/lib/api/template';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  PlusIcon,
  MinusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface EditTemplateForm {
  name: string;
  description: string;
  isActive: boolean;
  tasks: TemplateTask[];
}

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [templateDetails, setTemplateDetails] = useState<any>(null);
  
  const [formData, setFormData] = useState<EditTemplateForm>({
    name: '',
    description: '',
    isActive: true,
    tasks: []
  });

  const templateId = params.id ? parseInt(params.id as string) : null;

  useEffect(() => {
    if (user && templateId) {
      fetchTemplateData();
    }
  }, [user, templateId]);

  const fetchTemplateData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await templateApi.getTemplate(templateId!);
      const template = response.template;
      setTemplateDetails(template);
      
      // Format tasks untuk form
      const formattedTasks: TemplateTask[] = template.tasks?.map((task: any) => ({
        title: task.title,
        description: task.description || '',
        frequency: task.frequency || '',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
      })) || [];
      
      setFormData({
        name: template.name,
        description: template.description || '',
        isActive: template.isActive,
        tasks: formattedTasks
      });
      
    } catch (err: any) {
      console.error('Failed to fetch template data:', err);
      setError(err.response?.data?.message || 'Failed to load template data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleTaskChange = (index: number, field: keyof TemplateTask, value: string) => {
    const updatedTasks = [...formData.tasks];
    updatedTasks[index] = {
      ...updatedTasks[index],
      [field]: value
    };
    
    setFormData(prev => ({
      ...prev,
      tasks: updatedTasks
    }));
  };

  const addTask = () => {
    setFormData(prev => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          title: '',
          description: '',
          frequency: '',
          priority: 'medium',
          dueDate: ''
        }
      ]
    }));
  };

  const removeTask = (index: number) => {
    if (confirm('Are you sure you want to remove this task from the template?')) {
      const updatedTasks = [...formData.tasks];
      updatedTasks.splice(index, 1);
      
      setFormData(prev => ({
        ...prev,
        tasks: updatedTasks
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateId) return;

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (!formData.name.trim()) {
        throw new Error('Template name is required');
      }

      // Validasi tasks
      for (const task of formData.tasks) {
        if (!task.title.trim()) {
          throw new Error('All tasks must have a title');
        }
      }

      const templateData: any = {
        name: formData.name,
        description: formData.description,
        isActive: formData.isActive,
        tasks: formData.tasks
      };

      console.log('Updating template with data:', templateData);
      
      await templateApi.updateTemplate(templateId, templateData);
      setSuccess('Template updated successfully!');
      
      // Redirect ke detail template setelah 1.5 detik
      setTimeout(() => {
        router.push(`/templates`);
      }, 1500);
      
    } catch (err: any) {
      console.error('Error updating template:', err);
      setError(err.message || err.response?.data?.message || 'Failed to update template');
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
                href={`/templates`}
                className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 mr-4"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Template
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Edit Template
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Update template information and tasks
            </p>
          </div>

          {templateDetails && (
            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                <div>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Editing template: <span className="font-medium">{templateDetails.name}</span>
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Template currently has {templateDetails.tasks?.length || 0} tasks
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                  <span>{error}</span>
                </div>
              </div>
            )}
            
            {success && (
              <div className="mb-6 bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-md">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  <span>{success}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Template Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter template name"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter template description (optional)"
                  disabled={saving}
                />
              </div>

              {/* Status */}
              <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  disabled={saving}
                />
                <div className="ml-3">
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Active Template
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Active templates can be applied to create new tasks. Inactive templates are archived.
                  </p>
                </div>
              </div>

              {/* Tasks Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      📝 Template Tasks ({formData.tasks.length})
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      These tasks will be created when this template is applied
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addTask}
                    disabled={saving}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm disabled:opacity-50"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Task
                  </button>
                </div>

                {formData.tasks.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                    <div className="text-4xl mb-4">📝</div>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No tasks in this template yet
                    </p>
                    <button
                      type="button"
                      onClick={addTask}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Add First Task
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.tasks.map((task, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center">
                            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-2">
                              <span className="text-blue-600 dark:text-blue-400 text-xs font-medium">
                                {index + 1}
                              </span>
                            </div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              Task {index + 1}
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeTask(index)}
                            disabled={saving}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                            title="Remove task from template"
                          >
                            <MinusIcon className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Task Title *
                            </label>
                            <input
                              type="text"
                              value={task.title}
                              onChange={(e) => handleTaskChange(index, 'title', e.target.value)}
                              required
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                              placeholder="Enter task title"
                              disabled={saving}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Priority
                            </label>
                            <select
                              value={task.priority}
                              onChange={(e) => handleTaskChange(index, 'priority', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                              disabled={saving}
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Frequency
                            </label>
                            <select
                              value={task.frequency}
                              onChange={(e) => handleTaskChange(index, 'frequency', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                              disabled={saving}
                            >
                              <option value="">Select frequency</option>
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                              <option value="yearly">Yearly</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Due Date (Optional)
                            </label>
                            <input
                              type="date"
                              value={task.dueDate || ''}
                              onChange={(e) => handleTaskChange(index, 'dueDate', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                              disabled={saving}
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description (Optional)
                          </label>
                          <textarea
                            value={task.description}
                            onChange={(e) => handleTaskChange(index, 'description', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                            placeholder="Enter task description"
                            disabled={saving}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {formData.tasks.length > 0 && (
                  <div className="mt-6 flex justify-between items-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formData.tasks.length} task{formData.tasks.length !== 1 ? 's' : ''} in this template
                    </div>
                    <button
                      type="button"
                      onClick={addTask}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Another Task
                    </button>
                  </div>
                )}
              </div>

              {/* Important Note */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center">
                  <InformationCircleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                      Important Note
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      Updating this template will only affect new tasks created from it. 
                      Existing tasks created from this template will not be modified.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href={`/templates`}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 flex items-center"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving Changes...
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
              💡 How Template Editing Works
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                  <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                  Template Status
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Only active templates can be applied. Inactive templates are archived and cannot be used to create new tasks.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                  <InformationCircleIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                  Existing Tasks
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Changes to templates do not affect existing tasks. Only new tasks created from the template will have the updated settings.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                  <PlusIcon className="h-4 w-4 text-purple-600 dark:text-purple-400 mr-2" />
                  Adding Tasks
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Template tasks act as blueprints. When a template is applied, all tasks in the template will be created for the user.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                  <XCircleIcon className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
                  Removing Tasks
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Removing a task from a template only prevents it from being created in future applications. Existing tasks remain unchanged.
                </p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                💡 <strong>Best Practice:</strong> Use templates for recurring task patterns like monthly bills, weekly chores, or annual document renewals.
              </p>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}