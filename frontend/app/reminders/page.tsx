// life-admin-assistant/frontend/app/reminders/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';
import { reminderApi, Reminder, DashboardReminders } from '@/lib/api/reminder';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { 
  BellIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  CheckBadgeIcon,
  EyeIcon,
  TrashIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowTopRightOnSquareIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface ReminderItem {
  id: number;
  taskId?: number;
  type: string;
  message: string;
  dueDate: string;
  createdAt?: string;
  updatedAt?: string;
  sent?: boolean;
  sentAt?: string;
  task?: {
    id: number;
    title: string;
    description?: string;
    priority?: string;
    completed?: boolean;
  };
  _type?: string;
  _source?: string;
}

export default function RemindersPage() {
  const { user } = useAuth();
  const [remindersData, setRemindersData] = useState<DashboardReminders | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState<'all' | 'overdue' | 'due_today' | 'upcoming'>('all');
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [expandedReminder, setExpandedReminder] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchReminders();
    }
  }, [user]);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await reminderApi.getDashboardReminders();
      console.log('Dashboard reminders data:', data);
      setRemindersData(data);
    } catch (err: any) {
      console.error('Failed to fetch reminders:', err);
      setError(err.response?.data?.message || 'Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (reminderId: number) => {
    try {
      setDeletingId(reminderId);
      await reminderApi.markAsRead(reminderId);
      setSuccess('Reminder marked as read');
      setTimeout(() => setSuccess(''), 3000);
      fetchReminders();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark reminder as read');
    } finally {
      setDeletingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!remindersData) return;

    try {
      setMarkingAll(true);
      
      // Collect all reminder IDs
      const allReminderIds = [
        ...remindersData.groupedReminders.overdue,
        ...remindersData.groupedReminders.due_today,
        ...remindersData.groupedReminders.upcoming
      ]
        .filter(reminder => !reminder.sent)
        .map(reminder => reminder.id);

      // Mark all as read
      for (const reminderId of allReminderIds) {
        await reminderApi.markAsRead(reminderId);
      }
      
      setSuccess('All reminders marked as read');
      setTimeout(() => setSuccess(''), 3000);
      fetchReminders();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const getFilteredItems = (): Reminder[] => {
    if (!remindersData) return [];
    
    switch (filter) {
      case 'overdue':
        return remindersData.groupedReminders.overdue;
      case 'due_today':
        return remindersData.groupedReminders.due_today;
      case 'upcoming':
        return remindersData.groupedReminders.upcoming;
      default:
        // Combine all reminders
        return [
          ...remindersData.groupedReminders.overdue,
          ...remindersData.groupedReminders.due_today,
          ...remindersData.groupedReminders.upcoming
        ];
    }
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'due_today':
      case 'due_today_task':
        return <BellIcon className="h-5 w-5 text-orange-500" />;
      case '1_day':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case '7_days':
        return <CalendarDaysIcon className="h-5 w-5 text-blue-500" />;
      case '30_days':
        return <CalendarDaysIcon className="h-5 w-5 text-green-500" />;
      case 'upcoming':
        return <CalendarDaysIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
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

  const getReminderColor = (type: string) => {
    switch (type) {
      case 'overdue':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'due_today':
      case 'due_today_task':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case '1_day':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case '7_days':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case '30_days':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'upcoming':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
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

  const getDaysLeft = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const diffTime = date.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      return 0;
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

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
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

  const counts = remindersData?.counts || {
    total: 0,
    overdue: 0,
    dueToday: 0,
    upcoming: 0
  };

  const filteredItems = getFilteredItems();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  🔔 Smart Reminders
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Showing only the most relevant reminder for each task
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchReminders}
                  className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm"
                  title="Refresh reminders"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                </button>
                
                {counts.total > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={markingAll}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {markingAll ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Marking all...
                      </>
                    ) : (
                      <>
                        <CheckBadgeIcon className="h-4 w-4 mr-2" />
                        Mark All as Read
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div 
                className={`bg-white dark:bg-gray-800 rounded-lg p-4 cursor-pointer transition-all ${filter === 'all' ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                onClick={() => setFilter('all')}
              >
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <BellIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">All Reminders</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {counts.total}
                    </p>
                  </div>
                </div>
              </div>

              <div 
                className={`bg-white dark:bg-gray-800 rounded-lg p-4 cursor-pointer transition-all ${filter === 'overdue' ? 'ring-2 ring-red-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                onClick={() => setFilter('overdue')}
              >
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Overdue</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {counts.overdue}
                    </p>
                  </div>
                </div>
              </div>

              <div 
                className={`bg-white dark:bg-gray-800 rounded-lg p-4 cursor-pointer transition-all ${filter === 'due_today' ? 'ring-2 ring-orange-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                onClick={() => setFilter('due_today')}
              >
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                    <BellIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Due Today</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {counts.dueToday}
                    </p>
                  </div>
                </div>
              </div>

              <div 
                className={`bg-white dark:bg-gray-800 rounded-lg p-4 cursor-pointer transition-all ${filter === 'upcoming' ? 'ring-2 ring-green-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                onClick={() => setFilter('upcoming')}
              >
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                    <CalendarDaysIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {counts.upcoming}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
              <div className="flex justify-between items-center">
                <span>{error}</span>
                <button onClick={() => setError('')} className="text-red-800 dark:text-red-300">
                  ×
                </button>
              </div>
            </div>
          )}
          
          {success && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-md">
              <div className="flex justify-between items-center">
                <span>{success}</span>
                <button onClick={() => setSuccess('')} className="text-green-800 dark:text-green-300">
                  ×
                </button>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {filter === 'all' ? 'All Reminders' : 
                     filter === 'overdue' ? 'Overdue Tasks' :
                     filter === 'due_today' ? 'Tasks Due Today' : 'Upcoming Tasks'}
                  </h2>
                  <div className="hidden sm:flex items-center text-sm">
                    <FunnelIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" />
                    <span className="text-gray-500 dark:text-gray-400">
                      Smart filtering applied
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {filteredItems.length} items
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No reminders found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {filter === 'all' 
                      ? "You don't have any reminders at the moment."
                      : filter === 'overdue'
                      ? "Great! You don't have any overdue tasks."
                      : filter === 'due_today'
                      ? "No tasks due today. You're all caught up!"
                      : "No upcoming tasks at the moment."
                    }
                  </p>
                  <Link
                    href="/tasks/new"
                    className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  >
                    Create New Task
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredItems.map((reminder) => {
                    const daysLeft = getDaysLeft(reminder.dueDate);
                    const isExpanded = expandedReminder === reminder.id;
                    
                    return (
                      <div 
                        key={reminder.id}
                        className={`p-4 rounded-lg border ${getReminderColor(reminder.type)} transition-all hover:shadow-md`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start flex-1">
                            <div className="mt-1">
                              {getReminderIcon(reminder.type)}
                            </div>
                            <div className="ml-4 flex-1">
                              <div className="flex items-center flex-wrap gap-2 mb-2">
                                <h3 className="font-medium text-gray-900 dark:text-white">
                                  {reminder.message}
                                </h3>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  reminder.type === 'overdue'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                    : reminder.type === 'due_today'
                                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
                                    : reminder.type === '1_day'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                    : reminder.type === '7_days'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                    : reminder.type === '30_days'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                                }`}>
                                  {getReminderTitle(reminder.type)}
                                </span>
                                
                                {reminder.task?.priority && (
                                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(reminder.task.priority)}`}>
                                    {reminder.task.priority}
                                  </span>
                                )}
                                
                                {reminder.task?.completed && (
                                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                    Completed
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center">
                                  <span className="mr-1">📅</span>
                                  <span>{formatDate(reminder.dueDate)}</span>
                                </div>
                                
                                <div className="flex items-center">
                                  <span className="mr-1">⏳</span>
                                  <span className={reminder.type === 'overdue' ? 'text-red-600 dark:text-red-400' : ''}>
                                    {getTimeText(reminder.type, daysLeft)}
                                  </span>
                                </div>
                                
                                {reminder.createdAt && (
                                  <div className="flex items-center">
                                    <span className="mr-1">⏰</span>
                                    <span>
                                      Created: {new Date(reminder.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {reminder.task && !isExpanded && (
                                <div className="mt-2">
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Task: <span className="font-medium">{reminder.task.title}</span>
                                  </p>
                                  {reminder.task.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                      {reminder.task.description}
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              {/* Expanded Details */}
                              {isExpanded && reminder.task && (
                                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Task Details:</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Title:</span>{' '}
                                        <span className="font-medium">{reminder.task.title}</span>
                                      </p>
                                      {reminder.task.description && (
                                        <p className="text-sm mt-2">
                                          <span className="text-gray-500 dark:text-gray-400">Description:</span>{' '}
                                          <span className="text-gray-700 dark:text-gray-300">{reminder.task.description}</span>
                                        </p>
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Status:</span>{' '}
                                        <span className={`font-medium ${
                                          reminder.task.completed 
                                            ? 'text-green-600 dark:text-green-400' 
                                            : 'text-orange-600 dark:text-orange-400'
                                        }`}>
                                          {reminder.task.completed ? 'Completed' : 'Pending'}
                                        </span>
                                      </p>
                                      <p className="text-sm mt-2">
                                        <span className="text-gray-500 dark:text-gray-400">Due Date:</span>{' '}
                                        <span className="font-medium">{formatDate(reminder.dueDate)}</span>
                                      </p>
                                      {reminder.task.priority && (
                                        <p className="text-sm mt-2">
                                          <span className="text-gray-500 dark:text-gray-400">Priority:</span>{' '}
                                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(reminder.task.priority)}`}>
                                            {reminder.task.priority}
                                          </span>
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {!reminder.sent && (
                              <button
                                onClick={() => handleMarkAsRead(reminder.id)}
                                disabled={deletingId === reminder.id}
                                className={`p-1 rounded ${deletingId === reminder.id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                title="Mark as read"
                              >
                                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                              </button>
                            )}
                            
                            {reminder.taskId && (
                              <Link
                                href={`/tasks/${reminder.taskId}`}
                                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                title="View task details"
                              >
                                <EyeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </Link>
                            )}
                            
                            <button
                              onClick={() => setExpandedReminder(isExpanded ? null : reminder.id)}
                              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              title={isExpanded ? "Show less" : "Show more"}
                            >
                              {isExpanded ? (
                                <ChevronUpIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                              ) : (
                                <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Footer */}
            {filteredItems.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {filteredItems.length} filtered items
                  </div>
                  <div className="flex items-center space-x-4">
                    <Link
                      href="/tasks"
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View All Tasks →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* System Explanation */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              💡 Smart Reminder System
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                  <InformationCircleIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">How it works</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    The system shows only the <strong>most relevant reminder</strong> for each task. 
                    For example, if a task is due in 5 days, only the "7 days" reminder will show, 
                    not the "30 days" reminder.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3">
                  <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Priority Order</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Reminders are shown in priority order: <strong>Overdue → Due Today → Upcoming</strong>.
                    This ensures you see the most urgent tasks first.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                  <BellIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Clean Interface</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    No more duplicate reminders! Each task shows only its <strong>most relevant reminder</strong>, 
                    making it easier to focus on what needs immediate attention.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Reminder Types */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-300">Overdue</span>
                </div>
                <p className="text-xs text-red-700 dark:text-red-400 mt-1">Tasks past their due date</p>
              </div>
              
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="flex items-center">
                  <BellIcon className="h-4 w-4 text-orange-600 dark:text-orange-400 mr-2" />
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-300">Due Today</span>
                </div>
                <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">Tasks due today</p>
              </div>
              
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Tomorrow</span>
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">Tasks due tomorrow</p>
              </div>
              
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-300">In 7 Days</span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">Tasks due in 7 days</p>
              </div>
              
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-300">In 30 Days</span>
                </div>
                <p className="text-xs text-green-700 dark:text-green-400 mt-1">Tasks due in 30 days</p>
              </div>
              
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-4 w-4 text-purple-600 dark:text-purple-400 mr-2" />
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-300">Upcoming</span>
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">All other upcoming tasks</p>
              </div>
            </div>
          </div>

          {/* Recent Reminders */}
          {remindersData?.recentReminders && remindersData.recentReminders.length > 0 && (
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  ⏰ Recent Notifications
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {remindersData.recentReminders.length} items
                </span>
              </div>
              
              <div className="space-y-3">
                {remindersData.recentReminders.map((reminder, index) => (
                  <div 
                    key={`recent-${reminder.id}-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center">
                      {getReminderIcon(reminder.type)}
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {reminder.message}
                        </p>
                        <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span className="mr-3">{reminder.formattedDate}</span>
                          <span className={`px-1.5 py-0.5 rounded-full ${
                            reminder.type === 'overdue'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                              : reminder.type === 'due_today'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
                              : reminder.type === '1_day'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                              : reminder.type === '7_days'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                              : reminder.type === '30_days'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                          }`}>
                            {reminder.type === 'overdue'
                              ? `Overdue ${Math.abs(reminder.daysLeft)} days`
                              : reminder.type === 'due_today'
                              ? 'Due today'
                              : reminder.type === '1_day'
                              ? 'Tomorrow'
                              : reminder.type === '7_days'
                              ? 'In 7 days'
                              : reminder.type === '30_days'
                              ? 'In 30 days'
                              : `In ${reminder.daysLeft} days`}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {!reminder.sent && (
                        <button
                          onClick={() => handleMarkAsRead(reminder.id)}
                          disabled={deletingId === reminder.id}
                          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Mark read
                        </button>
                      )}
                      
                      {reminder.taskId && (
                        <Link
                          href={`/tasks/${reminder.taskId}`}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          View
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                <Link
                  href="/dashboard"
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  View all notifications in dashboard →
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}