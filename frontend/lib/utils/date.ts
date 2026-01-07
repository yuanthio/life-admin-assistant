// life-admin-assistant/frontend/lib/utils/date.ts
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

export const isOverdue = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  
  // Set time to 00:00:00 for accurate comparison
  const dueDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  return dueDate < todayDate;
};

export const isFuture = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  
  // Set time to 00:00:00 for accurate comparison
  const dueDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  return dueDate > todayDate;
};

export const getDaysLeft = (dateString: string): number => {
  const date = new Date(dateString);
  const today = new Date();
  
  // Set time to 00:00:00
  const dueDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const diffTime = dueDate.getTime() - todayDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

export const getReminderStatus = (dateString: string, type: string): string => {
  const daysLeft = getDaysLeft(dateString);
  
  if (type === 'overdue') {
    return `Overdue ${Math.abs(daysLeft)} days`;
  } else if (type === 'due_today') {
    return 'Due today';
  } else if (type === '1_day') {
    return '1 day left';
  } else if (type === '7_days') {
    return '7 days left';
  } else if (type === '30_days') {
    return '30 days left';
  } else {
    return `${daysLeft} days left`;
  }
};