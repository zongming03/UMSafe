/**
 * Date utility functions
 */

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getDateRange = (option) => {
  const today = new Date();
  let start, end;
  
  switch (option) {
    case "today":
      start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      break;
    case "week":
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      start = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
      end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      break;
    case "month":
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
      break;
    case "all":
    default:
      start = end = null;
      break;
  }
  
  return { start, end };
};

export const isDateInRange = (date, rangeStart, rangeEnd) => {
  if (!rangeStart || !rangeEnd) return true;
  const d = new Date(date);
  return d >= rangeStart && d <= rangeEnd;
};
