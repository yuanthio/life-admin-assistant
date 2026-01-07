// life-admin-assistant/frontend/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { profileApi, taskApi, DashboardData, Task } from "@/lib/api/profile";
import { reminderApi, DashboardReminders, Reminder } from "@/lib/api/reminder";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BellIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [remindersData, setRemindersData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSetupPrompt, setShowSetupPrompt] = useState(false);
  const [checkingTemplates, setCheckingTemplates] = useState(true);
  const [filter, setFilter] = useState<'all' | 'overdue' | 'due_today' | 'upcoming'>('all');

  useEffect(() => {
    if (user) {
      checkUserTemplates();
    }
  }, [user]);

  // Helper function untuk menghitung hari tersisa
  const getDaysLeft = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const diffTime = date.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      return 0;
    }
  };

  // Fungsi baru: Ambil reminder terdekat untuk setiap task
  const getNearestReminderForTask = (task: any) => {
    const daysLeft = getDaysLeft(task.dueDate);
    
    if (daysLeft < 0) {
      return {
        type: 'overdue',
        message: `⚠️ Task overdue: ${task.title}`,
        daysLeft
      };
    } else if (daysLeft === 0) {
      return {
        type: 'due_today',
        message: `🔔 Task due today: ${task.title}`,
        daysLeft
      };
    } else if (daysLeft === 1) {
      return {
        type: '1_day',
        message: `⏰ Task due tomorrow: ${task.title}`,
        daysLeft
      };
    } else if (daysLeft <= 7) {
      return {
        type: '7_days',
        message: `📅 Task due in ${daysLeft} days: ${task.title}`,
        daysLeft
      };
    } else if (daysLeft <= 30) {
      return {
        type: '30_days',
        message: `📅 Task due in ${daysLeft} days: ${task.title}`,
        daysLeft
      };
    } else {
      return null;
    }
  };

  // Fungsi untuk mendapatkan item yang difilter
  const getFilteredItems = () => {
    if (!remindersData) return [];
    
    switch (filter) {
      case 'overdue':
        return remindersData.overdue || [];
      case 'due_today':
        return remindersData.dueToday || [];
      case 'upcoming':
        return remindersData.upcoming || [];
      default:
        // Gabungkan semua data untuk filter 'all'
        const allItems = [];
        
        // Tambahkan reminder biasa (hanya yang terdekat per task)
        if (remindersData.reminders) {
          const taskMap = new Map<number, Reminder>();
          
          remindersData.reminders.forEach((reminder: Reminder) => {
            if (!reminder.taskId) return;
            
            const existing = taskMap.get(reminder.taskId);
            if (!existing) {
              taskMap.set(reminder.taskId, reminder);
            }
          });
          
          allItems.push(...Array.from(taskMap.values()).map(r => ({
            ...r,
            _type: r.type,
            _source: 'reminder'
          })));
        }
        
        // Tambahkan overdue tasks
        if (remindersData.overdue) {
          allItems.push(...remindersData.overdue.map((task: any) => ({
            ...task,
            _type: 'overdue',
            _source: 'task',
            message: `⚠️ Task overdue: ${task.title}`,
            dueDate: task.dueDate
          })));
        }
        
        // Tambahkan due today tasks
        if (remindersData.dueToday) {
          allItems.push(...remindersData.dueToday.map((task: any) => ({
            ...task,
            _type: 'due_today',
            _source: 'task',
            message: `🔔 Task due today: ${task.title}`,
            dueDate: task.dueDate
          })));
        }
        
        // Tambahkan upcoming tasks (hanya yang belum ada di reminder)
        if (remindersData.upcoming) {
          remindersData.upcoming.forEach((task: any) => {
            // Cek apakah task ini sudah ada di reminders
            const alreadyInReminders = remindersData.reminders?.some(
              (r: Reminder) => r.taskId === task.id
            );
            
            if (!alreadyInReminders) {
              allItems.push({
                ...task,
                _type: 'upcoming',
                _source: 'task',
                message: `📅 Upcoming task: ${task.title}`,
                dueDate: task.dueDate
              });
            }
          });
        }
        
        // Urutkan berdasarkan: overdue -> due_today -> tanggal terdekat
        return allItems.sort((a: any, b: any) => {
          const typeOrder: Record<string, number> = { 
            'overdue': 0, 
            'due_today': 1, 
            'due_today_task': 2,
            '1_day': 3, 
            '7_days': 4, 
            '30_days': 5,
            'upcoming': 6
          };
          
          const orderA = typeOrder[a._type] || 99;
          const orderB = typeOrder[b._type] || 99;
          
          if (orderA !== orderB) return orderA - orderB;
          
          const dateA = new Date(a.dueDate).getTime();
          const dateB = new Date(b.dueDate).getTime();
          return dateA - dateB;
        });
    }
  };

  // Fungsi untuk memeriksa apakah user sudah punya template
  const checkUserTemplates = async () => {
    try {
      setCheckingTemplates(true);
      const templateStatus = await profileApi.checkUserTemplates();
      
      console.log('User template status:', templateStatus);
      
      // Tampilkan setup prompt hanya jika user belum punya template sama sekali
      if (!templateStatus.hasTemplates) {
        setShowSetupPrompt(true);
      }
      
      // Setelah cek template, fetch data dashboard
      fetchDashboardData();
      fetchReminders();
      
    } catch (err: any) {
      console.error("Check templates error:", err);
      // Jika error, tetap lanjutkan fetch data
      fetchDashboardData();
      fetchReminders();
    } finally {
      setCheckingTemplates(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const data = await profileApi.getDashboardData();
      setDashboardData(data);
    } catch (err: any) {
      console.error("Dashboard error:", err);
      setError(err.message || "Failed to load dashboard data");
    }
  };

  const fetchReminders = async () => {
    try {
      // Menggunakan endpoint yang sudah ada (bukan /dashboard)
      const data = await reminderApi.getReminders();
      setRemindersData(data);
    } catch (err: any) {
      console.error("Reminders error:", err);
      setError(err.message || "Failed to load reminders");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: number) => {
    try {
      await taskApi.toggleTaskComplete(taskId);
      // Refresh data setelah update
      fetchDashboardData();
      fetchReminders();
    } catch (err) {
      console.error("Toggle task error:", err);
      setError("Failed to update task");
    }
  };

  const handleMarkReminderAsRead = async (reminderId: number) => {
    try {
      await reminderApi.markAsRead(reminderId);
      fetchReminders();
    } catch (err) {
      console.error("Mark reminder error:", err);
      setError("Failed to mark reminder as read");
    }
  };

  const handleMarkAllRemindersAsRead = async () => {
    try {
      if (remindersData?.reminders) {
        for (const reminder of remindersData.reminders) {
          if (!reminder.sent) {
            await reminderApi.markAsRead(reminder.id);
          }
        }
        fetchReminders();
      }
    } catch (err) {
      console.error("Mark all reminders error:", err);
      setError("Failed to mark all reminders as read");
    }
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case "overdue":
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case "due_today":
      case "due_today_task":
        return <BellIcon className="h-5 w-5 text-orange-500" />;
      case "1_day":
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case "7_days":
        return <CalendarDaysIcon className="h-5 w-5 text-blue-500" />;
      case "30_days":
        return <CalendarDaysIcon className="h-5 w-5 text-green-500" />;
      case "upcoming":
        return <CalendarDaysIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getReminderColor = (type: string) => {
    switch (type) {
      case "overdue":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case "due_today":
      case "due_today_task":
        return "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800";
      case "1_day":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
      case "7_days":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      case "30_days":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "upcoming":
        return "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800";
      default:
        return "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
    }
  };

  const getReminderTitle = (type: string) => {
    switch (type) {
      case 'overdue':
        return 'Overdue';
      case 'due_today':
      case 'due_today_task':
        return 'Due Today';
      case '1_day':
        return 'Tomorrow';
      case '7_days':
        return 'In 7 Days';
      case '30_days':
        return 'In 30 Days';
      case 'upcoming':
        return 'Upcoming';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getTimeText = (type: string, daysLeft: number) => {
    switch (type) {
      case 'overdue':
        return `Overdue ${Math.abs(daysLeft)} days`;
      case 'due_today':
      case 'due_today_task':
        return 'Due today';
      case '1_day':
        return 'Tomorrow';
      case '7_days':
        return 'In 7 days';
      case '30_days':
        return 'In 30 days';
      default:
        return `${daysLeft > 0 ? `In ${daysLeft} days` : `${Math.abs(daysLeft)} days ago`}`;
    }
  };

  if (checkingTemplates || loading) {
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

  const hasProfile = dashboardData?.profile;
  const pendingTasks = dashboardData?.pendingTasks || [];
  const completedTasks = dashboardData?.completedTasks || [];
  const stats = dashboardData?.stats || {
    totalPendingTasks: 0,
    totalCompletedTasks: 0,
    tasksByTemplate: {},
  };

  const remindersStats = remindersData?.stats || {
    totalReminders: 0,
    totalOverdue: 0,
    totalDueToday: 0,
    totalUpcoming: 0
  };

  const totalNotifications = remindersStats.totalReminders || 0;
  const hasOverdue = (remindersStats.totalOverdue || 0) > 0;
  const hasDueToday = (remindersStats.totalDueToday || 0) > 0;

  const filteredItems = getFilteredItems();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />

        {/* Banner Promo Setup jika belum punya template */}
        {showSetupPrompt && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-blue-200 dark:border-blue-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between">
                <div className="flex items-center mb-3 sm:mb-0">
                  <div className="flex-shrink-0 mr-3">
                    <span className="text-2xl">⚙️</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900 dark:text-blue-300">
                      Personalize Your Experience
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      Complete your profile to get customized templates and reminders
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      router.push("/setup");
                      setShowSetupPrompt(false);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Setup Now
                  </button>
                  <button
                    onClick={() => {
                      setShowSetupPrompt(false);
                    }}
                    className="border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
              {error}
              <button
                onClick={() => setError("")}
                className="float-right text-red-800 dark:text-red-300 hover:text-red-900"
              >
                ×
              </button>
            </div>
          )}

          {/* Welcome Section dengan Notifikasi */}
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Welcome back, {user?.name || user?.email}!
                </p>
              </div>

              <div className="flex items-center space-x-4">
                {/* Hapus tombol Edit Profile dari sini */}

                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 relative"
                  >
                    <BellIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    {totalNotifications > 0 && (
                      <span
                        className={`absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs flex items-center justify-center ${
                          hasOverdue
                            ? "bg-red-500 text-white"
                            : hasDueToday
                            ? "bg-orange-500 text-white"
                            : "bg-blue-500 text-white"
                        }`}
                      >
                        {totalNotifications > 9 ? "9+" : totalNotifications}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            Recent Notifications
                          </h3>
                          {totalNotifications > 0 && (
                            <button
                              onClick={handleMarkAllRemindersAsRead}
                              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {filteredItems.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                            No notifications
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredItems.slice(0, 5).map((item: any) => {
                              const daysLeft = getDaysLeft(item.dueDate);
                              return (
                                <div
                                  key={item.id || `item-${item._type}-${item.taskId}`}
                                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                    !item.sent
                                      ? "bg-blue-50/50 dark:bg-blue-900/10"
                                      : ""
                                  }`}
                                >
                                  <div className="flex items-start">
                                    {getReminderIcon(item._type)}
                                    <div className="ml-3 flex-1">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {item.message || item.title}
                                      </p>
                                      <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        <span
                                          className={`px-2 py-1 rounded-full ${
                                            item._type === 'overdue'
                                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                              : item._type === 'due_today' || item._type === 'due_today_task'
                                              ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                                              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                          }`}
                                        >
                                          {getTimeText(item._type, daysLeft)}
                                        </span>
                                        <span className="ml-2">
                                          {formatDate(item.dueDate)}
                                        </span>
                                      </div>
                                      {item.task && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          Task: {item.task.title}
                                        </p>
                                      )}
                                    </div>
                                    {!item.sent && item.id && (
                                      <button
                                        onClick={() =>
                                          handleMarkReminderAsRead(item.id)
                                        }
                                        className="ml-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                      >
                                        Mark as read
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <Link
                          href="/reminders"
                          className="block text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          onClick={() => setShowNotifications(false)}
                        >
                          View all notifications
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Section dengan Reminder Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
              <div 
                className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push('/tasks')}
              >
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
                      {stats.totalPendingTasks + stats.totalCompletedTasks}
                    </p>
                  </div>
                </div>
              </div>

              <div 
                className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push('/tasks?status=pending')}
              >
                <div className="flex items-center">
                  <div
                    className={`p-3 rounded-lg ${
                      hasOverdue
                        ? "bg-red-100 dark:bg-red-900"
                        : "bg-yellow-100 dark:bg-yellow-900"
                    }`}
                  >
                    <ExclamationTriangleIcon
                      className={`h-6 w-6 ${
                        hasOverdue
                          ? "text-red-600 dark:text-red-400"
                          : "text-yellow-600 dark:text-yellow-400"
                      }`}
                    />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Pending
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.totalPendingTasks}
                    </p>
                  </div>
                </div>
              </div>

              <div 
                className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push('/tasks?status=completed')}
              >
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
                      {stats.totalCompletedTasks}
                    </p>
                  </div>
                </div>
              </div>

              <div 
                className={`rounded-xl shadow p-6 cursor-pointer hover:shadow-md transition-shadow ${
                  hasOverdue
                    ? "bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800"
                    : hasDueToday
                    ? "bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800"
                    : "bg-white dark:bg-gray-800"
                }`}
                onClick={() => router.push('/reminders')}
              >
                <div className="flex items-center">
                  <div
                    className={`p-3 rounded-lg ${
                      hasOverdue
                        ? "bg-red-100 dark:bg-red-900"
                        : hasDueToday
                        ? "bg-orange-100 dark:bg-orange-900"
                        : "bg-purple-100 dark:bg-purple-900"
                    }`}
                  >
                    <BellIcon
                      className={`h-6 w-6 ${
                        hasOverdue
                          ? "text-red-600 dark:text-red-400"
                          : hasDueToday
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-purple-600 dark:text-purple-400"
                      }`}
                    />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Reminders
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {totalNotifications}
                    </p>
                  </div>
                </div>
                {hasOverdue && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    {remindersStats.totalOverdue || 0} overdue tasks!
                  </p>
                )}
                {hasDueToday && !hasOverdue && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                    {remindersStats.totalDueToday || 0} due today
                  </p>
                )}
              </div>

              <div 
                className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push('/templates')}
              >
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
                    <span className="text-purple-600 dark:text-purple-400 text-2xl">
                      🏷️
                    </span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Templates
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Object.keys(stats.tasksByTemplate).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Pending Tasks & Reminders */}
            <div className="lg:col-span-2 space-y-8">
              {/* Reminders Section */}
              {totalNotifications > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      🔔 Upcoming Reminders
                    </h2>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400 mr-4">
                        Showing {filteredItems.length} filtered items
                      </span>
                      <Link
                        href="/reminders"
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        View All
                      </Link>
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex space-x-2 mb-6">
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        filter === 'all'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilter('overdue')}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        filter === 'overdue'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Overdue ({remindersStats.totalOverdue || 0})
                    </button>
                    <button
                      onClick={() => setFilter('due_today')}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        filter === 'due_today'
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Due Today ({remindersStats.totalDueToday || 0})
                    </button>
                    <button
                      onClick={() => setFilter('upcoming')}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        filter === 'upcoming'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Upcoming ({remindersStats.totalUpcoming || 0})
                    </button>
                  </div>

                  {/* Reminders List */}
                  {filteredItems.length === 0 ? (
                    <div className="text-center py-8">
                      <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        {filter === 'all' 
                          ? "You don't have any reminders at the moment."
                          : filter === 'overdue'
                          ? "Great! You don't have any overdue tasks."
                          : filter === 'due_today'
                          ? "No tasks due today. You're all caught up!"
                          : "No upcoming tasks at the moment."
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredItems.slice(0, 5).map((item: any) => {
                        const daysLeft = getDaysLeft(item.dueDate);
                        return (
                          <div 
                            key={item.id || `item-${item._type}-${item.taskId}`}
                            className={`p-4 rounded-lg border ${getReminderColor(item._type)}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start flex-1">
                                <div className="mt-1">
                                  {getReminderIcon(item._type)}
                                </div>
                                <div className="ml-4 flex-1">
                                  <div className="flex items-center flex-wrap gap-2 mb-2">
                                    <h3 className="font-medium text-gray-900 dark:text-white">
                                      {item.message || item.title}
                                    </h3>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      item._type === 'overdue'
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                        : item._type === 'due_today' || item._type === 'due_today_task'
                                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
                                        : item._type === '1_day'
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                        : item._type === '7_days'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                        : item._type === '30_days'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                                    }`}>
                                      {getReminderTitle(item._type)}
                                    </span>
                                  </div>
                                  
                                  {item.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                      {item.description}
                                    </p>
                                  )}
                                  
                                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center">
                                      <span className="mr-1">📅</span>
                                      <span>{formatDate(item.dueDate)}</span>
                                    </div>
                                    
                                    <div className="flex items-center">
                                      <span className="mr-1">⏳</span>
                                      <span className={item._type === 'overdue' ? 'text-red-600 dark:text-red-400' : ''}>
                                        {getTimeText(item._type, daysLeft)}
                                      </span>
                                    </div>
                                    
                                    {item.category && (
                                      <div className="flex items-center">
                                        <span className="mr-1">🏷️</span>
                                        <span>
                                          {item.category === 'personal_docs' ? 'Dokumen Pribadi' : 'Rumah Tangga'}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {item.priority && (
                                      <div className="flex items-center">
                                        <span className="mr-1">🎯</span>
                                        <span className={`font-medium ${
                                          item.priority === 'high' ? 'text-red-600 dark:text-red-400' :
                                          item.priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                                          'text-green-600 dark:text-green-400'
                                        }`}>
                                          {item.priority}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2 ml-4">
                                {!item.sent && item.id && (
                                  <button
                                    onClick={() => handleMarkReminderAsRead(item.id)}
                                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                    title="Mark as read"
                                  >
                                    <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                                  </button>
                                )}
                                
                                {item.id && (
                                  <Link
                                    href={item._source === 'task' ? `/tasks/${item.id}` : `/tasks/${item.taskId}`}
                                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                    title="View details"
                                  >
                                    <span className="text-blue-600 dark:text-blue-400">View</span>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Info tentang sistem reminder baru */}
                  {filteredItems.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        💡 <strong>Smart Reminder System:</strong> Showing only the nearest reminder for each task. 
                        No more duplicate reminders for the same task.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Pending Tasks Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    📝 Pending Tasks
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {pendingTasks.length} tasks
                  </span>
                </div>

                {pendingTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🎉</div>
                    <p className="text-gray-600 dark:text-gray-400">
                      There are no pending tasks. All completed!
                    </p>
                    <Link
                      href="/tasks/new"
                      className="mt-4 inline-block text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      Add new task →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <button
                          onClick={() => handleToggleTask(task.id)}
                          className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center mr-4 hover:border-blue-500"
                        >
                          {task.completed ? (
                            <span className="text-blue-600">✓</span>
                          ) : null}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {task.title}
                              </h3>
                              {task.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {task.description}
                                </p>
                              )}
                            </div>
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
                          </div>

                          <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center mr-4">
                              <span className="mr-1">🏷️</span>
                              {task.template?.name || "No Template"}
                            </span>
                            {task.frequency && (
                              <span className="flex items-center mr-4">
                                <span className="mr-1">🔄</span>
                                {task.frequency === "daily"
                                  ? "Harian"
                                  : task.frequency === "weekly"
                                  ? "Mingguan"
                                  : task.frequency === "monthly"
                                  ? "Bulanan"
                                  : "Tahunan"}
                              </span>
                            )}
                            {task.dueDate && (
                              <span className="flex items-center">
                                <span className="mr-1">📅</span>
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Lihat semua tasks → */}
                {pendingTasks.length > 0 && (
                  <div className="mt-6 text-center">
                    <Link
                      href="/tasks"
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                    >
                      Lihat semua tasks →
                    </Link>
                  </div>
                )}
              </div>

              {/* Tasks by Template Overview */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  📊 Tasks by Template
                </h2>
                <div className="space-y-4">
                  {Object.entries(stats.tasksByTemplate).map(
                    ([template, count]) => (
                      <div key={template} className="flex items-center">
                        <div className="w-48">
                          <span className="text-gray-700 dark:text-gray-300">
                            {template}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{
                                width: `${
                                  (Number(count) / (stats.totalPendingTasks || 1)) * 100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="w-10 text-right">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {count}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                  {Object.keys(stats.tasksByTemplate).length === 0 && (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      No tasks organized by template yet
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Profile & Quick Actions */}
            <div className="space-y-8">
              {/* Profile Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  👤 Profile Summary
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Email
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {user?.email}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Name
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {user?.name || "Not set"}
                    </p>
                  </div>

                  {dashboardData?.profile ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                          Anggota Keluarga
                        </label>
                        <p className="mt-1 text-gray-900 dark:text-white">
                          {dashboardData.profile.householdSize} orang
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                          Dokumen Aktif
                        </label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {dashboardData.profile.hasIdCard && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs rounded-full">
                              KTP
                            </span>
                          )}
                          {dashboardData.profile.hasDrivingLicense && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs rounded-full">
                              SIM
                            </span>
                          )}
                          {dashboardData.profile.hasPassport && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 text-xs rounded-full">
                              Paspor
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        ℹ️ Profile has not been setup.
                        <Link
                          href="/setup"
                          className="ml-1 underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          Click here to setup
                        </Link>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  ⚡ Quick Actions
                </h2>

                <div className="space-y-3">
                  <Link
                    href="/tasks/new"
                    className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                  >
                    <span className="text-2xl mr-3">➕</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Add New Task
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/templates"
                    className="flex items-center p-3 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition-colors"
                  >
                    <span className="text-2xl mr-3">📋</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Manage Templates
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/reminders"
                    className="flex items-center p-3 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition-colors"
                  >
                    <span className="text-2xl mr-3">🔔</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        View All Reminders
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/setup"
                    className="w-full flex items-center p-3 bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 rounded-lg transition-colors text-left"
                  >
                    <span className="text-2xl mr-3">⚙️</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {hasProfile
                          ? "Update Profile"
                          : "Complete Profile Setup"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {hasProfile
                          ? "Change profile data"
                          : "Setup profile for the best experience"}
                      </p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Recent Completed Tasks */}
              {completedTasks.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    ✅ Recently Completed
                  </h2>

                  <div className="space-y-3">
                    {completedTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3">
                          <span className="text-green-600 dark:text-green-400">
                            ✓
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white line-through">
                            {task.title}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <span className="mr-2">
                              {new Date(task.updatedAt).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span className="ml-2">
                              {task.template?.name || "No Template"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {completedTasks.length > 3 && (
                    <div className="mt-4 text-center">
                      <Link
                        href="/tasks?completed=true"
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm"
                      >
                        Lihat semua yang selesai →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}