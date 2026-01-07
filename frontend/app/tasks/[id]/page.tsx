// life-admin-assistant/frontend/app/tasks/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { taskApi } from '@/lib/api/profile';
import { checklistApi, ChecklistItem, ServiceLink } from '@/lib/api/checklist';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  LinkIcon,
  SparklesIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentListIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ClockIcon,
  UserGroupIcon,
  BanknotesIcon,
  DocumentCheckIcon,
  PhotoIcon,
  FingerPrintIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
  CalendarDaysIcon,
  TagIcon
} from '@heroicons/react/24/outline';

// Import components Shadcn
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { templateApi } from '@/lib/api/template';

// Interface untuk form edit task
interface EditTaskForm {
  title: string;
  description: string;
  dueDate: string;
  frequency: string;
  priority: string;
  templateId: number | undefined;
  serviceUrl: string;
}

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  
  const [task, setTask] = useState<any>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [serviceLinks, setServiceLinks] = useState<ServiceLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newItem, setNewItem] = useState('');
  const [generatingChecklist, setGeneratingChecklist] = useState(false);
  const [showServiceLinks, setShowServiceLinks] = useState(false);
  const [progress, setProgress] = useState(0);
  const [checklistDetailsExpanded, setChecklistDetailsExpanded] = useState<number | null>(null);
  
  // State untuk modal edit dan hapus
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const [editForm, setEditForm] = useState<EditTaskForm>({
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
      fetchTaskDetails();
      fetchTemplates();
    }
  }, [user, taskId]);

  const fetchTemplates = async () => {
    try {
      const response = await templateApi.getUserTemplates();
      setTemplates(response.templates);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch task details
      const tasksRes = await taskApi.getTasks({});
      const taskData = tasksRes.tasks.find((t: any) => t.id === taskId);
      
      if (!taskData) {
        throw new Error('Task not found');
      }
      
      setTask(taskData);
      
      // Set edit form data
      setEditForm({
        title: taskData.title,
        description: taskData.description || '',
        dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString().split('T')[0] : '',
        frequency: taskData.frequency || '',
        priority: taskData.priority || 'medium',
        templateId: taskData.templateId,
        serviceUrl: taskData.serviceUrl || ''
      });
      
      // Fetch checklist
      const checklistRes = await checklistApi.getTaskChecklist(taskId!);
      setChecklistItems(checklistRes.checklistItems);
      setProgress(checklistRes.progress);
      
      // Fetch service links
      const linksRes = await checklistApi.getServiceLinks(taskId!);
      setServiceLinks(linksRes.links);
      
      // Auto-generate checklist if not exist
      if (checklistRes.checklistItems.length === 0) {
        setTimeout(() => {
          autoGenerateChecklist();
        }, 500);
      }
      
    } catch (err: any) {
      console.error('Failed to fetch task details:', err);
      setError(err.response?.data?.message || 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const autoGenerateChecklist = async () => {
    if (!taskId || checklistItems.length > 0) return;
    
    try {
      setGeneratingChecklist(true);
      const response = await checklistApi.generateChecklist(taskId!, true);
      
      setChecklistItems(response.checklistItems);
      setTask(response.task);
      
      // Fetch updated links
      const linksRes = await checklistApi.getServiceLinks(taskId!);
      setServiceLinks(linksRes.links);
      
    } catch (err: any) {
      console.error('Auto-generate checklist failed:', err);
    } finally {
      setGeneratingChecklist(false);
    }
  };

  const handleGenerateChecklist = async () => {
    try {
      setGeneratingChecklist(true);
      setError('');
      
      const response = await checklistApi.generateChecklist(taskId!, true);
      
      setChecklistItems(response.checklistItems);
      setTask(response.task);
      setSuccess('Checklist successfully generated using AI!');
      
      // Fetch updated links
      const linksRes = await checklistApi.getServiceLinks(taskId!);
      setServiceLinks(linksRes.links);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate checklist');
    } finally {
      setGeneratingChecklist(false);
    }
  };

  const handleToggleTask = async () => {
    try {
      await taskApi.toggleTaskComplete(taskId!);
      fetchTaskDetails();
      setSuccess('Task status updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    try {
      await checklistApi.createChecklistItem(taskId!, {
        description: newItem,
        completed: false
      });
      
      setNewItem('');
      fetchTaskDetails();
      setSuccess('Checklist item added successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add checklist item');
    }
  };

  const handleToggleChecklistItem = async (itemId: number) => {
    try {
      await checklistApi.toggleChecklistItem(itemId);
      fetchTaskDetails();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update checklist item');
    }
  };

  const handleDeleteChecklistItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this checklist item?')) return;

    try {
      await checklistApi.deleteChecklistItem(itemId);
      fetchTaskDetails();
      setSuccess('Checklist item deleted successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete checklist item');
    }
  };

  const handleOpenServiceLink = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  // Function untuk handle edit task
  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId) return;

    try {
      setEditLoading(true);
      setError('');

      const taskData: any = {
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority,
        templateId: editForm.templateId
      };

      if (editForm.dueDate) {
        taskData.dueDate = new Date(editForm.dueDate).toISOString();
      }

      if (editForm.frequency) {
        taskData.frequency = editForm.frequency;
      }

      if (editForm.serviceUrl) {
        taskData.serviceUrl = editForm.serviceUrl;
      }

      await taskApi.updateTask(taskId, taskData);
      setSuccess('Task updated successfully!');
      setShowEditDialog(false);
      fetchTaskDetails();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update task');
    } finally {
      setEditLoading(false);
    }
  };

  // Function untuk handle delete task
  const handleDeleteTask = async () => {
    if (!taskId) return;

    try {
      setDeleteLoading(true);
      await taskApi.deleteTask(taskId);
      setSuccess('Task deleted successfully!');
      
      // Redirect to tasks page after 1.5 seconds
      setTimeout(() => {
        router.push('/tasks');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setDeleteLoading(false);
      setShowDeleteAlert(false);
    }
  };

  const calculateProgress = () => {
    if (checklistItems.length === 0) return 0;
    const completed = checklistItems.filter(item => item.completed).length;
    return Math.round((completed / checklistItems.length) * 100);
  };

  const getStepIcon = (index: number, description: string) => {
    const desc = description.toLowerCase();
    
    if (desc.includes('document') || desc.includes('id') || desc.includes('ktp') || desc.includes('passport')) {
      return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
    }
    if (desc.includes('form') || desc.includes('fill') || desc.includes('register')) {
      return <DocumentCheckIcon className="h-5 w-5 text-green-500" />;
    }
    if (desc.includes('pay') || desc.includes('payment') || desc.includes('fee')) {
      return <BanknotesIcon className="h-5 w-5 text-yellow-500" />;
    }
    if (desc.includes('health') || desc.includes('test') || desc.includes('clinic')) {
      return <UserGroupIcon className="h-5 w-5 text-red-500" />;
    }
    if (desc.includes('photo') || desc.includes('fingerprint') || desc.includes('take')) {
      return <FingerPrintIcon className="h-5 w-5 text-purple-500" />;
    }
    if (desc.includes('exam') || desc.includes('theory') || desc.includes('practice')) {
      return <AcademicCapIcon className="h-5 w-5 text-indigo-500" />;
    }
    if (desc.includes('save') || desc.includes('archive') || desc.includes('verification')) {
      return <BuildingLibraryIcon className="h-5 w-5 text-gray-500" />;
    }
    
    // Default icon based on index
    const icons = [
      <DocumentTextIcon className="h-5 w-5 text-blue-500" />,
      <DocumentCheckIcon className="h-5 w-5 text-green-500" />,
      <InformationCircleIcon className="h-5 w-5 text-yellow-500" />,
      <BanknotesIcon className="h-5 w-5 text-yellow-600" />,
      <ClockIcon className="h-5 w-5 text-purple-500" />,
      <CheckCircleIcon className="h-5 w-5 text-green-600" />
    ];
    return icons[index % icons.length] || <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
  };

  const getDetailedSteps = (description: string, index: number) => {
    const steps = [];
    
    // Step 1: Document Preparation
    if (index === 0 && (description.toLowerCase().includes('document') || description.toLowerCase().includes('prepare'))) {
      steps.push('Prepare original documents (no photocopies)');
      steps.push('Check document expiration dates');
      steps.push('Prepare 2-3 copies');
      steps.push('Prepare stamps if required');
    }
    
    // Step 2: Forms/Registration
    else if (index === 1 && (description.toLowerCase().includes('form') || description.toLowerCase().includes('fill') || description.toLowerCase().includes('register'))) {
      steps.push('Download forms from official website if available');
      steps.push('Fill in capital/normal letters as instructed');
      steps.push('Avoid erasures or corrections');
      steps.push('Sign at designated places');
    }
    
    // Step 3: Payment
    else if (index === 2 && description.toLowerCase().includes('pay')) {
      steps.push('Check accepted payment methods');
      steps.push('Prepare exact cash or payment card');
      steps.push('Keep payment receipts safely');
      steps.push('Verify amount according to regulations');
    }
    
    // Step 4: Test/Verification
    else if (index === 3 && (description.toLowerCase().includes('test') || description.toLowerCase().includes('verification') || description.toLowerCase().includes('health'))) {
      steps.push('Arrive early for queuing');
      steps.push('Bring your own stationery if needed');
      steps.push('Follow officer instructions properly');
      steps.push('Save test/verification results');
    }
    
    // Step 5: Collection
    else if (index === 4 && (description.toLowerCase().includes('collect') || description.toLowerCase().includes('photo') || description.toLowerCase().includes('fingerprint'))) {
      steps.push('Check collection schedule');
      steps.push('Bring registration/payment proof');
      steps.push('Wear neat and appropriate clothing');
      steps.push('Verify data before leaving location');
    }
    
    // Step 6: Storage
    else if (index === 5 && description.toLowerCase().includes('store')) {
      steps.push('Scan documents for digital archive');
      steps.push('Store in special folder');
      steps.push('Create backup in cloud storage');
      steps.push('Note expiration date for renewal');
    }
    
    return steps;
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

  if (!task) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Task not found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The task you're looking for doesn't exist or you don't have access.
              </p>
              <Link
                href="/tasks"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Tasks
              </Link>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Link
                href="/tasks"
                className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 mr-4"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Tasks
              </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {task.title}
                    </h1>
                    <span className={`px-3 py-1 text-sm rounded-full ${
                      task.priority === 'high'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        : task.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  {task.description && (
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {task.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    {task.template?.name && (
                      <span className="flex items-center">
                        <span className="mr-1">🏷️</span>
                        {task.template.name}
                      </span>
                    )}
                    
                    {task.dueDate && (
                      <span className="flex items-center">
                        <span className="mr-1">📅</span>
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    
                    {task.frequency && (
                      <span className="flex items-center">
                        <span className="mr-1">🔄</span>
                        {task.frequency}
                      </span>
                    )}
                    
                    {task.serviceType && task.serviceType !== 'other' && (
                      <span className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                        <LinkIcon className="h-3 w-3 mr-1" />
                        {task.serviceType}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowEditDialog(true)}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md font-medium"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setShowDeleteAlert(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleToggleTask}
                    className={`px-4 py-2 rounded-md font-medium ${
                      task.completed
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {task.completed ? 'Mark as Pending' : 'Mark as Complete'}
                  </button>
                </div>
              </div>

              {/* Service URL */}
              {task.serviceUrl && (
                <div className="mb-4">
                  <a
                    href={task.serviceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
                    Open Official Website: {task.serviceType || 'Service'}
                  </a>
                </div>
              )}

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Checklist Progress
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {calculateProgress()}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${calculateProgress()}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {checklistItems.filter(item => item.completed).length} of {checklistItems.length} steps completed
                </p>
              </div>
            </div>
          </div>

          {/* Alerts */}
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Checklist & Service Links */}
            <div className="lg:col-span-2 space-y-6">
              {/* Service Links Section */}
              {serviceLinks.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <LinkIcon className="h-5 w-5 mr-2" />
                        🔗 Official Service Links
                      </h2>
                      <button
                        onClick={() => setShowServiceLinks(!showServiceLinks)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                      >
                        {showServiceLinks ? (
                          <ChevronUpIcon className="h-5 w-5" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {showServiceLinks && (
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {serviceLinks.map((link) => (
                          <div
                            key={link.id}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">
                                  {link.description}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {link.serviceName}
                                </p>
                              </div>
                              <button
                                onClick={() => handleOpenServiceLink(link.link!)}
                                className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm"
                              >
                                <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
                                Open
                              </button>
                            </div>
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {link.link}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {task.serviceUrl && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-center">
                            <LinkIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                            <div>
                              <p className="text-sm text-blue-800 dark:text-blue-300">
                                Main website for {task.serviceType}
                              </p>
                              <a
                                href={task.serviceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 underline"
                              >
                                {task.serviceUrl}
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Checklist Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                      📝 Detailed Steps Checklist
                    </h2>
                    
                    <button
                      onClick={handleGenerateChecklist}
                      disabled={generatingChecklist}
                      className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm disabled:opacity-50"
                    >
                      {generatingChecklist ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="h-4 w-4 mr-2" />
                          Regenerate Checklist
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {/* Add new checklist item */}
                  <form onSubmit={handleAddChecklistItem} className="mb-6">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder="Add new checklist step..."
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </form>

                  {/* Checklist items */}
                  {checklistItems.length === 0 ? (
                    <div className="text-center py-12">
                      <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No checklist yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {generatingChecklist ? 
                          "AI is creating your checklist..." : 
                          "Click the button above to auto-generate checklist"
                        }
                      </p>
                      {!generatingChecklist && (
                        <button
                          onClick={handleGenerateChecklist}
                          className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
                        >
                          <SparklesIcon className="h-5 w-5 mr-2" />
                          Generate Checklist with AI
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {checklistItems.map((item, index) => {
                        const detailedSteps = getDetailedSteps(item.description, index);
                        const isExpanded = checklistDetailsExpanded === item.id;
                        
                        return (
                          <div
                            key={item.id}
                            className={`rounded-lg border ${
                              item.completed
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <div 
                              className="p-4 cursor-pointer hover:bg-opacity-80 transition-all"
                              onClick={() => setChecklistDetailsExpanded(isExpanded ? null : item.id)}
                            >
                              <div className="flex items-start">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleChecklistItem(item.id);
                                  }}
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 mt-1 flex-shrink-0 ${
                                    item.completed
                                      ? 'border-green-500 bg-green-500'
                                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                                  }`}
                                >
                                  {item.completed && (
                                    <span className="text-white text-xs">✓</span>
                                  )}
                                </button>

                                <div className="flex-1">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start flex-1">
                                      <div className="mr-3 mt-1">
                                        {getStepIcon(index, item.description)}
                                      </div>
                                      <div>
                                        <p className={`font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                                          Step {index + 1}: {item.description}
                                        </p>
                                        
                                        {detailedSteps.length > 0 && (
                                          <div className={`mt-2 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-60'}`}>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                              Step details:
                                            </p>
                                            <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                                              {detailedSteps.slice(0, isExpanded ? detailedSteps.length : 2).map((step, stepIndex) => (
                                                <li key={stepIndex} className="flex items-start">
                                                  <span className="text-gray-400 mr-2">•</span>
                                                  <span>{step}</span>
                                                </li>
                                              ))}
                                              {!isExpanded && detailedSteps.length > 2 && (
                                                <li className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                                                  Click to see {detailedSteps.length - 2} more details...
                                                </li>
                                              )}
                                            </ul>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2 ml-4">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setChecklistDetailsExpanded(isExpanded ? null : item.id);
                                        }}
                                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1"
                                        title={isExpanded ? "Close details" : "View details"}
                                      >
                                        {isExpanded ? (
                                          <ChevronUpIcon className="h-4 w-4" />
                                        ) : (
                                          <ChevronDownIcon className="h-4 w-4" />
                                        )}
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteChecklistItem(item.id);
                                        }}
                                        className="text-gray-400 hover:text-red-600 dark:text-gray-500 p-1"
                                        title="Delete"
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {item.link && (
                                    <div className="mt-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenServiceLink(item.link!);
                                        }}
                                        className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                      >
                                        <LinkIcon className="h-3 w-3 mr-1" />
                                        Open related service link
                                      </button>
                                    </div>
                                  )}
                                  
                                  {item.notes && (
                                    <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-800 dark:text-yellow-300">
                                      <strong>Note:</strong> {item.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Expanded detailed steps */}
                            {isExpanded && detailedSteps.length > 0 && (
                              <div className="px-4 pb-4 pt-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50">
                                <div className="pt-4 pl-11">
                                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    📋 Full Details Step {index + 1}:
                                  </h4>
                                  <ul className="space-y-2">
                                    {detailedSteps.map((step, stepIndex) => (
                                      <li key={stepIndex} className="flex items-start">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0 ${
                                          stepIndex === 0 ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' :
                                          stepIndex === 1 ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' :
                                          stepIndex === 2 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400' :
                                          'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                        }`}>
                                          {stepIndex + 1}
                                        </span>
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{step}</span>
                                      </li>
                                    ))}
                                  </ul>
                                  
                                  {/* Additional tips based on task type */}
                                  {task.title.toLowerCase().includes('sim') && index === 0 && (
                                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-800 dark:text-blue-300">
                                      <strong>💡 SIM Tips:</strong> Make sure you have no traffic violation fines and your police record certificate is still valid.
                                    </div>
                                  )}
                                  
                                  {task.title.toLowerCase().includes('pln') && index === 2 && (
                                    <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs text-green-800 dark:text-green-300">
                                      <strong>💡 PLN Tips:</strong> Payments can be made via mobile banking, minimarkets, or e-wallet apps.
                                    </div>
                                  )}
                                  
                                  {task.title.toLowerCase().includes('bpjs') && index === 1 && (
                                    <div className="mt-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-xs text-purple-800 dark:text-purple-300">
                                      <strong>💡 BPJS Tips:</strong> For data changes, prepare supporting documents like family card or marriage certificate.
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Checklist Tips */}
                      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                          <InformationCircleIcon className="h-5 w-5 mr-2" />
                          Checklist Usage Tips
                        </h4>
                        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                          <li>• Click each step to see more details</li>
                          <li>• Checklist is automatically generated based on task type</li>
                          <li>• Check completed steps to track progress</li>
                          <li>• Use official service links for quick access to related websites</li>
                          <li>• Add special notes for each step if needed</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Additional Information for Specific Task Types */}
              {task.serviceType && task.serviceType !== 'other' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    ℹ️ {task.serviceType} Information
                  </h3>
                  
                  {task.serviceType === 'SIM' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-1">Nearest Satpas Locations:</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                          • Check Korlantas website for nearest Satpas locations
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                          • Operating hours: Monday-Friday 08:00-15:00
                        </p>
                      </div>
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-1">Renewal Fees:</h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">
                          • SIM A: Rp 120,000
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">
                          • SIM C: Rp 100,000
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {task.serviceType === 'PLN' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h4 className="font-medium text-green-800 dark:text-green-300 mb-1">How to Check Bills:</h4>
                        <p className="text-sm text-green-700 dark:text-green-400">
                          • SMS: type INFO<></>IDPEL send to 8123
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-400">
                          • App: PLN Mobile on smartphone
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {task.serviceType === 'BPJS' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <h4 className="font-medium text-purple-800 dark:text-purple-300 mb-1">Service Classes:</h4>
                        <p className="text-sm text-purple-700 dark:text-purple-400">
                          • Class 1: Rp 150,000/month
                        </p>
                        <p className="text-sm text-purple-700 dark:text-purple-400">
                          • Class 2: Rp 100,000/month
                        </p>
                        <p className="text-sm text-purple-700 dark:text-purple-400">
                          • Class 3: Rp 50,000/month
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Task Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  ℹ️ Task Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </label>
                    <div className="mt-1">
                      <span className={`px-3 py-1 text-sm rounded-full ${
                        task.completed
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {task.completed ? 'Completed' : 'Not Completed'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Template/Category
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {task.template?.name || 'No template'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Created
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {new Date(task.createdAt).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Last Updated
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {new Date(task.updatedAt).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  {task.serviceType && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                        Service Type
                      </label>
                      <p className="mt-1 text-gray-900 dark:text-white">
                        {task.serviceType}
                      </p>
                    </div>
                  )}
                  
                  {task.dueDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                        Deadline
                      </label>
                      <p className={`mt-1 ${
                        new Date(task.dueDate) < new Date()
                          ? 'text-red-600 dark:text-red-400 font-medium'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {new Date(task.dueDate).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          weekday: 'long'
                        })}
                        {new Date(task.dueDate) < new Date() && ' (OVERDUE)'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Checklist Status */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl shadow p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                  📊 Checklist Status
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Steps</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {checklistItems.length}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Completed Steps</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {checklistItems.filter(item => item.completed).length}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Remaining Steps</span>
                    <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      {checklistItems.filter(item => !item.completed).length}
                    </span>
                  </div>
                  
                  <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
                    <div className="text-center">
                      <div className="relative w-24 h-24 mx-auto mb-2">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#E5E7EB"
                            strokeWidth="3"
                          />
                          <path
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#10B981"
                            strokeWidth="3"
                            strokeDasharray={`${calculateProgress()}, 100`}
                          />
                        </svg>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <span className="text-xl font-bold text-gray-900 dark:text-white">
                            {calculateProgress()}%
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Task completion progress
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  ⚡ Quick Actions
                </h3>
                
                <div className="space-y-3">
                  <button
                    onClick={handleGenerateChecklist}
                    disabled={generatingChecklist}
                    className="w-full flex items-center justify-center p-3 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition-colors text-purple-700 dark:text-purple-400 disabled:opacity-50"
                  >
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    {generatingChecklist ? 'Regenerating...' : 'Regenerate Checklist'}
                  </button>
                  
                  {task.serviceUrl && (
                    <a
                      href={task.serviceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center p-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors text-blue-700 dark:text-blue-400"
                    >
                      <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2 inline" />
                      Open Service Website
                    </a>
                  )}
                  
                  <button
                    onClick={() => setShowEditDialog(true)}
                    className="w-full flex items-center justify-center p-3 bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 rounded-lg transition-colors text-yellow-700 dark:text-yellow-400"
                  >
                    <PencilIcon className="h-5 w-5 mr-2" />
                    Edit Task
                  </button>
                  
                  <button
                    onClick={() => setShowDeleteAlert(true)}
                    className="w-full flex items-center justify-center p-3 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors text-red-700 dark:text-red-400"
                  >
                    <TrashIcon className="h-5 w-5 mr-2" />
                    Delete Task
                  </button>
                  
                  <button
                    onClick={handleToggleTask}
                    className={`w-full flex items-center justify-center p-3 rounded-lg transition-colors ${
                      task.completed
                        ? 'bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400'
                        : 'bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400'
                    }`}
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    {task.completed ? 'Mark as Pending' : 'Mark as Complete'}
                  </button>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2 flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                  ⚠️ Important Notes
                </h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                  <li>• Checklist is automatically generated when task is first opened</li>
                  <li>• Click each step to see full details</li>
                  <li>• Use service links for quick access to official websites</li>
                  <li>• Check completed steps to track progress</li>
                  <li>• Regenerate checklist if steps need updating</li>
                </ul>
              </div>
            </div>
          </div>
        </main>

        {/* Edit Task Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Update task information. Changes will be saved immediately.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleEditTask} className="space-y-4">
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter task description (optional)"
                />
              </div>

              <div>
                <label htmlFor="edit-serviceUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Service URL (Optional)
                </label>
                <input
                  type="url"
                  id="edit-serviceUrl"
                  value={editForm.serviceUrl}
                  onChange={(e) => setEditForm({ ...editForm, serviceUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="https://example.com"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Link to official service website (PLN, BPJS, SIM, etc.)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-templateId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Template/Category *
                  </label>
                  <select
                    id="edit-templateId"
                    value={editForm.templateId || ''}
                    onChange={(e) => setEditForm({ ...editForm, templateId: e.target.value ? parseInt(e.target.value) : undefined })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select a template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority *
                  </label>
                  <select
                    id="edit-priority"
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Frequency
                  </label>
                  <select
                    id="edit-frequency"
                    value={editForm.frequency}
                    onChange={(e) => setEditForm({ ...editForm, frequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select frequency</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="edit-dueDate"
                    value={editForm.dueDate}
                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setShowEditDialog(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Task Alert Dialog */}
        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
          <AlertDialogContent className="max-h-[80vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Task</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this task? This action cannot be undone. 
                The checklist and all related data will also be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="my-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                <span className="font-medium text-red-800 dark:text-red-300">Warning: This action cannot be undone</span>
              </div>
              <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                <p><strong>Task:</strong> {task.title}</p>
                {task.template?.name && <p><strong>Template:</strong> {task.template.name}</p>}
                <p><strong>Checklist items:</strong> {checklistItems.length}</p>
              </div>
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteTask}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Task'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AuthGuard>
  );
}