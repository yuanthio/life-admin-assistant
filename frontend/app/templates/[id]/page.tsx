// life-admin-assistant/frontend/app/templates/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { templateApi } from "@/lib/api/template";
import { taskApi } from "@/lib/api/profile";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentDuplicateIcon,
  PlusIcon,
  CalendarDaysIcon,
  ClockIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

export default function TemplateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();

  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // State untuk dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [taskToDeleteName, setTaskToDeleteName] = useState("");

  const templateId = params.id ? parseInt(params.id as string) : null;

  useEffect(() => {
    if (user && templateId) {
      fetchTemplate();
    }
  }, [user, templateId]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await templateApi.getTemplate(templateId!);
      setTemplate(response.template);
    } catch (err: any) {
      console.error("Failed to fetch template:", err);
      setError(err.response?.data?.message || "Failed to load template");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!templateId) return;

    try {
      await templateApi.deleteTemplate(templateId);
      setSuccess("Template deleted successfully!");
      setTimeout(() => {
        router.push("/templates");
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete template");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleToggleTemplate = async () => {
    if (!templateId) return;

    try {
      const response = await templateApi.toggleTemplate(templateId);
      setTemplate(response.template);
      setSuccess(
        `Template ${response.template.isActive ? "activated" : "deactivated"}!`
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update template");
    }
  };

  const confirmDeleteTask = (taskId: number, taskTitle: string) => {
    setTaskToDelete(taskId);
    setTaskToDeleteName(taskTitle);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      await taskApi.deleteTask(taskToDelete);
      setSuccess("Task deleted successfully!");
      fetchTemplate(); // Refresh template data
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete task");
    } finally {
      setTaskToDelete(null);
      setTaskToDeleteName("");
    }
  };

  const handleToggleTask = async (taskId: number) => {
    try {
      await taskApi.toggleTaskComplete(taskId);
      setSuccess("Task status updated!");
      fetchTemplate(); // Refresh template data
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update task");
    }
  };

  const handleApplyTemplate = async () => {
    if (!templateId) return;

    try {
      const response = await templateApi.applyTemplate(templateId);
      setSuccess(
        `Template applied! Created ${response.tasks.length} new tasks.`
      );
      setTimeout(() => {
        router.push("/tasks");
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to apply template");
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "personal_docs":
        return "👨‍💼 Dokumen Pribadi";
      case "household":
        return "🏠 Rumah Tangga";
      default:
        return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "personal_docs":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "household":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
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

  if (!template) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Template not found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The template you're looking for doesn't exist or you don't have
                access to it.
              </p>
              <Link
                href="/templates"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Templates
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
                href="/templates"
                className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 mr-4"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Templates
              </Link>
            </div>

            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {template.name}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <span
                    className={`px-3 py-1 text-sm rounded-full ${getCategoryColor(
                      template.category
                    )}`}
                  >
                    {getCategoryLabel(template.category)}
                  </span>
                  <span
                    className={`px-3 py-1 text-sm rounded-full ${getStatusColor(
                      template.isActive
                    )}`}
                  >
                    {template.isActive ? "Active" : "Inactive"}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    Created: {new Date(template.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleApplyTemplate}
                  disabled={!template.isActive}
                  className={`flex items-center px-4 py-2 rounded-md font-medium ${
                    template.isActive
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  }`}
                  title={
                    template.isActive
                      ? "Apply this template"
                      : "Template is inactive"
                  }
                >
                  <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
                  Apply Template
                </button>
                <button
                  onClick={() => router.push(`/templates/${template.id}/edit`)}
                  className="flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md font-medium"
                >
                  <PencilIcon className="h-5 w-5 mr-2" />
                  Edit Template
                </button>
                <button
                  onClick={handleToggleTemplate}
                  className={`flex items-center px-4 py-2 rounded-md font-medium ${
                    template.isActive
                      ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {template.isActive ? (
                    <>
                      <XCircleIcon className="h-5 w-5 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Activate
                    </>
                  )}
                </button>
                
                {/* Delete Template Button with AlertDialog */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <button className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium">
                      <TrashIcon className="h-5 w-5 mr-2" />
                      Delete
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Template</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete the template "
                        <strong>{template.name}</strong>"? This action cannot be
                        undone. All tasks created from this template will remain.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteTemplate}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Template
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {template.description && (
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300">
                  {template.description}
                </p>
              </div>
            )}
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
            {/* Tasks List */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Tasks in this Template ({template.tasks?.length || 0})
                    </h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {template.tasks?.filter((t: any) => t.completed).length ||
                        0}{" "}
                      completed
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  {template.tasks && template.tasks.length > 0 ? (
                    <div className="space-y-4">
                      {template.tasks.map((task: any) => (
                        <div
                          key={task.id}
                          className={`p-4 rounded-lg border ${
                            task.completed
                              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                              : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          <div className="flex items-start">
                            <button
                              onClick={() => handleToggleTask(task.id)}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 mt-1 ${
                                task.completed
                                  ? "border-green-500 bg-green-500"
                                  : "border-gray-300 dark:border-gray-600"
                              }`}
                            >
                              {task.completed && (
                                <span className="text-white text-xs">✓</span>
                              )}
                            </button>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3
                                    className={`font-medium ${
                                      task.completed
                                        ? "text-green-800 dark:text-green-300 line-through"
                                        : "text-gray-900 dark:text-white"
                                    }`}
                                  >
                                    {task.title}
                                  </h3>
                                  {task.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {task.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`px-2 py-1 text-xs rounded-full ${
                                      task.priority === "high"
                                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                        : task.priority === "medium"
                                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                    }`}
                                  >
                                    {task.priority}
                                  </span>
                                  <button
                                    onClick={() =>
                                      router.push(`/tasks/${task.id}/edit`)
                                    }
                                    className="p-1 text-gray-400 hover:text-yellow-600 dark:text-gray-500"
                                    title="Edit"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  
                                  {/* Delete Task Button with AlertDialog */}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <button
                                        className="p-1 text-gray-400 hover:text-red-600 dark:text-gray-500"
                                        title="Delete"
                                        onClick={() => confirmDeleteTask(task.id, task.title)}
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                      </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete the task "
                                          <strong>{taskToDeleteName}</strong>"? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={handleDeleteTask}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Delete Task
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                                {task.frequency && (
                                  <div className="flex items-center">
                                    <ClockIcon className="h-4 w-4 mr-1" />
                                    {task.frequency}
                                  </div>
                                )}

                                {task.dueDate && (
                                  <div className="flex items-center">
                                    <CalendarDaysIcon className="h-4 w-4 mr-1" />
                                    {new Date(
                                      task.dueDate
                                    ).toLocaleDateString()}
                                  </div>
                                )}

                                <div className="flex items-center">
                                  <TagIcon className="h-4 w-4 mr-1" />
                                  {getCategoryLabel(task.category)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">📝</div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No tasks in this template
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        This template doesn't contain any tasks yet.
                      </p>
                      <button
                        onClick={() => router.push("/tasks/new")}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Task
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - Template Info */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  📊 Template Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </label>
                    <div className="mt-1">
                      <span
                        className={`px-3 py-1 text-sm rounded-full ${getStatusColor(
                          template.isActive
                        )}`}
                      >
                        {template.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {template.isActive
                        ? "This template can be applied to create tasks"
                        : "This template cannot be applied"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Category
                    </label>
                    <div className="mt-1">
                      <span
                        className={`px-3 py-1 text-sm rounded-full ${getCategoryColor(
                          template.category
                        )}`}
                      >
                        {getCategoryLabel(template.category)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Created
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {new Date(template.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Last Updated
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Task Statistics
                    </label>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Total Tasks:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {template.tasks?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Completed:
                        </span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {template.tasks?.filter((t: any) => t.completed)
                            .length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Pending:
                        </span>
                        <span className="font-medium text-orange-600 dark:text-orange-400">
                          {template.tasks?.filter((t: any) => !t.completed)
                            .length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  ⚡ Quick Actions
                </h3>

                <div className="space-y-3">
                  <button
                    onClick={handleApplyTemplate}
                    disabled={!template.isActive}
                    className={`w-full flex items-center justify-center p-3 rounded-lg transition-colors ${
                      template.isActive
                        ? "bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
                    Apply Template
                  </button>

                  <button
                    onClick={() =>
                      router.push(`/templates/${template.id}/edit`)
                    }
                    className="w-full flex items-center justify-center p-3 bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 rounded-lg transition-colors text-yellow-700 dark:text-yellow-400"
                  >
                    <PencilIcon className="h-5 w-5 mr-2" />
                    Edit Template
                  </button>

                  <button
                    onClick={handleToggleTemplate}
                    className={`w-full flex items-center justify-center p-3 rounded-lg transition-colors ${
                      template.isActive
                        ? "bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400"
                        : "bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400"
                    }`}
                  >
                    {template.isActive ? (
                      <>
                        <XCircleIcon className="h-5 w-5 mr-2" />
                        Deactivate Template
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Activate Template
                      </>
                    )}
                  </button>

                  <Link
                    href="/tasks/new"
                    className="w-full flex items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors text-blue-700 dark:text-blue-400"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add New Task
                  </Link>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                  💡 Tips
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  Templates help you create recurring tasks quickly. Apply this
                  template whenever you need to create this set of tasks again.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}