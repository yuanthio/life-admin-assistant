// life-admin-assistant/frontend/app/templates/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { templateApi, Template } from "@/lib/api/template";
import { taskApi } from "@/lib/api/profile";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";
import Link from "next/link";
import { toast } from "sonner"; // Import sonner toast
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  ArrowPathIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
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
  DialogTrigger,
} from "@/components/ui/dialog";

export default function TemplatesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<{
    show: boolean;
    templateId: number | null;
    templateName: string;
  }>({
    show: false,
    templateId: null,
    templateName: "",
  });

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError("");
      const params: any = {};

      if (filter !== "all") {
        params.isActive = filter === "active";
      }

      const response = await templateApi.getTemplates(params);
      console.log("Templates data:", response);
      setTemplates(response.templates);
    } catch (err: any) {
      console.error("Failed to fetch templates:", err);
      const errorMessage = err.response?.data?.message || "Failed to load templates";
      setError(errorMessage);
      toast.error("Failed to load templates", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (!newTemplate.name.trim()) {
        throw new Error("Template name is required");
      }

      await toast.promise(
        templateApi.createTemplate(newTemplate),
        {
          loading: "Creating template...",
          success: () => {
            setShowCreateDialog(false);
            setNewTemplate({
              name: "",
              description: "",
            });
            fetchTemplates();
            return "Template created successfully!";
          },
          error: (err: any) => {
            return err.message ||
              err.response?.data?.message ||
              "Failed to create template";
          },
        }
      );
    } catch (err: any) {
      const errorMessage = err.message ||
        err.response?.data?.message ||
        "Failed to create template";
      setError(errorMessage);
      toast.error("Failed to create template", {
        description: errorMessage,
      });
    }
  };

  const handleDeleteTemplate = async () => {
    if (!showDeleteDialog.templateId) return;

    try {
      await toast.promise(
        templateApi.deleteTemplate(showDeleteDialog.templateId),
        {
          loading: "Deleting template...",
          success: () => {
            setShowDeleteDialog({ show: false, templateId: null, templateName: "" });
            fetchTemplates();
            return `Template "${showDeleteDialog.templateName}" deleted successfully!`;
          },
          error: (err: any) => {
            return err.response?.data?.message || "Failed to delete template";
          },
        }
      );
    } catch (err: any) {
      console.error("Delete failed:", err);
    }
  };

  const handleToggleTemplate = async (templateId: number) => {
    const template = templates.find(t => t.id === templateId);
    const isCurrentlyActive = template?.isActive;
    
    try {
      await toast.promise(
        templateApi.toggleTemplate(templateId),
        {
          loading: "Updating template status...",
          success: () => {
            fetchTemplates();
            return `Template ${isCurrentlyActive ? "deactivated" : "activated"} successfully!`;
          },
          error: (err: any) => {
            return err.response?.data?.message || "Failed to update template";
          },
        }
      );
    } catch (err: any) {
      console.error("Toggle failed:", err);
    }
  };

  const handleApplyTemplate = async (templateId: number) => {
    const template = templates.find(t => t.id === templateId);
    
    try {
      await toast.promise(
        templateApi.applyTemplate(templateId),
        {
          loading: "Applying template...",
          success: (response: any) => {
            fetchTemplates();
            const taskCount = response.tasks?.length || 0;
            if (taskCount > 0) {
              return `Template applied successfully! Created ${taskCount} new task${taskCount > 1 ? 's' : ''}.`;
            } else {
              return "Template applied successfully! No new tasks were created.";
            }
          },
          error: (err: any) => {
            return err.response?.data?.message || "Failed to apply template";
          },
        }
      );
    } catch (err: any) {
      console.error("Apply failed:", err);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
  };

  const filteredTemplates = templates.filter((template) => {
    if (filter === "active") return template.isActive;
    if (filter === "inactive") return !template.isActive;
    return true;
  });

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

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  📋 Manage Templates
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Templates act as categories for your tasks. Create and manage
                  them here.
                </p>
              </div>

              <Dialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
              >
                <DialogTrigger asChild>
                  <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    New Template
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-white">
                      Create New Template
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-gray-400">
                      Create a new template that will act as a category for your
                      tasks
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleCreateTemplate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Template Name *
                      </label>
                      <input
                        type="text"
                        value={newTemplate.name}
                        onChange={(e) =>
                          setNewTemplate({
                            ...newTemplate,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                        placeholder="e.g., Dokumen Pribadi, Rumah Tangga, Proyek Kerja"
                        required
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={newTemplate.description}
                        onChange={(e) =>
                          setNewTemplate({
                            ...newTemplate,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                        placeholder="Describe what tasks belong in this template/category..."
                      />
                    </div>

                    <DialogFooter className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowCreateDialog(false)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                      >
                        Create Template
                      </button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <span className="text-blue-600 dark:text-blue-400 text-2xl">
                      📋
                    </span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Total Templates
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {templates.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
                    <span className="text-green-600 dark:text-green-400 text-2xl">
                      ✅
                    </span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Active
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {templates.filter((t) => t.isActive).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
                    <span className="text-purple-600 dark:text-purple-400 text-2xl">
                      📝
                    </span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Total Tasks
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {templates.reduce(
                        (acc, template) => acc + (template.tasks?.length || 0),
                        0
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setFilter("all");
                    fetchTemplates();
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => {
                    setFilter("active");
                    fetchTemplates();
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === "active"
                      ? "bg-green-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => {
                    setFilter("inactive");
                    fetchTemplates();
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === "inactive"
                      ? "bg-red-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  Inactive
                </button>
              </div>

              <button
                onClick={() => {
                  fetchTemplates();
                }}
                className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Refresh
              </button>
            </div>
          </div>

          {/* Error Alert */}
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
                  onClick={() => setError("")}
                  className="text-red-800 dark:text-red-300 hover:text-red-900 dark:hover:text-red-400"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No templates found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {filter !== "all"
                    ? "No templates match your current filters"
                    : "Create your first template to get started"}
                </p>
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Template
                </button>
                {filter !== "all" && (
                  <button
                    onClick={() => {
                      setFilter("all");
                      fetchTemplates();
                    }}
                    className="inline-flex items-center px-4 py-2 ml-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200"
                >
                  {/* Header */}
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {template.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                              template.isActive
                            )}`}
                          >
                            {template.isActive ? "Active" : "Inactive"}
                          </span>
                          {template.tasks && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {template.tasks.length} tasks
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() =>
                            router.push(`/templates/${template.id}/edit`)
                          }
                          className="p-1 text-gray-500 hover:text-yellow-600 dark:text-gray-400 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded transition-colors"
                          title="Edit template"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleToggleTemplate(template.id)}
                          className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                          title={template.isActive ? "Deactivate" : "Activate"}
                        >
                          {template.isActive ? (
                            <CheckCircleIcon className="h-5 w-5" />
                          ) : (
                            <XCircleIcon className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            setShowDeleteDialog({
                              show: true,
                              templateId: template.id,
                              templateName: template.name,
                            })
                          }
                          className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Delete template"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {template.description && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                        {template.description}
                      </p>
                    )}

                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        Created: {new Date(template.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Tasks Preview */}
                  <div className="p-6">
                    {template.tasks && template.tasks.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Recent Tasks:
                        </h4>
                        <ul className="space-y-2">
                          {template.tasks.slice(0, 3).map((task) => (
                            <li key={task.id} className="flex items-start">
                              <span className="text-gray-400 mr-2">•</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {task.title}
                              </span>
                            </li>
                          ))}
                          {template.tasks.length > 3 && (
                            <li className="text-sm text-gray-500 dark:text-gray-500">
                              + {template.tasks.length - 3} more tasks
                            </li>
                          )}
                        </ul>
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No tasks in this template yet
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between">
                      <button
                        onClick={() => router.push(`/templates/${template.id}`)}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                      <button
                        onClick={() => handleApplyTemplate(template.id)}
                        disabled={!template.isActive}
                        className={`flex items-center text-sm transition-colors ${
                          template.isActive
                            ? "text-green-600 hover:text-green-800 dark:text-green-400 hover:underline"
                            : "text-gray-400 cursor-not-allowed"
                        }`}
                        title={
                          template.isActive
                            ? "Apply template to create tasks"
                            : "Template is inactive"
                        }
                      >
                        <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                        Apply Template
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={showDeleteDialog.show}
          onOpenChange={(open) =>
            setShowDeleteDialog({ ...showDeleteDialog, show: open })
          }
        >
          <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-gray-900 dark:text-white">
                Delete Template
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete the template "
                <strong className="text-red-600 dark:text-red-400">
                  {showDeleteDialog.templateName}
                </strong>
                "? This action cannot be undone. All tasks created from this template will
                remain.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div
              className="flex items-center p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-red-900/20 dark:text-red-400"
              role="alert"
            >
              <svg
                className="flex-shrink-0 inline w-4 h-4 mr-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">Warning!</span> This action cannot
                be undone.
              </div>
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Cancel
                </button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <button
                  onClick={handleDeleteTemplate}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  Delete Template
                </button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AuthGuard>
  );
}