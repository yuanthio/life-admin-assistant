// life-admin-assistant/frontend/app/tasks/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { taskApi } from '@/lib/api/profile';
import { templateApi, Template } from '@/lib/api/template';
import { checklistApi, ServiceSuggestion } from '@/lib/api/checklist';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function NewTaskPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // State baru untuk service suggestions
  const [serviceSuggestions, setServiceSuggestions] = useState<ServiceSuggestion[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    frequency: '',
    priority: 'medium',
    templateId: undefined as number | undefined,
    serviceUrl: '' as string | undefined // Tambah field serviceUrl
  });

  useEffect(() => {
    setIsClient(true);
    if (user) {
      fetchUserTemplates();
    }
  }, [user]);

  // Function untuk suggest services
  const suggestServices = async () => {
    if (formData.title.length < 3) {
      setServiceSuggestions([]);
      return;
    }

    try {
      setSuggestionsLoading(true);
      const response = await checklistApi.suggestServices(
        formData.title, 
        formData.description
      );
      setServiceSuggestions(response.suggestions);
    } catch (err) {
      console.error('Failed to get service suggestions:', err);
      // Tetap tampilkan default suggestions jika error
      setServiceSuggestions(getDefaultServiceSuggestions());
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // Default service suggestions
  const getDefaultServiceSuggestions = (): ServiceSuggestion[] => {
    return [
      {
        name: "PLN",
        description: "Listrik",
        url: "https://www.pln.co.id",
        icon: "⚡"
      },
      {
        name: "BPJS Kesehatan",
        description: "Kesehatan",
        url: "https://www.bpjs-kesehatan.go.id",
        icon: "🏥"
      },
      {
        name: "SIM Online",
        description: "Surat Izin Mengemudi",
        url: "https://sim.korlantas.polri.go.id",
        icon: "🚗"
      },
      {
        name: "PDAM",
        description: "Air Bersih",
        url: "https://pdam.co.id",
        icon: "💧"
      }
    ];
  };

  // Call suggestServices ketika title berubah
  useEffect(() => {
    if (formData.title.length > 2) {
      const timer = setTimeout(() => {
        suggestServices();
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setServiceSuggestions([]);
    }
  }, [formData.title]);

  const fetchUserTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const response = await templateApi.getUserTemplates();
      setTemplates(response.templates);
      // Set default template jika ada
      if (response.templates.length > 0 && !formData.templateId) {
        setFormData(prev => ({
          ...prev,
          templateId: response.templates[0].id
        }));
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'templateId') {
      // Konversi value ke number, atau undefined jika string kosong
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

  const handleSubmitClick = () => {
    if (!formData.templateId) {
      setError('Please select a template/category');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmDialog(false);
    await submitForm();
  };

  const submitForm = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

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

      // Tambahkan serviceUrl jika ada
      if (formData.serviceUrl) {
        taskData.serviceUrl = formData.serviceUrl;
      }

      console.log('Creating task with data:', taskData);
      
      const response = await taskApi.createTask(taskData);
      console.log('Task created:', response);
      
      // Auto-generate checklist setelah task dibuat
      try {
        setTimeout(async () => {
          try {
            await checklistApi.generateChecklist(response.task.id, true);
            console.log('Checklist generated for task:', response.task.id);
          } catch (checklistError) {
            console.error('Failed to auto-generate checklist:', checklistError);
          }
        }, 1000);
      } catch (checklistError) {
        console.error('Failed to auto-generate checklist:', checklistError);
      }
      
      setSuccess('Task created successfully! Checklist will be generated automatically.');
      setShowSuccessDialog(true);
      
    } catch (err: any) {
      console.error('Error creating task:', err);
      setError(err.message || err.response?.data?.message || 'Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    router.push('/dashboard');
  };

  const quickTemplates = [
    {
      name: 'Perpanjang SIM',
      template: '👨‍💼 Dokumen Pribadi',
      frequency: 'yearly',
      priority: 'high',
      serviceUrl: 'https://sim.korlantas.polri.go.id'
    },
    {
      name: 'Bayar Tagihan PLN',
      template: '🏠 Rumah Tangga',
      frequency: 'monthly',
      priority: 'high',
      serviceUrl: 'https://www.pln.co.id'
    },
    {
      name: 'Perpanjang BPJS',
      template: '👨‍💼 Dokumen Pribadi',
      frequency: 'yearly',
      priority: 'medium',
      serviceUrl: 'https://www.bpjs-kesehatan.go.id'
    },
    {
      name: 'Bersihkan Kamar',
      template: '🏠 Rumah Tangga',
      frequency: 'weekly',
      priority: 'medium'
    }
  ];

  const applyQuickTemplate = (template: typeof quickTemplates[0]) => {
    const selectedTemplate = templates.find(t => t.name === template.template);
    setFormData(prev => ({
      ...prev,
      title: template.name,
      templateId: selectedTemplate?.id,
      frequency: template.frequency,
      priority: template.priority,
      serviceUrl: template.serviceUrl || ''
    }));
  };

  const getTemplateIcon = (templateName: string) => {
    if (templateName.includes('Dokumen')) return '👨‍💼';
    if (templateName.includes('Rumah')) return '🏠';
    return '📋';
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 mr-4 flex items-center"
              >
                ← Back
              </button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Add New Task
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Create a new task and assign it to a template/category
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Quick Templates */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  ⚡ Quick Templates
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Click to apply a quick task template with service links
                </p>
                
                <div className="space-y-3">
                  {quickTemplates.map((template, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => applyQuickTemplate(template)}
                      className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {template.name}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {getTemplateIcon(template.template)}
                        </span>
                      </div>
                      <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="mr-3">🔄 {template.frequency}</span>
                        <span>🏷️ {template.priority}</span>
                      </div>
                      {template.serviceUrl && (
                        <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                          🔗 Includes service link
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    💡 Quick templates include service links for automatic checklist generation.
                  </p>
                </div>
              </div>

              {/* Task Stats Preview */}
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  📋 Task Preview
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Task Title
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {formData.title || 'No title yet'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Template/Category
                    </label>
                    {formData.templateId ? (
                      <p className="mt-1 text-gray-900 dark:text-white">
                        {templates.find(t => t.id === formData.templateId)?.name || 'No template selected'}
                      </p>
                    ) : (
                      <p className="mt-1 text-red-500 dark:text-red-400">
                        Please select a template
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Priority
                    </label>
                    <span className={`mt-1 inline-block px-2 py-1 text-xs rounded-full ${
                      formData.priority === 'high' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        : formData.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    }`}>
                      {formData.priority}
                    </span>
                  </div>
                  {formData.serviceUrl && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                        Service Link
                      </label>
                      <p className="mt-1 text-blue-600 dark:text-blue-400 text-sm truncate">
                        🔗 {formData.serviceUrl}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Task Form */}
            <div className="lg:col-span-2">
              <form onSubmit={(e) => { e.preventDefault(); handleSubmitClick(); }} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                {error && (
                  <div className="mb-6 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="mb-6 bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-md">
                    {success}
                  </div>
                )}

                <div className="space-y-6">
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
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Enter task title"
                      disabled={loading}
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
                      placeholder="Enter task description (optional)"
                      disabled={loading}
                    />
                  </div>

                  {/* Service Suggestions */}
                  {serviceSuggestions.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        💡 Service Suggestions
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {serviceSuggestions.map((service) => (
                          <button
                            key={service.name}
                            type="button"
                            onClick={() => {
                              setSelectedService(service.name);
                              // Update form dengan service URL
                              if (!formData.serviceUrl) {
                                setFormData(prev => ({
                                  ...prev,
                                  serviceUrl: service.url
                                }));
                              }
                            }}
                            className={`p-3 text-left rounded-lg border transition-colors ${
                              selectedService === service.name
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="text-lg mr-2">{service.icon}</span>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {service.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {service.description}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      {suggestionsLoading && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Loading more suggestions...
                        </p>
                      )}
                    </div>
                  )}

                  {/* Service URL Field */}
                  <div>
                    <label htmlFor="serviceUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Service URL (Optional)
                    </label>
                    <input
                      type="url"
                      id="serviceUrl"
                      name="serviceUrl"
                      value={formData.serviceUrl || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, serviceUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="https://example.com"
                      disabled={loading}
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Link to official service website (PLN, BPJS, SIM, etc.) for automatic checklist generation
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Template/Category */}
                    <div>
                      <label htmlFor="templateId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Template/Category *
                      </label>
                      <select
                        id="templateId"
                        name="templateId"
                        value={formData.templateId || ''}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                        disabled={loading || templatesLoading}
                      >
                        <option value="">Select a template/category</option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                      {templatesLoading ? (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Loading templates...
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Select a template/category for this task
                        </p>
                      )}
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                        disabled={loading}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    {/* Frequency */}
                    <div>
                      <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Frequency
                      </label>
                      <select
                        id="frequency"
                        name="frequency"
                        value={formData.frequency}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                        disabled={loading}
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
                      <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Due Date
                      </label>
                      <input
                        type="date"
                        id="dueDate"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                        disabled={loading}
                      />
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Reminders will be created automatically
                      </p>
                    </div>
                  </div>

                  {/* Reminder & Checklist Info */}
                  {(formData.dueDate || formData.serviceUrl) && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-blue-600 dark:text-blue-400 mr-2">🔔</span>
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          {formData.dueDate && "Reminders will be created automatically: 30 days before, 7 days before, 1 day before, and on the due date."}
                          {formData.dueDate && formData.serviceUrl && " "}
                          {formData.serviceUrl && "Checklist with official service links will be generated automatically after task creation."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Submit Buttons */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      disabled={loading}
                      className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !formData.templateId}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 flex items-center"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Task...
                        </>
                      ) : (
                        'Create Task'
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Help Section */}
              <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  ℹ️ How Templates & Service Links Work
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <span className="text-green-500 mr-3">✓</span>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Automatic Checklist Generation</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        When you add a service URL, the system will automatically generate a detailed checklist with official links.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <span className="text-green-500 mr-3">✓</span>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Service Suggestions</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Based on your task title, the system suggests relevant official services (PLN, BPJS, SIM, etc.)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <span className="text-green-500 mr-3">✓</span>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Official Links</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Click service suggestions to automatically add official website links to your task.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <span className="text-green-500 mr-3">✓</span>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">AI-Powered Steps</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        The checklist will include detailed steps using AI, tailored to your specific task.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-green-600 dark:text-green-400">✅ Task Created Successfully!</DialogTitle>
              <DialogDescription>
                Your task has been created successfully. Checklist is being generated automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Task Details:</h4>
                <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                  <li>📝 <strong>{formData.title}</strong></li>
                  {formData.templateId && (
                    <li>🏷️ Template: {templates.find(t => t.id === formData.templateId)?.name}</li>
                  )}
                  {formData.priority && (
                    <li>🎯 Priority: {formData.priority}</li>
                  )}
                  {formData.serviceUrl && (
                    <li>🔗 Service: Includes official website link</li>
                  )}
                </ul>
              </div>
              
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">What happens next:</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>✓ Checklist will be generated with detailed steps</li>
                  <li>✓ Official service links will be included</li>
                  <li>✓ Reminders will be set up based on due date</li>
                  <li>✓ You can view the checklist in task details</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <button
                onClick={handleSuccessDialogClose}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  setShowSuccessDialog(false);
                  router.push('/tasks');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                View All Tasks
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create New Task</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to create this task? Please review the details below:
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Task Preview:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-400 w-24">Title:</span>
                  <span className="font-medium">{formData.title}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-400 w-24">Template:</span>
                  <span className="font-medium">
                    {formData.templateId ? 
                      templates.find(t => t.id === formData.templateId)?.name : 
                      'No template selected'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-400 w-24">Priority:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    formData.priority === 'high' 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      : formData.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  }`}>
                    {formData.priority}
                  </span>
                </div>
                {formData.serviceUrl && (
                  <div className="flex items-start">
                    <span className="text-gray-500 dark:text-gray-400 w-24">Service Link:</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400 text-xs">
                      {formData.serviceUrl}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmSubmit} disabled={loading}>
                {loading ? 'Creating...' : 'Create Task'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AuthGuard>
  );
}