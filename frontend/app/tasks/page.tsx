// life-admin-assistant/frontend/app/tasks/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { taskApi } from "@/lib/api/profile";
import { templateApi } from "@/lib/api/template";
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
  CalendarDaysIcon,
  ClockIcon,
  TagIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ArrowsUpDownIcon,
  FireIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

// Shadcn Components
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
import { Button } from "@/components/ui/button";

export default function TasksPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [tasks, setTasks] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState({
    completed: undefined as boolean | undefined,
    templateId: undefined as number | undefined,
    priority: "" as string,
    sortBy: "dueDate" as string,
    sortOrder: "asc" as "asc" | "desc",
    search: "" as string,
  });
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
    highPriority: 0,
  });

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{
    id: number;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch templates dulu
      const templatesRes = await templateApi.getTemplates();
      setTemplates(templatesRes.templates);

      // Fetch tasks dengan filter
      const params: any = {};
      if (filter.completed !== undefined) {
        params.completed = filter.completed;
      }
      if (filter.templateId !== undefined) {
        params.templateId = filter.templateId;
      }
      if (filter.priority) {
        params.priority = filter.priority;
      }

      const tasksRes = await taskApi.getTasks(params);
      const allTasks = tasksRes.tasks;

      // Filter berdasarkan search
      let filteredTasks = allTasks;
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredTasks = allTasks.filter(
          (task: any) =>
            task.title.toLowerCase().includes(searchLower) ||
            (task.description &&
              task.description.toLowerCase().includes(searchLower)) ||
            (task.template?.name &&
              task.template.name.toLowerCase().includes(searchLower))
        );
      }

      // Helper function untuk priority sorting
      const getPriorityValue = (priority: string): number => {
        switch (priority) {
          case "high":
            return 0;
          case "medium":
            return 1;
          case "low":
            return 2;
          default:
            return 3;
        }
      };

      // Sort tasks
      let sortedTasks = [...filteredTasks];
      sortedTasks.sort((a, b) => {
        if (filter.sortBy === "dueDate") {
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return filter.sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        } else if (filter.sortBy === "priority") {
          const priorityA = getPriorityValue(a.priority);
          const priorityB = getPriorityValue(b.priority);
          return filter.sortOrder === "asc"
            ? priorityA - priorityB
            : priorityB - priorityA;
        } else if (filter.sortBy === "title") {
          return filter.sortOrder === "asc"
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title);
        }
        return 0;
      });

      setTasks(sortedTasks);

      // Calculate stats
      const today = new Date();
      const overdueCount = allTasks.filter(
        (task: any) =>
          !task.completed && task.dueDate && new Date(task.dueDate) < today
      ).length;

      const highPriorityCount = allTasks.filter(
        (task: any) => task.priority === "high"
      ).length;

      setStats({
        total: allTasks.length,
        pending: allTasks.filter((t: any) => !t.completed).length,
        completed: allTasks.filter((t: any) => t.completed).length,
        overdue: overdueCount,
        highPriority: highPriorityCount,
      });
    } catch (err: any) {
      console.error("Failed to fetch tasks:", err);
      const errorMessage = err.response?.data?.message || "Failed to load tasks";
      setError(errorMessage);
      toast.error("Failed to load tasks", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: number) => {
    try {
      await taskApi.toggleTaskComplete(taskId);
      fetchData();
      toast.success("Task status updated successfully!", {
        description: "The task status has been updated.",
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to update task";
      toast.error("Failed to update task", {
        description: errorMessage,
      });
    }
  };

  const openDeleteDialog = (taskId: number, taskTitle: string) => {
    setTaskToDelete({ id: taskId, title: taskTitle });
    setDeleteDialogOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      await taskApi.deleteTask(taskToDelete.id);
      
      toast.success("Task deleted successfully!", {
        description: `"${taskToDelete.title}" has been permanently deleted.`,
        duration: 4000,
        action: {
          label: "Undo",
          onClick: () => {
            // Note: Untuk undo, Anda perlu implementasi restoreTask di API
            toast.info("Undo functionality would be implemented here");
          },
        },
      });
      
      fetchData();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to delete task";
      toast.error("Failed to delete task", {
        description: errorMessage,
      });
    } finally {
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleViewTaskDetails = (taskId: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    router.push(`/tasks/${taskId}`);
  };

  const handleFilterChange = (key: keyof typeof filter, value: any) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter((prev) => ({ ...prev, search: e.target.value }));
  };

  const applyFilters = () => {
    fetchData();
    toast.info("Filters applied", {
      description: "Tasks have been filtered with your criteria.",
    });
  };

  const clearFilters = () => {
    setFilter({
      completed: undefined,
      templateId: undefined,
      priority: "",
      sortBy: "dueDate",
      sortOrder: "asc",
      search: "",
    });
    setShowFilters(false);
    fetchData();
    toast.info("Filters cleared", {
      description: "All filters have been reset.",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusIcon = (completed: boolean) => {
    return completed ? (
      <CheckCircleIcon className="h-5 w-5 text-green-500" />
    ) : (
      <XCircleIcon className="h-5 w-5 text-red-500" />
    );
  };

  const getDaysLeft = (dueDate: string) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateDisplay = (dueDate: string) => {
    if (!dueDate) return "No due date";

    const daysLeft = getDaysLeft(dueDate);
    const date = new Date(dueDate);

    let display = date.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    if (daysLeft !== null) {
      if (daysLeft < 0) {
        display = `${display} (${Math.abs(daysLeft)} days overdue)`;
      } else if (daysLeft === 0) {
        display = `${display} (Today!)`;
      } else if (daysLeft === 1) {
        display = `${display} (Tomorrow)`;
      } else {
        display = `${display} (in ${daysLeft} days)`;
      }
    }

    return display;
  };

  const getTaskStatus = (task: any) => {
    if (task.completed) return "completed";

    const daysLeft = getDaysLeft(task.dueDate);
    if (daysLeft === null) return "no-due-date";
    if (daysLeft < 0) return "overdue";
    if (daysLeft === 0) return "due-today";
    if (daysLeft <= 3) return "urgent";
    return "upcoming";
  };

  const getTaskStatusColor = (task: any) => {
    const status = getTaskStatus(task);
    switch (status) {
      case "completed":
        return "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20";
      case "overdue":
        return "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20";
      case "due-today":
        return "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20";
      case "urgent":
        return "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20";
      case "no-due-date":
        return "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800";
      default:
        return "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20";
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-gray-900 dark:text-white">
                Are you sure you want to delete this task?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                This action cannot be undone. The task{" "}
                <span className="font-semibold text-red-600 dark:text-red-400">
                  "{taskToDelete?.title}"
                </span>{" "}
                will be permanently removed from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button
                  variant="outline"
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  onClick={handleDeleteTask}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Task
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  📝 All Tasks
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Manage and organize all your tasks
                </p>
              </div>

              <Link
                href="/tasks/new"
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Task
              </Link>
            </div>
          </div>

          {/* Error & Success Messages */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => setError("")}
                className="float-right text-red-800 dark:text-red-300 hover:text-red-900"
              >
                ×
              </button>
            </div>
          )}

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={filter.search}
                onChange={handleSearchChange}
                placeholder="Search tasks by title, description, or template..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === "Enter" && applyFilters()}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  title="Toggle filters"
                >
                  <AdjustmentsHorizontalIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          {showFilters && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <FunnelIcon className="h-5 w-5 mr-2" />
                  Filters & Sorting
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={
                      filter.completed === undefined
                        ? ""
                        : filter.completed.toString()
                    }
                    onChange={(e) =>
                      handleFilterChange(
                        "completed",
                        e.target.value === ""
                          ? undefined
                          : e.target.value === "true"
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">All Status</option>
                    <option value="false">Pending</option>
                    <option value="true">Completed</option>
                  </select>
                </div>

                {/* Template Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Template/Category
                  </label>
                  <select
                    value={filter.templateId || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "templateId",
                        e.target.value === ""
                          ? undefined
                          : parseInt(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">All Templates</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={filter.priority}
                    onChange={(e) =>
                      handleFilterChange("priority", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sort By
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={filter.sortBy}
                      onChange={(e) =>
                        handleFilterChange("sortBy", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="dueDate">Due Date</option>
                      <option value="priority">Priority</option>
                      <option value="title">Title</option>
                      <option value="createdAt">Created Date</option>
                    </select>
                    <button
                      onClick={() =>
                        handleFilterChange(
                          "sortOrder",
                          filter.sortOrder === "asc" ? "desc" : "asc"
                        )
                      }
                      className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      title={
                        filter.sortOrder === "asc"
                          ? "Sort Ascending"
                          : "Sort Descending"
                      }
                    >
                      <ArrowsUpDownIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <span className="text-blue-600 dark:text-blue-400 text-2xl">
                    📋
                  </span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total Tasks
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.total}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                  <span className="text-yellow-600 dark:text-yellow-400 text-2xl">
                    ⏳
                  </span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Pending
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.pending}
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
                    Completed
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.completed}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Overdue
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.overdue}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <FireIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    High Priority
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.highPriority}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tasks ({tasks.length})
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={fetchData}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    title="Refresh"
                  >
                    <ArrowPathIcon className="h-5 w-5" />
                  </button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {filter.search && `Search: "${filter.search}"`}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📝</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No tasks found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {filter.search ||
                    Object.values(filter).some(
                      (v) => v !== undefined && v !== ""
                    )
                      ? "No tasks match your current filters"
                      : "Create your first task to get started"}
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Link
                      href="/tasks/new"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Add New Task
                    </Link>
                    {(filter.search ||
                      Object.values(filter).some(
                        (v) => v !== undefined && v !== ""
                      )) && (
                      <button
                        onClick={clearFilters}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => {
                    const status = getTaskStatus(task);
                    const daysLeft = getDaysLeft(task.dueDate);

                    return (
                      <div
                        key={task.id}
                        className={`border rounded-lg overflow-hidden transition-all hover:shadow-md ${getTaskStatusColor(
                          task
                        )}`}
                      >
                        {/* Task Header */}
                        <div
                          className={`p-4 cursor-pointer hover:bg-opacity-80 transition-all ${
                            task.completed ? "opacity-75" : ""
                          }`}
                          onClick={() =>
                            setExpandedTask(
                              expandedTask === task.id ? null : task.id
                            )
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleTask(task.id);
                                }}
                                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  task.completed
                                    ? "border-green-500 bg-green-500"
                                    : "border-gray-300 dark:border-gray-600 hover:border-blue-500"
                                }`}
                                title={
                                  task.completed
                                    ? "Mark as pending"
                                    : "Mark as complete"
                                }
                              >
                                {task.completed && (
                                  <span className="text-white text-xs">✓</span>
                                )}
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center">
                                  <h3
                                    className={`font-medium truncate ${
                                      task.completed
                                        ? "text-green-800 dark:text-green-300 line-through"
                                        : "text-gray-900 dark:text-white"
                                    }`}
                                    title={task.title}
                                  >
                                    {task.title}
                                  </h3>
                                  <div className="flex items-center ml-2 space-x-1">
                                    <span
                                      className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(
                                        task.priority
                                      )}`}
                                    >
                                      {task.priority}
                                    </span>
                                    {status === "overdue" && (
                                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                                        Overdue
                                      </span>
                                    )}
                                    {status === "due-today" && (
                                      <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                                        Today!
                                      </span>
                                    )}
                                    {status === "urgent" &&
                                      daysLeft &&
                                      daysLeft > 0 && (
                                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                                          {daysLeft}d
                                        </span>
                                      )}
                                  </div>
                                </div>

                                <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400 space-x-4 flex-wrap">
                                  {task.template?.name && (
                                    <span
                                      className="flex items-center"
                                      title="Template"
                                    >
                                      <TagIcon className="h-4 w-4 mr-1" />
                                      {task.template.name}
                                    </span>
                                  )}

                                  {task.dueDate && (
                                    <span
                                      className={`flex items-center ${
                                        daysLeft !== null && daysLeft < 0
                                          ? "text-red-600 dark:text-red-400"
                                          : daysLeft === 0
                                          ? "text-orange-600 dark:text-orange-400"
                                          : daysLeft && daysLeft <= 3
                                          ? "text-yellow-600 dark:text-yellow-400"
                                          : ""
                                      }`}
                                      title="Due Date"
                                    >
                                      <CalendarDaysIcon className="h-4 w-4 mr-1" />
                                      {getDueDateDisplay(task.dueDate)}
                                    </span>
                                  )}

                                  {task.frequency && (
                                    <span
                                      className="flex items-center"
                                      title="Frequency"
                                    >
                                      <ClockIcon className="h-4 w-4 mr-1" />
                                      {task.frequency === "daily"
                                        ? "Harian"
                                        : task.frequency === "weekly"
                                        ? "Mingguan"
                                        : task.frequency === "monthly"
                                        ? "Bulanan"
                                        : "Tahunan"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-2 ml-4">
                              {/* View Details Button */}
                              <button
                                onClick={(e) =>
                                  handleViewTaskDetails(task.id, e)
                                }
                                className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                title="View task details with AI insights"
                              >
                                <EyeIcon className="h-5 w-5" />
                              </button>

                              {/* Edit Button */}
                              <button
                                onClick={() =>
                                  router.push(`/tasks/${task.id}/edit`)
                                }
                                className="p-2 text-gray-500 hover:text-yellow-600 dark:text-gray-400 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-md transition-colors"
                                title="Edit task"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteDialog(task.id, task.title);
                                }}
                                className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                title="Delete task"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>

                              {/* Status Icon */}
                              {getStatusIcon(task.completed)}

                              {/* Expand/Collapse Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedTask(
                                    expandedTask === task.id ? null : task.id
                                  );
                                }}
                                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                                title={
                                  expandedTask === task.id
                                    ? "Collapse"
                                    : "Expand"
                                }
                              >
                                {expandedTask === task.id ? (
                                  <ChevronUpIcon className="h-5 w-5" />
                                ) : (
                                  <ChevronDownIcon className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedTask === task.id && (
                          <div className="px-4 pb-4 pt-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50">
                            <div className="pt-4">
                              {/* Description */}
                              {task.description && (
                                <div className="mb-4">
                                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Description
                                  </h4>
                                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    {task.description}
                                  </p>
                                </div>
                              )}

                              {/* Task Details Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Template Details
                                  </h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Template:
                                      </span>
                                      <span className="font-medium">
                                        {task.template?.name || "No Template"}
                                      </span>
                                    </div>
                                    {task.template?.description && (
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {task.template.description}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Task Info
                                  </h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Created:
                                      </span>
                                      <span className="text-sm">
                                        {new Date(
                                          task.createdAt
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Last Updated:
                                      </span>
                                      <span className="text-sm">
                                        {new Date(
                                          task.updatedAt
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                    {task.serviceType && (
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                          Service Type:
                                        </span>
                                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                          {task.serviceType}
                                        </span>
                                      </div>
                                    )}
                                    {task.serviceUrl && (
                                      <div className="mt-2">
                                        <a
                                          href={task.serviceUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                                        >
                                          <InformationCircleIcon className="h-4 w-4 mr-1" />
                                          Open Service Website
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                  onClick={() => handleToggleTask(task.id)}
                                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                  {task.completed
                                    ? "Mark as Pending"
                                    : "Mark Complete"}
                                </button>
                                <button
                                  onClick={(e) =>
                                    handleViewTaskDetails(task.id, e)
                                  }
                                  className="flex items-center px-4 py-2 text-sm border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                  <EyeIcon className="h-4 w-4 mr-2" />
                                  View Details
                                </button>
                                <button
                                  onClick={() =>
                                    router.push(`/tasks/${task.id}/edit`)
                                  }
                                  className="px-4 py-2 text-sm border border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/30 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => openDeleteDialog(task.id, task.title)}
                                  className="px-4 py-2 text-sm border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            {tasks.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {tasks.length} of {stats.total} tasks
                  </div>
                  <div className="flex space-x-2">
                    <button
                      disabled
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 text-gray-400 rounded cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      disabled
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 text-gray-400 rounded cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Tips */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <InformationCircleIcon className="h-5 w-5 mr-2" />
              Tips for Task Management
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                  <EyeIcon className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                  View Task Details
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click the eye icon to view detailed information, checklist,
                  and service links for any task.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                  <FunnelIcon className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                  Use Filters
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Use filters to quickly find specific tasks based on status,
                  template, or priority.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                  <TagIcon className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                  Organize with Templates
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create templates for recurring tasks to save time and maintain
                  consistency.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                  <CalendarDaysIcon className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                  Set Due Dates
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Always set due dates for tasks to enable automatic reminders
                  and better planning.
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                💡 <strong>Pro Tip:</strong> Click on any task to expand and see
                more details, or use the eye icon to view the full task page
                with checklist and service links.
              </p>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}